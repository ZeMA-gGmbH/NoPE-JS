/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:15:59
 * @modify date 2020-11-05 16:13:37
 * @desc [description]
 */

import { ITypeInformation } from "./ITypeInformation";

/**
 * Contains information about the Parameters of a function.
 *
 * @export
 * @interface IParameterInformation
 * @extends {ITypeInformation}
 */
export interface IParameterInformation extends ITypeInformation {
  /**
   * Name of the parameter.
   *
   * @type {string}
   * @memberof IParameterInformation
   */
  name: string;

  /**
   * The Original Code
   *
   * @type {string}
   * @memberof IParameterInformation
   */
  originalCode: string;

  /**
   * Index of the parameter
   *
   * @type {number}
   * @memberof IParameterInformation
   */
  index: number;

  /**
   * Contains the Description of the User.
   *
   * @type {string}
   * @memberof IParameterInformation
   */
  authorDescription: string;

  /**
   * Indicates, whether the Parameter is optional or not.
   *
   * @type {boolean}
   * @memberof IParameterInformation
   */
  isOptional: boolean;

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
}
