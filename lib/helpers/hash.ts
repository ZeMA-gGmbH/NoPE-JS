/**
 * @module hash
 * @author M.Karkowski
 * @email M.Karkowski@zema.de
 *
 * Helper module to generate `hashs` of different type of objects.
 */

import { stringifyWithFunctions } from "./jsonMethods";

/**
 * Function to generate a Hash
 * @param obj the Object, that should be hashed
 */
export function generateHash(obj: any) {
  // Convert the object to String
  const str = typeof obj === "string" ? obj : stringifyWithFunctions(obj);

  // Define Vars.
  let hash = 0,
    i,
    chr;
  if (str.length === 0) return hash.toString();
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash.toString();
}
