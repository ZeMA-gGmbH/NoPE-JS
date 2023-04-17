/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-11-11 11:36:37
 * @modify date 2021-11-11 11:36:37
 * @desc [description]
 */

import { readFile } from "fs/promises";
import * as handlebars from "handlebars";
import { ILogger } from "js-logger";
import { join, relative } from "path";
import { createFile, createPath } from "../../helpers/fileMethods";
import { deepClone } from "../../helpers/objectMethods";
import { replaceAll } from "../../helpers/stringMethods";
import { IJsonSchema } from "../../types/IJSONSchema";
import { INopeDescriptorFunctionParameter } from "../../types/nope/nopeDescriptor.interface";
import {
  IServiceOptions,
  IParsableDescription,
} from "../../types/nope/nopeModule.interface";

/**
 * Helper function to merge the Parameters into 1 description.
 * @param elements
 */
function _unifySchema(
  elements: INopeDescriptorFunctionParameter[],
  options: {
    sharedDefinitions: boolean;
    logger?: ILogger;
  }
) {
  const ret: IJsonSchema = {
    type: "object",
    properties: {},
    required: [],
  };

  for (const item of elements) {
    if (options.sharedDefinitions) {
      item.schema.definitions = undefined;
      item.schema.$schema = undefined;
    }

    // Assign the Schema
    ret.properties[item.name] = item.schema as any as IJsonSchema;

    // If the Element is Optional,
    if (!item.optional) {
      ret.required.push(item.name);
    }
  }

  return ret;
}

/**
 * Function, to parse a description to an Open-API Element.
 * @param description
 * @param options
 */
export async function parseModuleToOpenAPI(
  description: IParsableDescription,
  options: {
    outputDir: string;
    sharedDefinitions: boolean;
    mode: "js" | "ts";
    logger?: ILogger;
  }
): Promise<void> {
  const _description = deepClone(description);

  // load the Template.
  const template = await readFile(
    join(
      process.cwd(),
      "lib",
      "parsers",
      "open-api",
      "templates",
      "method." + options.mode + ".handlebars"
    ),
    {
      encoding: "utf-8",
    }
  );

  // Renderfuncting
  const renderAPI = handlebars.compile(template);

  await createPath(join(options.outputDir));

  // Now iterate over the Methods of the Module and find parsable Methods.
  for (const [idx, method] of _description.methods.entries()) {
    // Test if the Method contains some functions in the input / Output:
    const parsedInputs = JSON.stringify(method.schema.inputs);
    const parsedOutput = JSON.stringify(method.schema.outputs);
    if (
      !parsedInputs.includes('"function"') &&
      !parsedOutput.includes('"function"')
    ) {
      // The Method should be parseable.

      // 1. Specify the Mode (No Params =  GET, else POST)
      (method as any).mode = method.schema.inputs.length > 0 ? "POST" : "GET";

      (method as any).required = method.schema.inputs
        .filter((param) => {
          return !param.optional;
        })
        .map((param) => param.name);
      (method as any).hasInput = method.schema.inputs.length > 0;

      // Now adapt the Schema of the Method.
      // Iterate over the Inputs, add a Description if not provided
      // And determine whehter the Parameters are required or not.
      method.schema.inputs = method.schema.inputs.map((param) => {
        // Provide a Description. (If not provided)
        param.description = param.description || "Not provided";

        if (options.sharedDefinitions) {
          param.schema.definitions = undefined;
          param.schema.$schema = undefined;
        }

        // Parse the Schema in here.
        (param as any).parsedSchema = JSON.stringify(param.schema);

        return param;
      });

      // Make shure the Return type isnt an array
      method.schema.outputs = Array.isArray(method.schema.outputs)
        ? _unifySchema(method.schema.outputs, options)
        : method.schema.outputs;

      if (options.sharedDefinitions) {
        method.schema.outputs.definitions = undefined;
        method.schema.outputs.$schema = undefined;
      }

      // Add an Description to the result.
      (method as any).resultDescription =
        method.schema.outputs.description || "Not Provided";
      // And add a Schema for the Return type.
      (method as any).parsedOutput = JSON.stringify(method.schema.outputs);
      (method as any).parsedInput = JSON.stringify(
        _unifySchema(method.schema.inputs, options)
      );
      (method as any).hasInput = method.schema.inputs.length > 0;
      (method as any).tag = description.name;

      // Determine the Filename.
      const fileDir = join(
        options.outputDir,
        _description.name,
        "{instance}",
        "methods"
      );
      const fileName = join(fileDir, method.id + "." + options.mode);

      // Determine the Import Pathes.
      const imports = [
        {
          dir: join(process.cwd(), "lib", "types", "nope"),
          fileName: "nopeDispatcher.interface",
          name: "pathOfDispatcher",
        },
        {
          dir: join(process.cwd(), "lib", "helpers"),
          fileName: "dispatcherPathes",
          name: "pathOfHelper",
        },
      ];

      for (const imp of imports) {
        const relativDir = relative(fileDir, imp.dir);
        (method as any)[imp.name] = replaceAll(
          join(relativDir, imp.fileName),
          "\\",
          "/"
        );
      }

      // Write down the Schema:
      await createFile(
        // Generate the Path.
        fileName,
        renderAPI(method)
      );

      if (options.logger) {
        options.logger.info("Generated -> " + fileName);
      }
    } else if (options.logger) {
      options.logger.warn(
        'parser can not convert: "' +
          description.name +
          "." +
          method.id +
          '". The Function contains functions as parameters'
      );
    }
  }
}

