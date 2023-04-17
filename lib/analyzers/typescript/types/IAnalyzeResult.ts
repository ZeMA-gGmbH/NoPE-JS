/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:50:09
 * @modify date 2020-11-10 15:20:20
 * @desc [description]
 */

import { IJsonSchema } from "../../../types/IJSONSchema";
import { IServiceOptions } from "../../../types/nope/nopeModule.interface";
import { IClassAnalyzeResult } from "./IClassAnalyzeResult";
import { IExportedFunctionResult } from "./IExportedFunctionResult";

export interface IAnalyzeResult {
  classes: IClassAnalyzeResult[];
  functions: (IExportedFunctionResult & {
    decoratorSettings: IServiceOptions;
  })[];
  generalModel: IJsonSchema;
}
