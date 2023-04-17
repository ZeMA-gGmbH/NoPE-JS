/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-09 16:22:51
 * @modify date 2020-11-10 13:34:25
 * @desc [description]
 */

import * as handlebars from "handlebars";
import { join } from "path";
import * as TJS from "typescript-json-schema";
import { createFile } from "../../helpers/fileMethods";
import { schemaGetDefinition } from "../../helpers/jsonSchemaMethods";
import { deepClone } from "../../helpers/objectMethods";
import { replaceAll } from "../../helpers/stringMethods";
import { IJsonSchema } from "../../types/IJSONSchema";
import { ITypeInformation } from "./types/ITypeInformation";

export async function getSchemaForProperty(
  param: ITypeInformation,
  options: {
    tempDir: string;
  }
) {
  // After all files has been written => Generate the Schemas:
  const _settings: TJS.PartialArgs = {
    required: true,
  };

  // Options for the TJS.Compiler;
  const compilerOptions: TJS.CompilerOptions = {
    strictNullChecks: true,
    skipLibCheck: true,
  };

  // Create an Interface describing the Return Type
  // Because we asume, that we allways return a promise
  // like object => we just consider the simplifiedSubType
  // Unluckily, is a defered setter, getter and content provided
  // therefore we split the information in 3 sub types.
  const usedTypes = {
    internalType: replaceAll(param.simplifiedSubType, " ", "").split(",")[0],
    setterType: replaceAll(param.simplifiedSubType, " ", "").split(",")[1],
    getterType: replaceAll(param.simplifiedSubType, " ", "").split(",")[2],
  };

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
export type INTERNAL = {{{internalType}}};
export type SETTER = {{{setterType}}};
export type GETTER = {{{getterType}}};
{{/unless}}

` +
      ""
  );

  await createFile(
    join(options.tempDir, "param.ts"),
    // join(options.tempDir, 'param.ts'),
    render(Object.assign(usedTypes, param))
  );

  const _program = TJS.getProgramFromFiles(
    [join(options.tempDir, "param.ts")],
    compilerOptions
  );

  // We can either get the schema for one file and one type...
  let _schema = JSON.parse(
    JSON.stringify(TJS.generateSchema(_program, "*", _settings))
  ) as any as IJsonSchema;

  // Create Copies of the Getters and Setters
  const s = deepClone(_schema);
  const g = deepClone(_schema);
  const i = deepClone(_schema);
  const ret = {
    getter: Object.assign(
      {},
      g,
      schemaGetDefinition(g, "#/definitions/GETTER")
    ),
    setter: Object.assign(
      {},
      s,
      schemaGetDefinition(s, "#/definitions/SETTER")
    ),
    internal: Object.assign(
      {},
      i,
      schemaGetDefinition(i, "#/definitions/INTERNAL")
    ),
  };
  return ret;
}
