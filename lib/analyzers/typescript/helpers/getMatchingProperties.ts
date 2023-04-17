/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:29
 * @modify date 2020-11-06 08:51:30
 * @desc [description]
 */

import { ClassDeclaration } from "ts-morph";
import { IPropertyInformation } from "../types/IPropertyInformation";
import { getDescription } from "./getDescription";

/**
 * Function to extract the Matching Properts
 * @param cl The Class
 * @param reqType The requested Type of the Element
 * @param caseSensitive A Flage to use casesesitivy during the checkoup
 */
export function getMatchingProperties(
  cl: ClassDeclaration
): IPropertyInformation[] {
  return (
    cl
      .getProperties()
      // Instead of returning the Property Declaration, return the
      // Property Descriptor.
      .map(
        (propertyDeclaration) =>
          getDescription(propertyDeclaration) as IPropertyInformation
      )
  );
}