/**
 * Function, to parse a description to an Open-API Element.
 * @param description
 * @param options
 */
export async function parseFunctionToOpenAPI(
  description: IServiceOptions,
  options: {
    outputDir: string;
    sharedDefinitions: boolean;
    mode: "js" | "ts";
    logger?: ILogger;
  }
): Promise<void> {
  const _description = deepClone(description);

  // load the Template.
  const template = await readFile(
    join(
      process.cwd(),
      "lib",
      "parsers",
      "open-api",
      "templates",
      "function." + options.mode + ".handlebars"
    ),
    {
      encoding: "utf-8",
    }
  );

  // Renderfuncting
  const renderAPI = handlebars.compile(template);

  await createPath(join(options.outputDir));

  // Now iterate over the Methods of the Module and find parsable Methods.
  // Test if the Method contains some functions in the input / Output:
  const parsedInputs = JSON.stringify(_description.schema.inputs);
  const parsedOutput = JSON.stringify(_description.schema.outputs);
  if (
    !parsedInputs.includes('"function"') &&
    !parsedOutput.includes('"function"')
  ) {
    // The Method should be parseable.

    // 1. Specify the Mode (No Params =  GET, else POST)
    (_description as any).mode =
      _description.schema.inputs.length > 0 ? "POST" : "GET";

    // Now adapt the Schema of the Method.
    // Iterate over the Inputs, add a Description if not provided
    // And determine whehter the Parameters are required or not.
    _description.schema.inputs = _description.schema.inputs.map((param) => {
      // Provide a Description. (If not provided)
      param.description = param.description || "Not provided";

      if (options.sharedDefinitions) {
        param.schema.definitions = undefined;
        param.schema.$schema = undefined;
      }

      // Parse the Schema in here.
      (param as any).parsedSchema = JSON.stringify(param.schema);

      return param;
    });

    // Make shure the Return type isnt an array
    _description.schema.outputs = Array.isArray(_description.schema.outputs)
      ? _unifySchema(_description.schema.outputs, options)
      : _description.schema.outputs;

    if (options.sharedDefinitions) {
      _description.schema.outputs.definitions = undefined;
      _description.schema.outputs.$schema = undefined;
    }

    // Add an Description to the result.
    (_description as any).resultDescription =
      _description.schema.outputs.description || "Not Provided";
    // And add a Schema for the Return type.
    (_description as any).parsedOutput = JSON.stringify(
      _description.schema.outputs
    );
    (_description as any).tag = "generic-services";
    (_description as any).parsedInput = JSON.stringify(
      _unifySchema(_description.schema.inputs, options)
    );
    (_description as any).hasInput = _description.schema.inputs.length > 0;
    (_description as any).required = _description.schema.inputs
      .filter((param) => !param.optional)
      .map((param) => param.name);
    (_description as any).name = _description.id;

    // Determine the Filename.
    const fileDir = join(options.outputDir, "generic-services");
    const fileName = join(fileDir, _description.id + "." + options.mode);

    // Determine the Import Pathes.
    const imports = [
      {
        dir: join(process.cwd(), "lib", "types", "nope"),
        fileName: "nopeDispatcher.interface",
        name: "pathOfDispatcher",
      },
    ];

    for (const imp of imports) {
      const relativDir = relative(fileDir, imp.dir);
      (_description as any)[imp.name] = replaceAll(
        join(relativDir, imp.fileName),
        "\\",
        "/"
      );
    }

    // Write down the Schema:
    await createFile(
      // Generate the Path.
      fileName,
      renderAPI(_description)
    );

    if (options.logger) {
      options.logger.info("Generated -> " + fileName);
    }
  } else if (options.logger) {
    options.logger.warn(
      'parser can not convert: "' +
        _description.id +
        '". The Function contains functions as parameters'
    );
  }
}
