/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-10-12 18:26:59
 * @modify date 2020-11-05 17:58:11
 * @desc [description]
 */

/**
 * Valid Descriptor types
 */
export type INopeDescriptorSchemaBaseTypes =
  | "string"
  | "number"
  | "integer"
  | "object"
  | "array"
  | "boolean"
  | "null"
  | "function";

/**
 * A (JSON-Schema and) Nope-Descriptor allows to use multiple types.
 * Therefore this type uses some additonal types. Alternativly, a reference
 * **`$ref`** can be used to describe some data. Therefore the schema
 * must be availalbe on the reference.
 */
export type INopeDescriptorSchemaTypes =
  | INopeDescriptorSchemaBaseTypes
  | Array<INopeDescriptorSchemaBaseTypes>
  | { $ref: string };

/**
 * # INopeDescriptor
 *
 * A generic descriptor of data or a function. This descriptors will be used to describe `NoPE` data-points or functions. The Descriptor is based on **JSON-Schemas** (see [here](https://json-schema.org/) for more details).
 *
 *
 * ## Describing data
 *
 * A valid example - *describing some data* - is given below (in the form of `JSON`-data). This example matches a **JSON-Schema**: *
 *
 * ```json
 * {
 *  "title": "Person",
 *  "type": "object",
 *  "properties": {
 *    "firstName": {
 *      "type": "string",
 *      "description": "The person's first name."
 *    },
 *    "lastName": {
 *      "type": "string",
 *      "description": "The person's last name."
 *    },
 *    "age": {
 *      "description": "Age in years which must be equal to or greater than zero.",
 *      "type": "integer",
 *      "minimum": 0
 *    }
 *  }
 * }
 * ```
 * ## Describing functions
 *
 * A valid example - *describing a function* - is given below (in the form of `JSON`-data):
 *
 * ```json
 * {
 *  "type": "function",
 *  "description": "A Sample Function",
 *  "inputs": [
 *    {
 *      "name": "parameter_01",
 *      "description": "The first Parameter of the Function",
 *      "schema": {
 *        "type":"string",
 *        "maxLength": 10
 *      }
 *    },
 *    {
 *      "name": "parameter_02",
 *      "description": "The second Parameter of the Function. This is optional",
 *      "optional": true,
 *      "schema": {
 *        "type":"boolean"
 *      }
 *    }
 *  ]
 * }
 * ```
 *
 * @export
 * @interface INopeDescriptor
 */
export interface INopeDescriptor {
  $ref?: string;
  $schema?: string;

  /////////////////////////////////////////////////
  // Schema Metadata
  /////////////////////////////////////////////////

  /**
   * This is important because it tells refs where
   * the root of the document is located
   */
  $id?: string;

  /**
   * It is recommended that the meta-schema is
   * included in the root of any JSON Schema
   */
  // $schema?: IJsonSchema;

  /**
   * Title of the schema
   */
  title?: string;

  /**
   * Schema description
   */
  description?: string;

  examples?: any;

  /**
   * Default json for the object represented by
   */
  default?: any;

  /////////////////////////////////////////////////
  // Number Validation
  /////////////////////////////////////////////////

  /**
   * The value must be a multiple of the number
   * (e.g. 10 is a multiple of 5)
   */
  multipleOf?: number;
  maximum?: number;

  /**
   * If true maximum must be > value, >= otherwise
   */
  exclusiveMaximum?: boolean;
  minimum?: number;

  /**
   * If true minimum must be < value, <= otherwise
   */
  exclusiveMinimum?: boolean;

  /////////////////////////////////////////////////
  // String Validation
  /////////////////////////////////////////////////

  /**
   * Max length of the string.
   */
  maxLength?: number;

  /**
   * Min length of the string.
   */
  minLength?: number;

  /**
   * This is a regex string that the value must
   * conform to
   */
  pattern?: string;

  /////////////////////////////////////////////////
  // Array Validation
  /////////////////////////////////////////////////
  additionalItems?: boolean | INopeDescriptor;
  items?: INopeDescriptor | INopeDescriptor[];

  /**
   * max. amount of items, the array is allwoed to contain.
   */
  maxItems?: number;

  /**
   * min. amount of items, the array must contain.
   */
  minItems?: number;

  /**
   * Flag, to define, that every item in the array must be unique.
   */
  uniqueItems?: boolean;

  /////////////////////////////////////////////////
  // Object Validation
  /////////////////////////////////////////////////

  maxProperties?: number;
  minProperties?: number;

  /**
   * Props that must be integrated
   */
  required?: string[];
  additionalProperties?: boolean | INopeDescriptor;

  /**
   * Holds simple JSON Schema definitions for
   * referencing from elsewhere.
   */
  definitions?: { [key: string]: INopeDescriptor };

  /**
   * The keys that can exist on the object with the
   * json schema that should validate their value
   */
  properties?: { [property: string]: INopeDescriptor };

  /**
   * The key of this object is a regex for which
   * properties the schema applies to
   */
  patternProperties?: { [pattern: string]: INopeDescriptor };

  /**
   * If the key is present as a property then the
   * string of properties must also be present.
   * If the value is a JSON Schema then it must
   * also be valid for the object if the key is
   * present.
   */
  dependencies?: { [key: string]: INopeDescriptor | string[] };

  /////////////////////////////////////////////////
  // Generic
  /////////////////////////////////////////////////

  /**
   * Enumerates the values that this schema can be
   * e.g.
   *
   * {
   *  "type": "string",
   *  "enum": ["red", "green", "blue"]
   * }
   */
  enum?: any[];

  /**
   * The basic type of this schema, can be one of
   * ['string' | 'number' | 'object' | 'array' | 'boolean' | 'null']
   * or an array of the acceptable types
   */
  type?: INopeDescriptorSchemaTypes;

  /////////////////////////////////////////////////
  // Combining Schemas
  /////////////////////////////////////////////////

  allOf?: INopeDescriptor[];
  anyOf?: INopeDescriptor[];
  oneOf?: INopeDescriptor[];

  /**
   * The entity being validated must not match this schema
   */
  not?: INopeDescriptor;

  /**
   * Data-Field, which must be filled out, if we are describing a function. This will describe the entire data of the inputs.
   */
  inputs?: Array<INopeDescriptorFunctionParameter>;

  /**
   * The Return (output) of a function. This must be provided if the type is set to ***function*** {@link INopeDescriptor.type}
   */
  outputs?: Array<INopeDescriptorFunctionParameter> | INopeDescriptor;
}

/**
 * Helper, to describe a Function Parameter
 */
export interface INopeDescriptorFunctionParameter {
  /**
   * Name, which is used in the function header
   *
   * @type {string}
   * @memberof INopeDescriptorFunctionParameter
   */
  name: string;
  /**
   * Description of the parameter. Similar to a comment, describing a parameter
   *
   * @type {string}
   * @memberof INopeDescriptorFunctionParameter
   */
  description?: string;
  /**
   * Flag, showing whether the parameter is *optional* or not.
   *
   * @type {boolean}
   * @memberof INopeDescriptorFunctionParameter
   */
  optional?: boolean;
  /**
   * The Schema used to describe the parameter. see {@link INopeDescriptor}
   *
   * @type {INopeDescriptor}
   * @memberof INopeDescriptorFunctionParameter
   */
  schema: INopeDescriptor;
}
