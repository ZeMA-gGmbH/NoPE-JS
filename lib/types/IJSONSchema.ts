export type IJsonSchemaBaseTypes =
  | "string"
  | "number"
  | "integer"
  | "object"
  | "array"
  | "boolean"
  | "null";
export type IJsonSchemaTypes =
  | IJsonSchemaBaseTypes
  | Array<IJsonSchemaBaseTypes>
  | { $ref: string };

/**
 * Definition for a JSON Schema
 *
 * @export
 * @interface IJsonSchema
 */
export interface IJsonSchema {
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

  maxLength?: number;
  minLength?: number;
  /**
   * This is a regex string that the value must
   * conform to
   */
  pattern?: string;

  /////////////////////////////////////////////////
  // Array Validation
  /////////////////////////////////////////////////

  additionalItems?: boolean | IJsonSchema;
  items?: IJsonSchema | IJsonSchema[];
  maxItems?: number;
  minItems?: number;
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
  additionalProperties?: boolean | IJsonSchema;

  /**
   * Holds simple JSON Schema definitions for
   * referencing from elsewhere.
   */
  definitions?: { [key: string]: IJsonSchema };

  /**
   * The keys that can exist on the object with the
   * json schema that should validate their value
   */
  properties?: { [property: string]: IJsonSchema };

  /**
   * The key of this object is a regex for which
   * properties the schema applies to
   */
  patternProperties?: { [pattern: string]: IJsonSchema };

  /**
   * If the key is present as a property then the
   * string of properties must also be present.
   * If the value is a JSON Schema then it must
   * also be valid for the object if the key is
   * present.
   */
  dependencies?: { [key: string]: IJsonSchema | string[] };

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
  type?: IJsonSchemaTypes;

  /////////////////////////////////////////////////
  // Combining Schemas
  /////////////////////////////////////////////////

  allOf?: IJsonSchema[];
  anyOf?: IJsonSchema[];
  oneOf?: IJsonSchema[];

  /**
   * The entity being validated must not match this schema
   */
  not?: IJsonSchema;
}
