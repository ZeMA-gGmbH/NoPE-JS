/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { IJsonSchema } from "../types/IJSONSchema";
import { INopeDescriptor } from "../types/nope";
import {
  deepEqual,
  flattenObject,
  rgetattr,
  rsetattr,
  SPLITCHAR,
} from "./objectMethods";
import { replaceAll } from "./stringMethods";

/**
 * Function to Flatten a JSON-Schema.
 * @param schema
 */
export function nestSchema(schema: IJsonSchema) {
  let counter = 10000;
  let flattenSchema = flattenObject(schema);

  const getRefKeys = (flattenSchema: Map<string, any>) => {
    const relevantKeys: Array<{ schemaPath: string; searchPath: string }> = [];

    for (const [key, value] of flattenSchema) {
      if (key.endsWith("$ref")) {
        relevantKeys.push({
          schemaPath: key,
          searchPath: value.replace("#/", "").replace("/", SPLITCHAR),
        });
      }
    }
    return relevantKeys;
  };

  let refs = getRefKeys(flattenSchema);
  while (refs.length > 0) {
    counter--;

    if (counter === 0) {
      throw Error("Max amount of Recursions performed");
    }

    for (const ref of refs) {
      const subSchema = rgetattr(schema, ref.searchPath, null, ".");
      rsetattr(schema, ref.schemaPath.replace(".$ref", ""), subSchema);
    }

    flattenSchema = flattenObject(schema);
    refs = getRefKeys(flattenSchema);
  }

  return schema as IJsonSchema;
}

/**
 * Function to get a Schemas Definition
 * @param schema the JSON-Schema
 * @param reference the path of the relevant definition.
 */
export function schemaGetDefinition(schema: IJsonSchema, reference: string) {
  return rgetattr(schema, reference.replace("#/", ""), null, "/");
}

/**
 * A Helper to flatten a schema. This will add additional "$ref" items instead of nested items.
 * This will perhaps help to reduce the amount of data.
 *
 * @author M.Karkowski
 * @export
 * @param {IJsonSchema} schema The Schema used as input. This will be flattend
 * @param {string} [prePath="root"] The Name of the Schema. It is used for the "main" definition
 * @param {string} [postPath=""] An additional path for every item which is added to the name. example "msg"
 * @param {*} [splitChar=SPLITCHAR] The char to split the elements.
 * @param {IJsonSchema} [definitions={ definitions: {} }] A Set of defintions to be used.
 * @return {IJsonSchema} The Adapted Item.
 */
export function flattenSchema(
  schema: IJsonSchema,
  prePath: string = "root",
  postPath: string = "",
  splitChar = SPLITCHAR,
  definitions: IJsonSchema = { definitions: {} }
): IJsonSchema {
  const _postPath = postPath ? splitChar + postPath : postPath;

  if (Array.isArray(schema.items)) {
    for (const [idx, item] of schema.items.entries()) {
      // We only want to adapt more complex datatypes.
      if (item.type === "object" || item.type === "array") {
        const ref = prePath + splitChar + "items" + splitChar + idx.toString();

        definitions = flattenSchema(
          item,
          ref,
          postPath,
          splitChar,
          definitions
        );

        schema.items[idx] = {
          type: item.type,
          $ref: ref + _postPath,
        };
      }
    }
  } else if (schema.items) {
    if (schema.items.type === "object" || schema.items.type === "array") {
      const ref = prePath + splitChar + "items";

      definitions = flattenSchema(
        schema.items,
        ref,
        postPath,
        splitChar,
        definitions
      );

      schema.items = {
        type: schema.items.type,
        $ref: ref + _postPath,
      };
    }
  }

  if (
    typeof schema.additionalItems === "object" &&
    (schema.additionalItems.type === "object" ||
      schema.additionalItems.type === "array")
  ) {
    const ref = prePath + splitChar + "additionalItems";

    definitions = flattenSchema(
      schema.additionalItems,
      ref,
      postPath,
      splitChar,
      definitions
    );

    schema.additionalProperties = {
      type: schema.additionalItems.type,
      $ref: ref,
    };
  }

  for (const key in schema.properties || {}) {
    const item = schema.properties[key];

    if (item.type === "object" || item.type === "array") {
      const ref = prePath + splitChar + key;

      definitions = flattenSchema(item, ref, postPath, splitChar, definitions);

      schema.properties[key] = {
        type: item.type,
        $ref: ref + _postPath,
      };
    }
  }

  if (
    typeof schema.additionalProperties === "object" &&
    (schema.additionalProperties.type === "object" ||
      schema.additionalProperties.type === "array")
  ) {
    const ref = prePath + splitChar + "additionalProperties";

    definitions = flattenSchema(
      schema.additionalProperties,
      ref,
      postPath,
      splitChar,
      definitions
    );

    schema.additionalProperties = {
      type: schema.additionalProperties.type,
      $ref: ref,
    };
  }

  if (schema.oneOf) {
    for (const [idx, item] of schema.oneOf.entries()) {
      if (item.type === "object" || item.type === "array") {
        const ref = prePath + splitChar + "oneOf" + splitChar + idx.toString();

        definitions = flattenSchema(
          item,
          ref,
          postPath,
          splitChar,
          definitions
        );

        schema.items[idx] = {
          type: item.type,
          $ref: ref,
        };
      }
    }
  }

  if (schema.allOf) {
    for (const [idx, item] of schema.allOf.entries()) {
      if (item.type === "object" || item.type === "array") {
        const ref = prePath + splitChar + "allOf" + splitChar + idx.toString();

        definitions = flattenSchema(
          item,
          ref,
          postPath,
          splitChar,
          definitions
        );

        schema.items[idx] = {
          type: item.type,
          $ref: ref,
        };
      }
    }
  }

  if (schema.anyOf) {
    for (const [idx, item] of schema.anyOf.entries()) {
      if (item.type === "object" || item.type === "array") {
        const ref = prePath + splitChar + "anyOf" + splitChar + idx.toString();

        definitions = flattenSchema(
          item,
          ref,
          postPath,
          splitChar,
          definitions
        );

        schema.items[idx] = {
          type: item.type,
          $ref: ref,
        };
      }
    }
  }

  definitions.definitions[prePath + splitChar + postPath] = schema;

  return definitions;
}

