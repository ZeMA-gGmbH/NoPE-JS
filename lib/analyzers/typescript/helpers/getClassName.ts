/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:51
 * @modify date 2020-11-10 08:42:44
 * @desc [description]
 */

import { ClassDeclaration } from "ts-morph";

/**
 * Helper Function to extract the Name of Class
 *
 * @export
 * @param {ClassDeclaration} cl the Class declaration
 * @return {*}
 */
export function getClassName(cl: ClassDeclaration) {
  let name = cl.getType().getText();

  // Regex to extrat the Imports with the corresponding type.
  // Use the Regex to remove the Imports
  const regex = /import\(.+?\)./g;
  name = name.replace(regex, "");

  return name;
}
