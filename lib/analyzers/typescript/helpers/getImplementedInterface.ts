/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:37
 * @modify date 2020-11-06 08:51:37
 * @desc [description]
 */

import { ClassDeclaration } from "ts-morph";

/**
 * Function to list all implemented interfaces
 * @param cl the class descriptor
 * @param aliasToOriginal Mapping of aliases to original imported names.
 */
export function getImplementedInterface(
  cl: ClassDeclaration,
  aliasToOriginal: { [index: string]: string }
) {
  // Iterate over the implemented Interface and
  // extract the interface names. If an alias for
  // an interface is used => use the original name
  // of the Interface => interfaces contains only
  // the "original names" of the implemented interfaces
  let interfaces = cl.getImplements().map((iface) => {
    const name = iface.getText();

    if (typeof aliasToOriginal[name] === "string") {
      return aliasToOriginal[name];
    }

    return name;
  });

  // return the list with implemented interfaces.
  return interfaces;
}