/**
 * Helper to generate a name for the combined schemas.
 *
 * @author M.Karkowski
 * @param {IJsonSchema} schema The base schema, containing all definitions.
 * @param {string[]} names The names of the defintions, which should be combined.
 * @return {string} The combined name.
 */
function _defaultCombiner(schema: IJsonSchema, names: string[]): string {
  for (const name of names) {
    const item = schema.definitions[name];
    if (item.title) {
      return item.title;
    }
  }
  return names[0];
}

/**
 * Helper Function to reduce the Schema and remove multiple definitions.
 * @param schema
 * @param getName
 * @returns
 */
export function reduceSchema(
  schema: IJsonSchema,
  getName: (schema: IJsonSchema, names: string[]) => string = _defaultCombiner
) {
  if (schema.definitions) {
    /**
     * Helper to find equals definitions.
     * @param candidateName Name of the candidate to use as reference
     * @returns
     */
    function _findDuplicates(candidateName) {
      const equals: string[] = [];
      const candidate = schema.definitions[candidateName];

      for (const name in schema.definitions) {
        const item = schema.definitions[name];

        if (candidateName === name) {
          continue;
        }

        if (deepEqual(item, candidate)) {
          equals.push(name);
        }
      }

      if (equals.length > 0) {
        equals.push(candidateName);
      }

      return equals;
    }

    // We want to check every definition, whether there exists a
    // a pair that matches.
    let toTest = Object.keys(schema.definitions);

    // As long as we have items to test, we try to look for enties,
    // that are equal.
    while (toTest.length) {
      const candidateName = toTest.pop();

      // Therefore we look for equal elements.
      const equalDefintionIds = _findDuplicates(candidateName);

      // If we found some, we define the new name and remove double enteties.
      if (equalDefintionIds.length) {
        const newName = getName(schema, equalDefintionIds);

        // Our first loop will remove the double enteties:
        let first = true;
        for (const name of equalDefintionIds) {
          if (first) {
            continue;
          }

          first = false;

          delete schema.default[name];
        }

        // The Second loop is used to update the references.
        for (const name of equalDefintionIds) {
          schema = JSON.parse(
            replaceAll(
              JSON.stringify(schema),
              JSON.stringify(name),
              JSON.stringify(newName)
            )
          );
        }

        toTest = Object.keys(schema.definitions);
      }
    }
    return schema;
  } else {
    return schema;
  }
}

const _isNopeDescriptor: Array<
  [keyof INopeDescriptor, (value: any) => boolean]
> = [
  [
    "type",
    (value) => {
      return value === "function";
    },
  ],
  [
    "inputs",
    (value) => {
      return typeof value === "object";
    },
  ],
  [
    "outputs",
    (value) => {
      return typeof value === "object";
    },
  ],
];

/**
 * A Helper Function, to test, if the given schema is a JSON Schema or whether it contains a method description
 *
 * @param { INopeDescriptor | IJsonSchema } schema The Schema to Test
 * @returns {boolean}
 */
export function isJsonSchema(schema: INopeDescriptor | IJsonSchema): boolean {
  for (const [attr, test] of _isNopeDescriptor) {
    if (test(schema[attr])) {
      return false;
    }
  }

  // Object-Related Test-Cases.
  if (
    schema.type == "object" ||
    (Array.isArray(schema.type) && schema.type.includes("object"))
  ) {
    if (schema.properties) {
      for (const key in schema.properties) {
        if (!isJsonSchema(schema.properties[key])) {
          return false;
        }
      }
    }
    if (schema.patternProperties) {
      for (const key in schema.patternProperties) {
        if (!isJsonSchema(schema.patternProperties[key])) {
          return false;
        }
      }
    }
    if (schema.dependencies) {
      for (const key in schema.dependencies) {
        if (
          typeof schema.dependencies[key] !== "string" &&
          !isJsonSchema(schema.dependencies[key] as INopeDescriptor)
        ) {
          return false;
        }
      }
    }
  }

  //
  for (const key of ["allOf", "anyOf", "oneOf"]) {
    if (schema[key]) {
      for (const subSchema of schema[key]) {
        if (!isJsonSchema(subSchema)) {
          return false;
        }
      }
    }
  }

  if (
    schema.type == "array" ||
    (Array.isArray(schema.type) && schema.type.includes("array"))
  ) {
    if (Array.isArray(schema.items)) {
      for (const key in schema.items) {
        if (!isJsonSchema(schema.items[key])) {
          return false;
        }
      }
    } else if (!isJsonSchema(schema.items)) {
      return false;
    }

    // Test the Additional Items.
    if (typeof schema.additionalItems === "object") {
      if (!isJsonSchema(schema.additionalItems)) {
        return false;
      }
    }
  }

  return true;
}
