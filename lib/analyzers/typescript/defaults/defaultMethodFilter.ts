/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 11:02:57
 * @modify date 2021-01-18 17:19:36
 * @desc [description]
 */

import { ClassDeclaration } from "ts-morph";
import { IDecoratorInformation } from "../types/IDecoratorInformation";
import { IImportMapping } from "../types/IImportMapping";
import { IMethodFilter } from "../types/IMethodFilter";
import { IMethodInformation } from "../types/IMethodInformation";
import { IModifierInformation } from "../types/IModifierInformation";

/**
 * Default Method for filtering Methods.
 */
export function defaultMethodFilter(): IMethodFilter {
  return (
    cl: ClassDeclaration,
    method: IMethodInformation & IDecoratorInformation & IModifierInformation,
    importMapping: IImportMapping
  ) => {
    return method.isPublic && method.isAsync;
  };
}
