/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2022-01-05 12:46:57
 * @modify date 2022-01-06 07:37:29
 * @desc [description]
 */

import {
  INopeCore,
  INopeDispatcher,
  TValidAsssignmentChecker,
  ValidDefaultSelectors,
} from "../../types/nope";

/**
 * A Helper Function, to generate the Basic selector Functions.
 *
 * @author M.Karkowski
 * @export
 * @param {ValidDefaultSelectors} selector
 * @param {INopeDispatcher} core
 * @return {*}
 */
export function generateAssignmentChecker(
  selector: ValidDefaultSelectors,
  core: INopeCore
): TValidAsssignmentChecker {
  switch (selector) {
    default:
      throw Error("Please provide an valid selector");
    case "first":
      return async () => {
        return true;
      };
    case "cpu-usage":
      return async () => {
        return true;
      };
    case "free-ram":
      return async () => {
        return true;
      };
    case "dispatcher":
      // Our selector compares the dispatcher - id
      return async (module, usedDispatcher) => {
        return usedDispatcher.id == core.id;
      };
    case "host":
      // Our selector compares the host-name:
      // 1. Get the current Host name of our dispatcher
      const host = core.connectivityManager.info.host.name;
      return async (module, usedDispatcher) => {
        return usedDispatcher.host.name == host;
      };
  }
}
