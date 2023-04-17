/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:14:58
 * @modify date 2020-11-05 12:14:59
 * @desc [description]
 */

import { ClassDeclaration } from "ts-morph";
import { IImportMapping } from "./IImportMapping";

export type IClassFilter = (
  cl: ClassDeclaration,
  importMapping: IImportMapping
) => boolean;
