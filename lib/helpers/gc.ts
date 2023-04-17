/**
 * @modue gc
 *
 * Module to interact with the `garbage collector` (`gc`) of Nodejs.
 *
 * - Use the function `registerGarbageCallback` if you want to register a callback which will be called, if the item is getting remove by the gc.
 * - Try to call `forceGarbageCollection` to manually trigger the `gc`.
 */

import { isAsyncFunction } from "./async";
import { getSingleton } from "./singletonMethod";

/**
 * Helper trying to call the carbage collection.
 * - Wont raise an exception, if the gc is not available.
 * - it isn't shure that the gc will be called.
 */
export function forceGarbageCollection() {
  if (global.gc) {
    global.gc();
  }
}

/**
 * A `Finalizer`, provided as true `Singleton`
 *
 * Check the description: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry to get a better understanding of a `Finalizer`
 */
export const FINALIZER = getSingleton("nope.finanlizer", () => {
  return new FinalizationRegistry(async (callback: (...args) => any) => {
    if (isAsyncFunction(callback)) {
      await callback();
    } else {
      callback();
    }
  });
});

/**
 * Helper to register a callback which will be called, if the item is getting remove by the gc.
 * @param item The item to be collected by the gc.
 * @param callback The callback to call.
 */
export function registerGarbageCallback(item: any, callback: (...args) => any) {
  FINALIZER.instance.register(item, callback);
}
