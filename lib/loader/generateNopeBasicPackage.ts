/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { decorate, injectable } from "inversify";
import { getDispatcher } from "../dispatcher/getDispatcher";
import { NopeDispatcher } from "../dispatcher/nopeDispatcher";
import { InjectableNopeEventEmitter } from "../eventEmitter";
import { NopeBaseModule } from "../module/BaseModule";
import { NopeObservable } from "../observables/nopeObservable";
import { InjectableNopeObservable } from "../observables/nopeObservable.injectable";
import {
  COMMUNICATION_LAYER,
  DISPATCHER_INSTANCE,
  DISPATCHER_OPTIONS,
  EMITTER_FACTORY,
  EMITTER_INSTANCE,
  OBSERVABLE_FACTORY,
  OBSERVABLE_INSTANCE,
} from "../symbols/identifiers";
import { INopeDispatcherOptions } from "../types/nope/nopeDispatcher.interface";
import { IPackageDescription } from "../types/nope/nopePackage.interface";

decorate(injectable(), NopeDispatcher);
decorate(injectable(), NopeObservable);
decorate(injectable(), NopeBaseModule);

/**
 * Generates the Default Package, containing all relevant elements of the
 * nope-package. This package is used by the {@link NopePackageLoader} to
 * provided a basic package, which could be used for injecting different
 * nope-elements into other elements. (To make use of injection, checkout https://inversify.io/)
 *
 * @export
 * @param options ommunicationLayer The Layer, which should be used.
 * @param {boolean} singleton Enables a Single Dispatcher in a Process. Otherwise multiple Dispatchers are used.
 * @return {*}
 */
export function generateNopeBasicPackage(
  options: INopeDispatcherOptions,
  singleton = false
) {
  const TYPES = {
    dispatcher: DISPATCHER_INSTANCE,
    observableFactory: OBSERVABLE_FACTORY,
    emitterFactory: EMITTER_FACTORY,
    observable: OBSERVABLE_INSTANCE,
    emitter: EMITTER_INSTANCE,
    communicationLayer: COMMUNICATION_LAYER,
    dispatcherOptions: DISPATCHER_OPTIONS,
  };

  const definedPackage: IPackageDescription<typeof TYPES> = {
    activationHandlers: [],
    autostart: {},
    defaultInstances: [],
    nameOfPackage: "nopeBasicPackage",
    providedClasses: [
      {
        description: {
          name: "nopeDispatcher",
          selector: TYPES.dispatcher,
          // We want to provide in this Situation allways the same dispatcher.
          // type: !singleton ? InjectableNopeDispatcher : getDispatcher(options, null, singleton),
          type: getDispatcher(options, {
            singleton,
            useLinkedServices: true,
          }),
          options: {
            // Shouldn't be required:
            // scope: singleton ? "inSingletonScope" : undefined,
            // toConstant: singleton ? true : undefined
            toConstant: true,
          },
        },
        settings: {
          allowInstanceGeneration: false,
        },
      },
      {
        description: {
          name: "dispatcherOptions",
          selector: TYPES.dispatcherOptions,
          type: options,
          options: {
            toConstant: true,
          },
        },
        settings: {
          allowInstanceGeneration: false,
        },
      },
      {
        description: {
          name: "nopeEmitter",
          selector: TYPES.emitter,
          factorySelector: TYPES.emitterFactory,
          type: InjectableNopeEventEmitter,
        },
        settings: {
          allowInstanceGeneration: false,
        },
      },
      {
        description: {
          name: "nopeObservable",
          selector: TYPES.observable,
          factorySelector: TYPES.observableFactory,
          type: InjectableNopeObservable,
        },
        settings: {
          allowInstanceGeneration: false,
        },
      },
    ],
    providedServices: [],
    requiredPackages: [],
    types: TYPES,
  };

  return definedPackage;
}
