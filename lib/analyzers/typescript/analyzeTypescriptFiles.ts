/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 17:54:43
 * @modify date 2020-11-10 16:27:42
 * @desc [description]
 */

import { ILogger } from "js-logger";
import { ISystemElements } from "../../types/ISystemElements";
import {
  IServiceOptions,
  IEventOptions,
} from "../../types/nope/nopeModule.interface";
import {
  NAME_EMITTER_DEC,
  NAME_METHOD_DEC,
  NAME_PROP_DEC,
} from "./defaults/names";
import { getSchemaForFunction } from "./getSchemaForFunction";
import { getSchemaForProperty } from "./getSchemaForProperty";
import { analyzeNopeModules } from "./helpers/analyzeNopeModules";

/**
 * Helper Function to extract the descriptions of typescript files.
 * Therefore the used typescript config will be used and the desired
 * path will be checked.
 *
 * @export
 * @param options Additional Options.
 * @param ret If wanted, a existing Definition is extended.
 * @return {*}
 */
export async function extractDefinitions(
  options: {
    inputDir: string;
    tsConfig: string;
    tempDir: string;
    // A Logger.
    logger?: ILogger;
  },
  ret: ISystemElements = {
    services: [],
    modules: [],
    generalInformationModel: {},
  }
) {
  const modules = await analyzeNopeModules(options);

  // Iterate over every function and add it to the description file.
  for (const func of modules.functions) {
    if (options.logger) {
      options.logger.info("Found the Function: " + func.name);
    }

    // Push the Element and overwrite the ID.
    ret.services.push(
      Object.assign(
        {
          // Generate a Default Schema
          schema: await getSchemaForFunction(func, options),
        },
        // Use the original decorator Settings.
        func.decoratorSettings,
        {
          // Use the determined Function name.
          id: func.name,
        }
      )
    );
  }

  // Iterate over every Module.
  // Detail the Functions and the Properties of the Classes.
  for (const mod of modules.classes) {
    if (options.logger) {
      options.logger.debug("Converting: " + mod.className);
    }

    const moduleDefinition: {
      name: string;
      properties: IEventOptions[];
      events: IEventOptions[];
      methods: IServiceOptions[];
    } = {
      name: mod.className,
      methods: [],
      events: [],
      properties: [],
    };

    for (const method of mod.methods) {
      if (options.logger) {
        options.logger.debug(
          "Converting: " + mod.className + "." + method.name
        );
      }

      const methodDefintion: IServiceOptions = method.decoratorSettings[
        NAME_METHOD_DEC
      ] as IServiceOptions;
      methodDefintion.id = methodDefintion.id || method.name;

      if (
        (method.decoratorSettings[NAME_METHOD_DEC] as IServiceOptions)?.schema
      ) {
        // a schema is present => Just use the Provided Schema.
        methodDefintion.schema = (
          method.decoratorSettings[NAME_METHOD_DEC] as IServiceOptions
        )?.schema;
      } else if (method.decoratorSettings[NAME_METHOD_DEC]) {
        // Assign the Schema
        methodDefintion.schema = await getSchemaForFunction(method, options);
      }

      // Push the Element.
      moduleDefinition.methods.push(methodDefintion);
    }

    // Iterate over the Emitters and the "Properties"
    for (const [accessor, decoratorName] of [
      ["events", NAME_EMITTER_DEC],
      ["properties", NAME_PROP_DEC],
    ]) {
      for (const property of mod[accessor]) {
        if (options.logger) {
          options.logger.debug(
            "Converting: " + mod.className + "." + property.name
          );
        }

        const propertyDefinition: IEventOptions = property.decoratorSettings[
          decoratorName
        ] as IEventOptions;

        propertyDefinition.topic = propertyDefinition.topic || property.name;

        if (
          (property.decoratorSettings[decoratorName] as IEventOptions)?.schema
        ) {
          // a schema is present => Just use the Provided Schema.
          propertyDefinition.schema = (
            property.decoratorSettings[decoratorName] as IEventOptions
          )?.schema;
        } else if (property.decoratorSettings[decoratorName]) {
          // Store the flattend schema and extracted Schema of the Element.
          propertyDefinition.schema = await getSchemaForProperty(
            property,
            options
          );
        }

        // Push the Element.
        moduleDefinition[accessor].push(propertyDefinition);
      }
    }

    // Store the Class
    ret.modules.push(moduleDefinition);
  }

  ret.generalInformationModel = modules.generalModel;

  return ret;
}
