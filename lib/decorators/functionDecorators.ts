/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import {
  getCentralDecoratedContainer,
  IexportAsNopeServiceParameters,
} from "./container";

const CONTAINER = getCentralDecoratedContainer();

/**
 * Defintion of a Functon.
 */
export type callable<T> = {
  (...args): T;
};

/**
 * Decorator, that will export the Function to a Dispatcher
 * @param func The Function
 * @param options The Options.
 */
export function exportAsNopeService<T>(
  func: T,
  options: IexportAsNopeServiceParameters
): T & { options: IexportAsNopeServiceParameters } {
  // Only add the element if it doesnt exists.
  if (!CONTAINER.services.has(options.id)) {
    if (options.ui === undefined && options.schema) {
      options.ui = {
        autoGenBySchema: true,
      };
    }

    CONTAINER.services.set(options.id, {
      callback: async (...args) => {
        return await (func as any)(...args);
      },
      options,
      uri: options.id || (func as any).name,
    });
  }

  (func as any).options = options;

  return func as any;
}
