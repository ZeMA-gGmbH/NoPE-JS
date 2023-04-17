/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:14
 * @modify date 2020-11-06 08:51:14
 * @desc [description]
 */

import { ClassDeclaration } from "ts-morph";
import { getImplementedInterface } from "./getImplementedInterface";

/**
 * Function to test if a class (cl) implements a specific interface named ifName.
 * @param cl The Class
 * @param ifName The Name of the Interface.
 * @param aliasToOriginal Mapping of aliases to original imported names.
 * @param caseSensitive Flag to toggle on / off the case sensitivity
 */
export function isClassImplementingInterface(
  cl: ClassDeclaration,
  ifName: string,
  aliasToOriginal: { [index: string]: string },
  caseSensitive = true
) {
  // Get the Implemented Interfaces of the Class.
  let interfaces = getImplementedInterface(cl, aliasToOriginal);

  // If the CaseSensitive is turned change all names to lowercase.
  // although the requeste name
  if (!caseSensitive) {
    interfaces = interfaces.map((iface) => iface.toLocaleLowerCase());
    ifName = ifName.toLowerCase();
  }

  // Return the test, whether the requested Interface name is
  // included in the list of interfaces.
  return interfaces.includes(ifName);
}
