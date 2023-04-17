/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-23 08:06:30
 * @modify date 2021-10-19 17:55:35
 * @desc [description]
 */

import { Observable, Subject, Subscription } from "rxjs";
import { map } from "rxjs/operators";
import { getSubject, TSubjectOptions } from "../helpers/getSubject";
import { generateId } from "../helpers/idMethods";
import { callImmediate } from "../helpers/runtimeMethods";
import { getNopeLogger } from "../logger/getLogger";
import {
  IEventAdditionalData,
  IEventCallback,
  INopeEventEmitter,
  INopeObserver,
  INopePartialObserver,
  INopeSubscriptionOptions,
  INopeWaitForObservableChangeOptions,
  IObservableType,
  IPartialObserver,
  IPipe,
  IWaitForCallback,
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
export class NopeEventEmitter<
  T = unknown,
  S = T,
  G = T,
  AD extends IEventAdditionalData = IEventAdditionalData
> implements INopeEventEmitter<T, S, G, AD>
{
  protected _emitter: Subject<IObservableType<G, AD>>;

  public readonly id: string = generateId();

  public options: any = {
    generateTimeStamp: true,
  };

  /**
   * Function to specify a Setter
   */
  public setter:
    | ((
        value: S | null,
        options?: Partial<AD>
      ) => {
        data: T | null;
        valid: boolean;
      })
    | null = null;

  /**
   * Function to specify a Getter
   */
  protected _getter: ((value: T | null) => G | null) | null = null;

  public get getter(): ((value: T | null) => G | null) | null {
    return this._getter;
  }

  public set getter(_getter: ((value: T | null) => G | null) | null) {
    this._getter = _getter;
  }

  public emit(value: S | null, options: Partial<AD> = {}): boolean {
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
    let _value: G = value as any as G;

    // Change the Value.
    if (this.setter !== null) {
      const adapted = this.setter(value as S, options);

      if (!adapted.valid) {
        return false;
      }

      _value = adapted.data as any as G;
    }

    _value = this.getter !== null ? this.getter(_value as any as T) : _value;

    // Publish the data.
    if (options.forced || this.disablePublishing === false) {
      options = this._updateSenderAndTimestamp(options);

      // Define the value.
      this._emitter.next({ value: _value, ...(options as AD) });

      return this.hasSubscriptions;
    }

    return false;
  }

  /**
   * Helper to update the Timestamp and sender
   *
   * @author M.Karkowski
   * @protected
   * @param {IEventAdditionalData} options
   * @return {*}  {ISetContentOptions}
   * @memberof NopeObservable
   */
  protected _updateSenderAndTimestamp(options: Partial<AD>): Partial<AD> {
    // Define a Sender if required
    if (options.sender === undefined) {
      options.sender = this.id;
    }

    // Generate a Timestamp if required.
    if (this.options.generateTimeStamp === true) {
      options.timestamp =
        options.timestamp === undefined ? Date.now() : options.timestamp;
    }

    // Return the adapted element.
    return options;
  }

  /**
   * A Set containing the Subscriptions
   */
  public _subscriptions = new Set<() => void>();

  /**
   * Flag to Disable Publishing
   */
  public disablePublishing = false;

  /**
   * Function, used to dispose the observable.
   * Every item will be unsubscribed.
   */
  public dispose(): void {
    for (const _unsubscribe of this._subscriptions) {
      _unsubscribe();
    }

    this._subscriptions.clear();
    this._emitter.closed = true;
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
    }
  ): INopeObserver {
    options.skipCurrent =
      !!this._options.showCurrent && !this._options.playHistory;
    return this._subscribe(observer, options);
  }

  protected _subscribe(
    observer: INopePartialObserver<G, AD> | IEventCallback<G, AD>,
    options: INopeSubscriptionOptions = {
      type: "sync",
      mode: ["direct", "sub", "super"],
    }
  ): INopeObserver {
    const _this = this;

    let active = true;
    let _observer: IPartialObserver<IObservableType<G, AD>>;
    let _first = true;

    if (typeof observer === "object") {
      _observer = {
        next: (data: IObservableType<G, AD>) => {
          // Make shure we are skipping the current Item, if desired
          if (_first && options.skipCurrent) {
            _first = false;
            return;
          }
          _first = false;

          if (active && data !== undefined && observer.next) {
            const { value, ...rest } = data;
            switch (options.type) {
              case "immediate":
                callImmediate(observer.next, value, rest);
                break;
              default:
                observer.next(value, rest as any as Partial<AD>);
                break;
              case "sync":
                observer.next(value, rest as any as Partial<AD>);
                break;
            }
          }
        },
        complete: () => {
          if (observer.complete) {
            observer.complete();
          }
        },
        error: (error) => {
          if (observer.error) {
            observer.error(error);
          }
        },
      };
    } else if (typeof observer === "function") {
      _observer = {
        next: (data) => {
          // Make shure we are skipping the current Item, if desired
          if (_first && options.skipCurrent) {
            _first = false;
            return;
          }
          _first = false;

          if (active && data !== undefined) {
            const { value, ...rest } = data;
            switch (options.type) {
              case "immediate":
                callImmediate(observer, value, rest);
                break;
              default:
                observer(value, rest as any as Partial<AD>);
                break;
              case "sync":
                observer(value, rest as any as Partial<AD>);
                break;
            }
          }
        },
        complete: () => {
          // Nothing to do here
        },
        error: (error) => {
          logger.error("");
          logger.error(error);
        },
      };
    }

    // Create a Subscription.
    const subscription = this._emitter.subscribe(_observer);

    const ret: INopeObserver = Object.assign(subscription, {
      options,
      pause: () => {
        active = false;
      },
      unpause: () => {
        active = true;
      },
    });

    return ret;
  }

  /**
   * Create an enhanced Subscription of the Observable. Use the Pipes, to
   * Define what should be subscribed.
   * @param next The Next Function, used to transmit changes
   * @param options The Options, used to determine the Enhancements.
   */
  public enhancedSubscription<K>(
    next: (data: K) => void,
    options: {
      scope?: { [index: string]: any };
      pipe?: IPipe<T | G, K>;
    } = {}
  ): Subscription {
    let observable: Observable<K> = this as any as Observable<K>;

    if (options.pipe) {
      observable = options.pipe(
        options.scope,
        this._emitter.pipe(
          map((value) => {
            return value.value;
          })
        )
      );
    }

    const subscription = observable.subscribe({
      next,
    });

    return subscription;
  }

  /**
   * Creates a Subscription for the value of the Observable. After one Update the Value will be deleted
   * @param func Function which is called when new Datas are pushed
   * @param mode Mode of the Subscription
   * @param options Additional Options
   */
  once(
    func: IEventCallback<G, AD>,
    options?: INopeSubscriptionOptions
  ): INopeObserver {
    let ret: INopeObserver = null;

    ret = this.subscribe(
      {
        next: (...args) => {
          ret.unsubscribe();
          func(...args);
        },
      },
      options
    );

    return ret;
  }

  /**
   * Async Function to Wait for an Update
   * @param mode Mode of the Subscription
   * @param options Additional Options for the Wait Function.
   */
  public waitFor(
    testCallback: IWaitForCallback<G, AD> = (value) => {
      return (value as any as boolean) == true;
    },
    options: INopeWaitForObservableChangeOptions = { testCurrent: true }
  ): Promise<G> {
    const _this = this;

    let resolved = false;
    let subscription: INopeObserver = null;
    let timeout = null;

    return new Promise<G>((resolve, reject) => {
      const finish = (error: any, test: boolean, data: G) => {
        // Reject the error.
        if (error) {
          reject(error);
        }

        if (timeout) {
          clearTimeout(timeout);
        }

        // Unsubscribe the Subscription.
        if (test && subscription) {
          subscription.unsubscribe();
          subscription = null;
        }

        if (test && !resolved) {
          // Mark the Task as Resolved.
          resolved = true;
          resolve(data);
        }
      };

      let first = true;

      const checkData = (data: G, opts: Partial<AD>) => {
        if ((first && options.testCurrent) || !first) {
          // Create a promise of the data
          const prom = Promise.resolve(testCallback(data, opts));

          // Now we link the element
          prom.catch((e) => {
            finish(e, false, data);
          });
          prom.then((r) => {
            finish(false, r, data);
          });
        }

        first = false;
      };

      try {
        subscription = _this.subscribe((data, opts) => {
          checkData(data, opts);
        });

        if (options?.timeout > 0) {
          timeout = setTimeout(() => {
            finish(Error("Timeout.!"), false, null);
          }, options.timeout);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Async Function to Wait for an Update
   * @param mode Mode of the Subscription
   * @param options Additional Options for the Wait Function.
   */
  public waitForUpdate(options?: INopeSubscriptionOptions): Promise<G> {
    const _this = this;
    return new Promise<G>((resolve, reject) => {
      try {
        _this.once((content) => {
          resolve(content);
        }, options);
      } catch (e) {
        reject(e);
      }
    });
  }

  public get hasSubscriptions(): boolean {
    return this._emitter.observed;
  }

  public get observerLength(): number {
    return this._emitter.observers.length;
  }

  constructor(protected _options: TSubjectOptions = {}) {
    this._emitter = getSubject<IObservableType<G, AD>>(_options);
  }
}
