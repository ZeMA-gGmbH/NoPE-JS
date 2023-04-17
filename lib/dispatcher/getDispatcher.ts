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

/**
 *
 * @param {INopeDispatcherOptions} dispatcherOptions The options, that will be used for the dispathcer.
 * @param options Additional Options. You can provide a different Dispatcher-Class; Controll the scope (Singleton or not.) and define wehter the Base-Services should be added.
 * @returns {INopeDispatcher} The dispatcher.
 *
 * ```typescript
 * // Create a communication layer:
 * const communicator = getLayer("event");
 * // Now create the Dispatcher.
 * const dispatcher = getDispatcher({communicator});
 * ```
 */
export function getDispatcher(
  dispatcherOptions: INopeDispatcherOptions,
  options: {
    dispatcherConstructorClass?: IDispatcherConstructor;
    singleton?: boolean;
    useBaseServices?: boolean;
  } = {}
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
