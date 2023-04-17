/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-09 16:22:51
 * @modify date 2020-11-11 08:39:33
 * @desc [description]
 */

import * as handlebars from "handlebars";
import { join } from "path";
import * as TJS from "typescript-json-schema";
import { createFile } from "../../helpers/fileMethods";
import {
  nestSchema,
  schemaGetDefinition,
} from "../../helpers/jsonSchemaMethods";
import { deepClone } from "../../helpers/objectMethods";
import { IJsonSchema } from "../../types/IJSONSchema";
import { INopeDescriptor } from "../../types/nope/nopeDescriptor.interface";
import { ITypeInformation } from "./types/ITypeInformation";

/**
 *Helper Function to extract a Schema.
 *
 * @param {ITypeInformation} param
 * @param {{
 *     tempDir: string
 * }} options
 * @return {*}
 */
async function _getSchema(
  param: ITypeInformation,
  options: {
    tempDir: string;
  }
) {
  if (param.simplifiedSubType === "void") {
    return {};
  }

  // Options for the TJS.Compiler;
  const compilerOptions: TJS.CompilerOptions = {
    strictNullChecks: true,
    skipLibCheck: true,
  };

  // After all files has been written => Generate the Schemas:
  const _settings: TJS.PartialArgs = {
    required: true,
  };

  // Create an Interface describing the Parameter:
  const render = handlebars.compile(
    "" +
      `
{{#if imports.required}}
{{{imports.content}}}
{{/if}}

{{authorDescription}}
{{#if isBaseType}}
export type PARAM = {{{originalCode}}};
{{/if}}
{{#unless isBaseType}}
export type PARAM = {{{simplifiedSubType}}};
{{/unless}}

` +
      ""
  );

  await createFile(
    join(options.tempDir, "temp.ts"),
    // join(options.tempDir, 'param.ts'),
    render(param)
  );

  const _program = TJS.getProgramFromFiles(
    [join(options.tempDir, "temp.ts")],
    compilerOptions
  );

  // We can either get the schema for one file and one type...
  let _schema = JSON.parse(
    JSON.stringify(TJS.generateSchema(_program, "*", _settings))
  ) as any as IJsonSchema;

  try {
    // Try to flatten the Schema:
    _schema = nestSchema(deepClone(_schema));
    return schemaGetDefinition(_schema, "#/definitions/PARAM");
  } catch (error) {
    // Failed to flatten the schema. it seams that it is an recursive one.
    return Object.assign(
      {},
      deepClone(_schema),
      schemaGetDefinition(_schema, "#/definitions/PARAM")
    );
  }
}

/**
 * Returns a Schema for a Function:
 *
 * @export
 * @param {ITypeInformation} param
 * @param {{
 *     tempDir: string
 * }} options
 * @return {*}
 */
export async function getSchemaForFunction(
  param: ITypeInformation,
  options: {
    tempDir: string;
  }
) {
  if (param.baseType !== "function") {
    return await _getSchema(param, options);
  } else {
    const schemaMapping: INopeDescriptor = {
      type: "function",
      description: "",
      inputs: [],
      outputs: [],
    };

    // Try to define the Descriptor:
    // Therefore iterate over the Elements:
    for (const _param of param.parameters) {
      schemaMapping.inputs.push({
        name: _param.name,
        optional: _param.isOptional,
        description: "",
        schema: await getSchemaForFunction(_param, options),
      });
    }

    // If there exists a return type => extract its schema.
    if (param.returnType) {
      schemaMapping.outputs = await _getSchema(param.returnType, options);
    }

    // Return the defined Types.
    return schemaMapping;
  }
}
