/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-12-02 07:25:15
 * @modify date 2021-08-11 10:34:09
 * @desc [description]
 */

import { inject, injectable } from "inversify";
import {
  DISPATCHER_OPTIONS,
  EMITTER_FACTORY,
  OBSERVABLE_FACTORY,
} from "../symbols/identifiers";
import { INopeEventEmitter } from "../types";
import { INopeDispatcherOptions } from "../types/nope/nopeDispatcher.interface";
import { INopeObservable } from "../types/nope/nopeObservable.interface";
import { NopeDispatcher } from "./nopeDispatcher";

@injectable()
export class InjectableNopeDispatcher extends NopeDispatcher {
  constructor(
    @inject(DISPATCHER_OPTIONS) public options: INopeDispatcherOptions,
    @inject(EMITTER_FACTORY)
    protected _generateEmitter: <T>() => INopeEventEmitter<T>,
    @inject(OBSERVABLE_FACTORY)
    protected _generateObservable: <T>() => INopeObservable<T>
  ) {
    super(options, _generateEmitter, _generateObservable);
  }
}
