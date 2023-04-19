/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { NopeEventEmitter } from "../eventEmitter";
import { getSingleton } from "../helpers/singletonMethod";
import { NopeGenericWrapper } from "../module/GenericWrapper";
import { NopeObservable } from "../observables/nopeObservable";
import {
  IDispatcherConstructor,
  INopeDispatcher,
  INopeDispatcherOptions,
} from "../types/nope/nopeDispatcher.interface";
import { addAllBaseServices } from "./baseServices";
import { NopeDispatcher } from "./nopeDispatcher";
import {
  IexportAsNopeServiceParameters,
  getCentralDecoratedContainer,
} from "../decorators/index";

export type TAdditionalOptions = {
  /**
   * A different Constructor class.
   */
  dispatcherConstructorClass?: IDispatcherConstructor;
  /**
   * Enalbe the Dispatcher to exists as singleton in the runtime. Defaults to `true`.
   */
  singleton?: boolean;
  /**
   * Flag to enable using the Base-Services. Defaults to `true`
   */
  useBaseServices?: boolean;
  /**
   * Flag to load services exported with `exportAsNopeService`. Defaults to `true`
   */
  useLinkedServices?: boolean;
};

/**
 * Helper to get a Dispatcher.
 *
 *
 * ```typescript
 * // Create a communication layer:
 * const communicator = getLayer("event");
 * // Now create the Dispatcher.
 * const dispatcher = getDispatcher({communicator});
 * ```
 *
 * @export
 * @param {INopeDispatcherOptions} dispatcherOptions The options, that will be used for the dispatcher.
 * @param {TAdditionalOptions} [options={}]  Options. You can provide a different Dispatcher-Class; Controll the scope (Singleton or not.) and define wehter the Base-Services should be added etc. see {@link TAdditionalOptions}
 * @returns {INopeDispatcher} The dispatcher.
 */
export function getDispatcher(
  dispatcherOptions: INopeDispatcherOptions,
  options: TAdditionalOptions = {}
): INopeDispatcher {
  if (
    options.dispatcherConstructorClass === null ||
    options.dispatcherConstructorClass === undefined
  ) {
    options.dispatcherConstructorClass = NopeDispatcher;
  }

  options = Object.assign(
    {
      constructorClass: null,
      singleton: true,
      useBaseServices: true,
      useLinkedServices: true,
    },
    options
  );

  const create = () => {
    const dispatcher = new options.dispatcherConstructorClass(
      dispatcherOptions,
      () => new NopeEventEmitter(),
      () => new NopeObservable()
    );

    // Register a default instance generator:
    // Defaultly generate a NopeGenericModule
    dispatcher.instanceManager.registerInternalWrapperGenerator(
      "*",
      async (core, description) => {
        const mod = new NopeGenericWrapper(
          core,
          () => new NopeEventEmitter(),
          () => new NopeObservable()
        );
        await mod.fromDescription(description, "overwrite");
        // await mod.init();
        return mod;
      }
    );

    if (options.useBaseServices) {
      // Store the services
      addAllBaseServices(dispatcher).then((services) => {
        dispatcher["services"] = services;
      });
    }

    if (options.useLinkedServices) {
      // Define a Container, which contains all functions.
      const container = getCentralDecoratedContainer();

      // If the Dispatcher has been connected, register all functions.
      dispatcher.ready.waitFor().then(() => {
        if (dispatcher.ready.getContent()) {
          // Iterate over the Functions
          for (const [uri, settings] of container.services.entries()) {
            dispatcher.rpcManager.registerService(settings.callback, {
              ...settings.options,
              id: uri,
            });
          }
        } else {
          // Failed to Setup the Container.
        }
      });
    }

    // Return the Dispathcer
    return dispatcher as INopeDispatcher;
  };

  if (options.singleton) {
    // Create a singaleton if required.
    // use the container to receive the
    // singleton object
    const container = getSingleton("nopeBackendDispatcher.instance", create);

    return container.instance;
  }

  // No singleton is required =>
  // create a new instance.
  return create();
}
