/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:08
 * @modify date 2020-11-06 08:51:09
 * @desc [description]
 */

import { PropertyDeclaration } from "ts-morph";
import { IDecoratorFilter } from "../types/IDecoratorFilter";
import { IImportMapping } from "../types/IImportMapping";
import { getDecorators } from "./getDecorators";

/**
 * Function to test if the Property is injected or not.
 * @param prop The Property Declaration
 * @param decorator The decorator, that should be used.
 * @param aliasToOriginal Mapping of aliases to original imported names.
 * @param caseSensitive Turn off / on case sensitive for the checked decorator
 */
export function isPropertyInjectedWith(
  prop: PropertyDeclaration,
  decoratorFilter: IDecoratorFilter,
  mapping: IImportMapping
) {
  let decorators = getDecorators(prop, decoratorFilter, mapping, false);
  return decorators.decorators.length > 0;
}
