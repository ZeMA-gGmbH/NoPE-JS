/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:18:04
 * @modify date 2020-11-10 08:23:48
 * @desc [description]
 */

/**
 * Basic Type Information of a Parameter or something else.
 *
 * @export
 * @interface ITypeInformation
 */
export interface ITypeInformation<T = any> {
  /**
   *  The Declaration.
   */
  declaration: T;

  /**
   * Flag indicating, wether the element is a Base element.
   * A Base element is e.g "number", "string", "bool", "null", ..
   *
   * @type {boolean}
   * @memberof ITypeInformation
   */
  isBaseType: boolean;

  /**
   * Type of the Base Element.
   *
   * @type {string}
   * @memberof ITypeInformation
   */
  baseType: string;

  /**
   * A Simplified Type removes the "import(...)." Statements in
   * the definition.
   *
   * @type {string}
   * @memberof ITypeInformation
   */
  simplifiedType?: string;

  /**
   * If there is a Special Type like a "Promise<string>" youll find
   * the corresponding subtype "string" in here
   *
   * @type {string}
   * @memberof ITypeInformation
   */
  simplifiedSubType?: string;

  /**
   * Constains a Dict-Like Object holding information about the
   * imported Types.
   *
   * @type {{
   *         path: string;
   *         identifier: string;
   *     }[]}
   * @memberof ITypeInformation
   */
  typeImports?: {
    path: string;
    identifier: string;
  }[];

  /**
   * Contains the complete original implementation.
   *
   * @type {string}
   * @memberof ITypeInformation
   */
  originalCode: string;

  /**
   *
   *
   * @type {{
   *         required: boolean,
   *         content: string,
   *     }}
   * @memberof IParameterInformation
   */
  imports: {
    required: boolean;
    content: string;
  };

  /**
   * Parameters
   */
  parameters?: ITypeInformation[];

  name?: string;

  isOptional?: boolean;

  returnType?: ITypeInformation;
}
