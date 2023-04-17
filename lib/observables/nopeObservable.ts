/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { BehaviorSubject } from "rxjs";
import { NopeEventEmitter } from "../eventEmitter/nopeEventEmitter";
import { TSubjectOptions } from "../helpers/getSubject";
import { generateId } from "../helpers/idMethods";
import { deepEqual } from "../helpers/objectMethods";
import { getNopeLogger } from "../logger/getLogger";
import {
  IEventAdditionalData,
  IEventCallback,
  INopeObservable,
  INopeObserver,
  INopePartialObserver,
  INopeSubscriptionOptions,
  IObservableType,
} from "../types/nope/index";

const logger = getNopeLogger("obervable");

/**
 * RsJX based Observable.
 *
 * Contains additional Functionalities like:
 *  - property with the current value
 *  - function to publish values. (wrapper for next)
 *  - enables performing a subscription with synced call or a immediate call.
 */
export class NopeObservable<
    T,
    S = T,
    G = T,
    AD extends IEventAdditionalData = IEventAdditionalData
  >
  extends NopeEventEmitter<T, S, G, AD>
  implements INopeObservable<T, S, G, AD>
{
  protected _emitter: BehaviorSubject<IObservableType<G, AD>>;

  public get observable(): BehaviorSubject<IObservableType<G, AD>> {
    return this._emitter;
  }

  public readonly id: string = generateId();

  public _value: T;

  public options: any = {
    generateTimeStamp: true,
  };

  public setContent(value: S | null, options: Partial<AD> = {}): boolean {
    return this._emit(value, options);
  }

  /**
   * Function to set the content of the Observable
   * @param value
   * @param sender
   * @param timeStamp
   * @param data
   */
  protected _emit(value: S | null, options: Partial<AD> = {}): boolean {
    // Change the Value.
    if (this.setter !== null) {
      const adapted = this.setter(value as S, options);

      if (!adapted.valid) {
        return false;
      }

      this._value = adapted.data;
    } else {
      // Adapt the Value if required.
      this._value = value as any as T;
    }

    const valueToPublish = this.getContent();

    // Publish the Data, but only if they are different (deeply)
    if (
      !this.disablePublishing &&
      (options.forced || !deepEqual(this._emitter.value?.value, valueToPublish))
    ) {
      return this._publish(valueToPublish, options);
    }

    return false;
  }

  /**
   * Internal Function to Publish content
   *
   * @author M.Karkowski
   * @protected
   * @param {G} value The value to use.
   * @param {Partial<AD>} [options={}]
   * @return {boolean}
   * @memberof NopeObservable
   */
  protected _publish(value: G, options: Partial<AD> = {}): boolean {
    // Only Proceed if Publishing is required.
    if (options.forced || this.disablePublishing === false) {
      options = this._updateSenderAndTimestamp(options);

      // Define the value.
      this._emitter.next({ value, ...options });

      return this.hasSubscriptions;
    }

    return false;
  }

  /**
   * Function to Force an Update
   *
   * @author M.Karkowski
   * @param {Partial<AD>} options Options which might be relevant
   * @return {boolean}
   * @memberof NopeObservable
   */
  public forcePublish(options: Partial<AD> = {}): boolean {
    options.forced = true;
    return this._publish(this.getContent(), options);
  }

  /**
   * Function to extract the Content.
   * If a Getter is provided, the Getter will be used
   * to Transform the item.
   */
  public getContent(): G | null {
    if (this.getter !== null) return this.getter(this._value);
    return this._value as any as G;
  }

  protected _lastDataUpdate: number;

  /**
   * A Function to subscribe to updates of the Observable.
   * @param observer The Observer. Could be a Function or a Partial Observer.
   * @param mode The Mode of the Subscription
   * @param options Additional Options.
   */
  public subscribe(
    observer: INopePartialObserver<G, AD> | IEventCallback<G, AD>,
    options: INopeSubscriptionOptions = {
      type: "sync",
      mode: ["direct", "sub", "super"],
      skipCurrent: false,
    }
  ): INopeObserver {
    return this._subscribe(observer, options);
  }

  constructor(protected _options: TSubjectOptions = {}) {
    super(Object.assign(_options, { showCurrent: true }));
  }
}
