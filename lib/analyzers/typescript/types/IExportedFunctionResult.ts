/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:15:06
 * @modify date 2020-11-05 12:15:06
 * @desc [description]
 */

import { IFunctionDeclaredInVariableInformation } from "./IFunctionDeclaredInVariableInformation";

export interface IExportedFunctionResult
  extends IFunctionDeclaredInVariableInformation {
  imports: {
    content: string;
    required: boolean;
  };
}
