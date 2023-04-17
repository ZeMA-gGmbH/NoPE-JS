/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:15:13
 * @modify date 2020-11-10 08:18:50
 * @desc [description]
 */

import { FunctionDeclaration } from "ts-morph";
import { ITypeInformation } from "./ITypeInformation";

export interface IFunctionInformation<T = FunctionDeclaration>
  extends ITypeInformation<T> {
  /**
   * Name of the Function
   */
  name: string;
  /**
   * Flag showing, whether the function is async or not.
   */
  isAsync: boolean;
  /**
   * Flag, whether the function is a generator or not.
   */
  isGenerator: boolean;
  /**
   * Flag, true = Function is implemented
   */
  isImplementation: boolean;
  /**
   * Return type (the result of the function)
   */
  returnType: ITypeInformation;
  /**
   * Flag showing if there is a dedicated return type.
   */
  hasReturnType: boolean;
  /**
   * Textual description of the Function
   */
  authorDescription: string;
}
