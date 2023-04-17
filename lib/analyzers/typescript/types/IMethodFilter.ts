/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:15:21
 * @modify date 2020-11-05 12:15:21
 * @desc [description]
 */

import { ClassDeclaration } from "ts-morph";
import { IDecoratorInformation } from "./IDecoratorInformation";
import { IImportMapping } from "./IImportMapping";
import { IMethodInformation } from "./IMethodInformation";
import { IModifierInformation } from "./IModifierInformation";

export type IMethodFilter = (
  cl: ClassDeclaration,
  method: IMethodInformation & IDecoratorInformation & IModifierInformation,
  importMapping: IImportMapping
) => boolean;
