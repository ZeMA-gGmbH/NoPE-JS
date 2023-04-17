/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 11:03:07
 * @modify date 2020-11-06 08:52:14
 * @desc [description]
 */

import { ClassDeclaration } from "ts-morph";
import { isClassExtending } from "../helpers/isClassExtending";
import { IClassFilter } from "../types/IClassFilter";
import { IImportMapping } from "../types/IImportMapping";

/**
 * Method to create a Default Filter for Methods.
 * @param options
 */
export function defaultClassFilter(options: {
  baseClass: string;
  caseSensitive: boolean;
}): IClassFilter {
  return (cl: ClassDeclaration, importMapping: IImportMapping) => {
    return isClassExtending(
      cl,
      options.baseClass,
      importMapping,
      options.caseSensitive
    );
  };
}
