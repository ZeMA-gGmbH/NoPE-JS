/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:25
 * @modify date 2020-11-06 08:51:27
 * @desc [description]
 */

import { MethodDeclaration, PropertyDeclaration } from "ts-morph";
import { IModifierInformation } from "../types/IModifierInformation";

/**
 * Function to extrac the Modifiers of a declaration.
 * @param declaration The Declartion of the Class
 */
export function getModifiers(
  declaration: MethodDeclaration | PropertyDeclaration
) {
  // Dictionary used to match the Keywords
  const dict = {
    PublicKeyword: "public",
    ProtectedKeyword: "protected",
    PrivateKeyword: "private",
    0: ["public"],
    4: ["public"],
    8: ["private"],
    16: ["protected"],
    68: ["public", "readonly"],
    72: ["private", "readonly"],
    80: ["protected", "readonly"],
  };

  let modifiers: string[] = [];

  if ((declaration as MethodDeclaration).getOverloads) {
    // Handle Methods
    modifiers = (declaration as MethodDeclaration)
      .getOverloads()
      .map((overload) => dict[overload.getName()]);
  } else if ((declaration as PropertyDeclaration).getCombinedModifierFlags) {
    // Handle Properties
    modifiers =
      dict[(declaration as PropertyDeclaration).getCombinedModifierFlags()];
  }

  // If nothing is provided => Defaults to public
  if (modifiers.length === 0) {
    modifiers.push("public");
  }

  const ret: IModifierInformation = {
    declaration,
    modifiers,
    isPublic: modifiers.includes("public"),
    isPrivate: modifiers.includes("private"),
    isProtected: modifiers.includes("protected"),
    isReadonly: modifiers.includes("readonly"),
  };

  return ret;
}
