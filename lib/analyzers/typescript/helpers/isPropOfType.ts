/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:05
 * @modify date 2020-11-06 08:51:06
 * @desc [description]
 */

import { PropertyDeclaration } from "ts-morph";
import { IPropertyInformation } from "../types/IPropertyInformation";
import { getDescription } from "./getDescription";

/**
 * Function to test, whether a Function is defined as a specific type.
 * @param prop The Property Declaration
 * @param reqType The requested Type, that should be matched
 * @param caseSensitive A Flage to use casesesitivy during the checkoup
 */
export function isPropOfType(
  prop: PropertyDeclaration,
  reqType: string,
  caseSensitive = true
) {
  if (!caseSensitive) {
    return (
      reqType.toLowerCase() ===
      (getDescription(prop) as IPropertyInformation).baseType.toLowerCase()
    );
  } else {
    return reqType === (getDescription(prop) as IPropertyInformation).baseType;
  }
}
