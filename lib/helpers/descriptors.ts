/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { INopeDescriptor } from "../types/nope";
import { isJsonSchema } from "./jsonSchemaMethods";
import { SPLITCHAR } from "./objectMethods";

/**
 * Helper, to parse a {@link INopeDescriptor} to a
 * @param schema
 * @param toJSONSchema
 * @param workWithRefs
 * @param definitions
 * @returns
 */
export function parseFunctionToJsonSchema(
  schema: INopeDescriptor,
  toJSONSchema = true,
  workWithRefs = true,
  definitions: { [index: string]: INopeDescriptor } = {},
  prePathInput: string = "input",
  prePathOutput: string = "output",
  splitChar: string = SPLITCHAR
) {
  if (schema.type === "function") {
    const inputSchema: INopeDescriptor = {
      type: "object",
      properties: {},
      required: [],
      definitions: {},
    };

    /**
     * A Helper Function, to parse the Parameter
     * @param schemaToStore
     * @param name
     * @param optional
     * @param schema
     * @param preString
     */
    function parseParameter(
      schemaToStore: INopeDescriptor,
      name: string,
      optional: boolean,
      schema: INopeDescriptor,
      preString: string,
      isInput: boolean
    ) {
      if (toJSONSchema && !isJsonSchema(schema)) {
        throw Error("Schema contains functions as paramter");
      }

      if (isInput) order.push(name);

      if (!optional) {
        schemaToStore.required.push(name);
      }

      if (workWithRefs) {
        const ref = preString ? preString + splitChar + name : name;

        // store the id.
        ids.push(ref);

        // We only want to store the Reference.
        schemaToStore.properties[name] = {
          $ref: ref,
        };

        // Now store the element as Reference
        schema["$id"] = ref;
        definitions[ref] = schema;
      } else {
        schemaToStore.properties[name] = schema;
      }
    }

    const order: string[] = [];
    const ids: string[] = [];

    for (const input of schema.inputs || []) {
      parseParameter(
        inputSchema,
        input.name,
        input.optional,
        input.schema,
        prePathInput,
        true
      );
    }

    // Now lets store the
    definitions[prePathInput] = inputSchema;

    if (Array.isArray(schema.outputs)) {
      const outputSchema: INopeDescriptor = {
        type: "object",
        properties: {},
        required: [],
        definitions: {},
      };

      for (const output of schema.outputs) {
        parseParameter(
          outputSchema,
          output.name,
          output.optional,
          output.schema,
          prePathOutput,
          false
        );
      }

      definitions[prePathInput] = outputSchema;
    } else if (schema.outputs) {
      if (toJSONSchema && !isJsonSchema(schema.outputs)) {
        throw Error("Output contains a Function => it can not be parsed");
      }

      definitions[prePathOutput] = schema.outputs;
    }

    return {
      definitions,
      order,
      ids,
      inputId: prePathInput,
      outputId: prePathOutput,
    };
  } else {
    throw Error("Expecting a function");
  }
}
