/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:15:01
 * @modify date 2020-11-05 12:15:01
 * @desc [description]
 */

import {
  ClassDeclaration,
  Decorator,
  MethodDeclaration,
  PropertyDeclaration,
} from "ts-morph";
import { IImportMapping } from "./IImportMapping";

export type IDecoratorFilter = (
  declaration: MethodDeclaration | PropertyDeclaration | ClassDeclaration,
  decorator: Decorator,
  mapping: IImportMapping
) => boolean;
