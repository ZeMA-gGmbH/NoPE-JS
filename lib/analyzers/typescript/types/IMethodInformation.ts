/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:15:23
 * @modify date 2020-11-10 08:19:02
 * @desc [description]
 */

import { MethodDeclaration } from "ts-morph";
import { IFunctionInformation } from "./IFunctionInformation";

export interface IMethodInformation
  extends IFunctionInformation<MethodDeclaration> {
  /**
   * Flag, to test whether the Method is
   * abstract or not.
   *
   * @type {boolean}
   * @memberof IMethodInformation
   */
  isAbstract: boolean;
}
