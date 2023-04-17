/**
 * @module id
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 *
 * Module, which provides an id-generator, see {@link generateId}
 */

import { v4 } from "uuid";
import { varifyString } from "./stringMethods";

/**
 * Generates an ID.
 *
 * # Example:
 *
 * ```javascript
 * // Default behavior:
 * generateId() // ==> 'b655f9d5-d581-411e-84b8-a6dbe1fd6cd6' will be allways different
 *
 * // Using a prestring:
 * generateId({
 *  prestring: "test"
 * }) // ==> 'testb655f9d5-d581-411e-84b8-a6dbe1fd6cd6' will be allways different
 *
 * // Using a useAsVar:
 * generateId({
 *  prestring: "test"
 *  useAsVar: true
 * }) // ==> 'testb655f9d5_d581_411e_84b8_a6dbe1fd6cd6' will be allways different
 * ```
 *
 * @author M.Karkowski
 */
export function generateId(
  options: {
    // PreString for the Var.
    prestring?: string;
    useAsVar?: boolean;
  } = {}
): string {
  let id = v4();

  if (typeof options.prestring === "string") {
    id = options.prestring + id;
  }

  if (options.useAsVar) {
    id = varifyString(id);
  }

  return id;
}
