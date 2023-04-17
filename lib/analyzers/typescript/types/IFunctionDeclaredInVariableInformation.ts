/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:15:09
 * @modify date 2020-11-05 12:15:09
 * @desc [description]
 */

import { IMethodInformation } from "./IMethodInformation";

export interface IFunctionDeclaredInVariableInformation
  extends IMethodInformation {
  declarationCode: string;
}
