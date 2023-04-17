/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2022-01-03 13:46:51
 * @modify date 2022-01-06 07:40:59
 * @desc [description]
 */

import { maxOfArray, minOfArray } from "../../helpers/arrayMethods";
import {
  INopeCore,
  ValidDefaultSelectors,
  ValidSelectorFunction,
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
export function generateSelector(
  selector: ValidDefaultSelectors,
  core: INopeCore
): ValidSelectorFunction {
  switch (selector) {
    default:
      throw Error("Please use a valid selector");
    case "master":
      return async (opts) => {
        const masterId = core.connectivityManager.master.id;
        const data = core.rpcManager.services.keyMappingReverse;

        if (data.has(opts.serviceName)) {
          const arr = Array.from(data.get(opts.serviceName));

          if (arr.includes(masterId)) {
            return masterId;
          }
        }

        throw Error("No matching dispatcher present.");
      };
    case "first":
      return async (opts) => {
        const data = core.rpcManager.services.keyMappingReverse;

        if (data.has(opts.serviceName)) {
          const arr = Array.from(data.get(opts.serviceName));

          if (arr.length > 0) {
            return arr[0];
          }
        }

        throw Error("No matching dispatcher present.");
      };
    case "dispatcher":
      // Our selector compares the dispatcher - id
      return async (opts) => {
        const ids = core.connectivityManager.dispatchers.data.getContent();

        if (ids.includes(core.id)) {
          return core.id;
        }

        throw Error("No matching dispatcher present.");
      };
    case "host":
      // Our selector compares the host-name:
      // 1. Get the current Host name of our dispatcher
      const host = core.connectivityManager.info.host.name;
      return async (opts) => {
        const data = core.rpcManager.services.keyMappingReverse;

        if (data.has(opts.serviceName)) {
          const items = Array.from(data.get(opts.serviceName));
          const hosts = items.map((id) => {
            return core.connectivityManager.dispatchers.originalData.get(id)
              ?.host.name;
          });
          const idx = hosts.indexOf(host);
          if (idx >= 0) {
            return items[idx];
          }
        }

        throw Error("No matching dispatcher present.");
      };
    case "cpu-usage":
      return async () => {
        // Now we find the Min CPU usage:
        const dispatchers =
          core.connectivityManager.dispatchers.data.getContent();
        const bestOption = minOfArray(dispatchers, "host.cpu.usage");

        if (bestOption.index >= 0) {
          return dispatchers[bestOption.index];
        }

        throw Error("No matching dispatcher present.");
      };
    case "free-ram":
      return async () => {
        // Now we find the Min CPU usage:
        const dispatchers =
          core.connectivityManager.dispatchers.data.getContent();
        const bestOption = maxOfArray(dispatchers, "host.ram.free");

        if (bestOption.index >= 0) {
          return dispatchers[bestOption.index];
        }

        throw Error("No matching dispatcher present.");
      };
  }
}
