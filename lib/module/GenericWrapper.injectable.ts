/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { inject, injectable } from "inversify";
import { INopeCore, INopeEventEmitter } from "../types/nope";
import {
  DISPATCHER_INSTANCE,
  EMITTER_FACTORY,
  OBSERVABLE_FACTORY,
} from "../symbols/identifiers";
import { INopeObservable } from "../types/nope/nopeObservable.interface";
import { NopeGenericWrapper } from "./GenericWrapper";

@injectable()
export class InjectableNopeGenericWrapper extends NopeGenericWrapper {
  /**
   * Creates an instance of NopeGenericModule.
   * @param {INopeCore} _core The NopeCore-Element. Usally is provided as dispatcher
   * @param {() => INopeObservable<any>} _observableFactory A Factory, to generate some Observables.
   * @memberof NopeGenericModule
   */
  constructor(
    @inject(DISPATCHER_INSTANCE) _core: INopeCore,
    @inject(OBSERVABLE_FACTORY) _observableFactory: () => INopeObservable<any>,
    @inject(EMITTER_FACTORY) _emitterFactory: () => INopeEventEmitter<any>
  ) {
    super(_core, _emitterFactory, _observableFactory);
  }
}
