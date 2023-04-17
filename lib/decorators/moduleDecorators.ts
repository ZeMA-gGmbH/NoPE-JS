/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { rgetattr, rsetattr } from "../helpers/objectMethods";
import {
  IEventOptions,
  IServiceOptions,
  INopeModule,
} from "../types/nope/nopeModule.interface";
import { getCentralDecoratedContainer } from "./container";

const CONTAINER = getCentralDecoratedContainer();

/**
 * Decorator, used to export the Method as Service to Nope..
 * @param options The options used for linking.
 */
export function nopeMethod(options: IServiceOptions) {
  // Now lets make shure, we are using the correct type
  // provide inputs and  outputs.
  rsetattr(options, "schema/type", "function");
  rsetattr(options, "schema/inputs", rgetattr(options, "schema/inputs", []));
  rsetattr(options, "schema/outputs", rgetattr(options, "schema/outputs", []));

  return function (
    target: INopeModule,
    methodName: string,
    descriptor: PropertyDescriptor
  ) {
    // Add the Target to the class.
    CONTAINER.classes.set(target.constructor.name, target);

    target._markedElements = target._markedElements || [];
    target._markedElements.push({
      accessor: methodName,
      options,
      type: "method",
    });
  };
}

/**
 * Decorator, will link the Parameter to Nope and make it available. it available as
 * Nope-Property.
 * @param options The Options, describing the settings for linking.
 */
export function nopeProperty(options: IEventOptions) {
  return function (
    target: INopeModule,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // Add the Target to the class.
    CONTAINER.classes.set(target.constructor.name, target);

    target._markedElements = target._markedElements || [];
    target._markedElements.push({
      accessor: propertyKey,
      options,
      type: "prop",
    });
  };
}

/**
 * Decorator, that will link the Parameter to Nope and make it available as
 * Event Emitter.
 * @param options The Options, describing the settings for linking.
 */
export function nopeEmitter(options: IEventOptions) {
  return function (
    target: INopeModule,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // Add the Target to the class.
    CONTAINER.classes.set(target.constructor.name, target);

    target._markedElements = target._markedElements || [];
    target._markedElements.push({
      accessor: propertyKey,
      options,
      type: "event",
    });
  };
}
