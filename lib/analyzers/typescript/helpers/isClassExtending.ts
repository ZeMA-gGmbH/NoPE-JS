/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:18
 * @modify date 2020-11-06 08:51:20
 * @desc [description]
 */

import { ClassDeclaration } from "ts-morph";
import { IImportMapping } from "../types/IImportMapping";

/**
 * Function to test if a class (cl) extends a specific Base Class.
 * @param cl The Class
 * @param ifName The Name of the Interface.
 * @param aliasToOriginal Mapping of aliases to original imported names.
 * @param caseSensitive Flag to toggle on / off the case sensitivity
 */
export function isClassExtending(
  cl: ClassDeclaration,
  extendingName: string,
  mapping: IImportMapping,
  caseSensitive = true
) {
  // Get the Implemented Interfaces of the Class.
  const baseClass = cl.getExtends();

  if (baseClass !== undefined) {
    let name = baseClass.getType().getText();

    // Regex to extrat the Imports with the corresponding type.
    // Use the Regex to remove the Imports
    const regex = /import\(.+?\)./g;
    name = name.replace(regex, "");

    if (!caseSensitive) {
      name = name.toLocaleLowerCase();
      extendingName = extendingName.toLocaleLowerCase();
    }

    if (typeof mapping.aliasToOriginal[name] === "string") {
      name = mapping.aliasToOriginal[name];
    }

    if (extendingName === name) {
      return true;
    }

    return isClassExtending(
      cl.getBaseClassOrThrow(),
      extendingName,
      mapping,
      caseSensitive
    );
  }

  return false;
}
