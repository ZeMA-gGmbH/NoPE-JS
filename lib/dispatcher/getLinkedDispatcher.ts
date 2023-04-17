/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-08-25 23:27:28
 * @modify date 2021-08-11 10:34:12
 * @desc [description]
 */

import { IexportAsNopeServiceParameters } from "../decorators/index";
import { getSingleton } from "../helpers/singletonMethod";
import {
  INopeDispatcher,
  INopeDispatcherOptions,
} from "../types/nope/nopeDispatcher.interface";
import { getDispatcher } from "./getDispatcher";

/**
 * Returns a Dispatcher.
 * @param options
 */
export function getLinkedDispatcher(
  options: INopeDispatcherOptions
): INopeDispatcher {
  // Create the Dispatcher Instance.
  const dispatcher = getDispatcher(options);

  // Define a Container, which contains all functions.
  const container = getSingleton("nopeBackendDispatcher.container", () => {
    return new Map<
      string,
      {
        uri: string;
        callback: (...args) => Promise<any>;
        options: IexportAsNopeServiceParameters;
      }
    >();
  });

  // If the Dispatcher has been connected, register all functions.
  dispatcher.ready.waitFor().then(() => {
    if (dispatcher.ready.getContent()) {
      // Iterate over the Functions
      for (const [uri, settings] of container.instance.entries()) {
        dispatcher.rpcManager.registerService(settings.callback, {
          ...settings.options,
          id: uri,
        });
      }
    } else {
      // Failed to Setup the Container.
    }
  });

  return dispatcher;
}
