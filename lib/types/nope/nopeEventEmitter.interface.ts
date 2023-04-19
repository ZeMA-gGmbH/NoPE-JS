/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { Subscription } from "rxjs";

/**
 * The Definition of a callback which can be used in the `waitFor` (see {@link INopeEventEmitter.waitFor}) method of
 * an {@link INopeEventEmitter} or an {@link nope.types.INopeObservable}
 *
 * @export
 * @typedef {IWaitForCallback}
 * @template T The Type, the callback receives. This type depends of the
 * @template AD The Additional Data that is reicved. (see {@link IEventAdditionalData})
 */
export type IWaitForCallback<
  T = unknown,
  AD extends IEventAdditionalData = IEventAdditionalData
> = (content: T | null, options: Partial<AD>) => boolean | Promise<boolean>;

/**
 * Declaration of the Options used in the `waitFor` (see {@link INopeEventEmitter.waitFor}) method of
 * an {@link INopeEventEmitter} or an {@link nope.types.INopeObservable}
 */
export interface INopeWaitForEventOptions {
  /**
   * The Style, how the callback should be called.
   * use `"immediate"` to prevent cycles.
   *
   * Normaly this options is selected by the system.
   */
  subscriptionMode?: "immediate" | "sync";
  /**
   * If the Emitter is connected to the pubsubsystem (see {@link nope.pubSub})
   * message can be shared in different ways:
   * 1. A Change may be emitted by a parent emitter (e.g. `topic/of/emitter`; event emitted on `topic`) `->` use the mode `super`
   * 2. A Change may be emitted by an emitter on the same topic (e.g. `topic/of/emitter`; event emitted  on `topic/of/emitter`) `->` use the mode `direct`
   * 3. A Change may be emitted by a child emitter (e.g. `topic/of/emitter`; event emitted on `topic/of/emitter/subtopic`) `->` use the mode `sub`
   *
   * Defaultly on all type of changes the wait method will be react.
   */
  triggerMode?: Array<"sub" | "super" | "direct">;
  /**
   * Timeout in *ms* after the waifFor fails with an `Timeout` Error.
   */
  timeout?: number;
}

/**
 * The Observer which can be used to controll the `Subscription`, which will be received after performing
 * the `subscribe` (see {@link INopeEventEmitter.subscribe}) method
 * an {@link INopeEventEmitter} or an {@link nope.types.INopeObservable}
 */
export interface INopeObserver extends Subscription {
  options: INopeSubscriptionOptions;
  /**
   * Pauses the Subscription
   */
  pause(): void;
  /**
   * Unpauses the Subscription
   */
  unpause(): void;
}

export interface INopeSubscriptionOptions {
  /**
   * The Style, how the callback should be called.
   * use `"immediate"` to prevent cycles.
   *
   * Normaly this options is selected by the system.
   */
  type?: "immediate" | "sync";
  /**
   * If the Emitter is connected to the pubsubsystem (see {@link nope.pubSub})
   * message can be shared in different ways:
   * 1. A Change may be emitted by a parent emitter (e.g. `topic/of/emitter`; event emitted on `topic`) `->` use the mode `super`
   * 2. A Change may be emitted by an emitter on the same topic (e.g. `topic/of/emitter`; event emitted  on `topic/of/emitter`) `->` use the mode `direct`
   * 3. A Change may be emitted by a child emitter (e.g. `topic/of/emitter`; event emitted on `topic/of/emitter/subtopic`) `->` use the mode `sub`
   *
   * Defaultly on all type of changes the wait method will be react.
   */
  mode?: Array<"sub" | "super" | "direct">;
  /**
   * Skips the current value during an subscription. This is relevant for
   * {@link nope.types.INopeObservable}. `Subscriptions` on {@link INopeEventEmitter}
   * will only get informed on an updates. Events are not persitent.
   */
  skipCurrent?: boolean;
}

export type IEventCallback<
  T = unknown,
  AD extends IEventAdditionalData = IEventAdditionalData
> = (content: T | null, options: Partial<AD>) => void;

/**
 * Defines the data, that are share on event emitting.
 */
export interface IEventAdditionalData {
  /**
   * An Id of an element that emits the change. This
   * id can be used to determine cycles in the emitting process
   */
  sender: string;
  /**
   * A Timestamp of the message
   */
  timestamp: number;
  /**
   * Flag to indicate, that the message must be emitted or not
   */
  forced: boolean;
  /**
   * Additional arguments, share during emitting the message.
   */
  args: any[];
}

/**
 *
 * An EventEmitter is used to share Events in the System. Therefore the Eventemitter provides the method:
 * `emit`, which will emit an event.
 *
 * Observers subscribe to that event an will receive an **notification** using a callback and subscribing
 * to an event (see {@link INopeEventEmitter.subscribe}). If they are temporarily are not interessed the
 * observer can use the `pause` (and `unpause`) Methods to temporarily controll the subscription. If the
 * subscription isnt used any more, the method `unsubscribe` will be used to unsubscribe from the emitter.
 *
 * > `Subscriptions` on {@link INopeEventEmitter} will only get informed on an updates. Events are not persitent.
 *
 * To adapt and controll the events before publishing, a custom `setter` can be assigned (see
 * {@link INopeEventEmitter.setter}). This setter is used to determine, whether the event should be published
 * or not.
 *
 * During subscribing to the emitter, you receive an {@link INopeObserver}
 *
 *
 * @export
 * @interface INopeEventEmitter
 * @typedef {INopeEventEmitter}
 * @template T The internal Datatype of the Emitter
 * @template S Datatype, the `setContent` method must receive
 * @template G Datatype, that will be during forwarding the event data.
 * @template AD The Additional Event-Data, that observers will receive.
 */
export interface INopeEventEmitter<
  T = unknown,
  S = T,
  G = T,
  AD extends IEventAdditionalData = IEventAdditionalData
> {
  /**
   * An id of the Observable. This might be usefull for debugging.
   */
  readonly id: string;

  /**
   * options.
   */
  options: any;

  /**
   * Property, a custom setter.
   *
   * This setter is used to determine, whether the event should be published or not
   * Therefore it is implemented as callback, which has to return the adpated `data`,
   * and a flag, which shows whether the `data` is `valid` or not. If the data is
   * marked es invalid, the event wont be published.
   *
   * If not required the setter must be set to `null`
   */
  setter:
    | ((
        value: S | null,
        options?: Partial<AD>
      ) => {
        data: T | null;
        valid: boolean;
      })
    | null;

  /**
   * Helper to transform the data using a getter.
   */
  getter: ((value: T | null) => G | null) | null;

  /**
   * Function to update the Content
   * @param value The content
   * @param sender A sender, how has updated the Content (Optional)
   * @param timeStamp Timestampt of the Update (optional)
   * @param data
   */
  emit(value: S | null, options?: Partial<AD>): boolean;

  /**
   * Flag to Disable Publishing of the emitter. This results in
   * **not** inform the relevant subscriber / observers.
   */
  disablePublishing: boolean;

  /**
   * Function, used to dispose the observable.
   * Every item will be unsubscribed.
   */
  dispose(): void;

  /**
   * A Function to subscribe to updates of the Event Emitter.
   * @param listener Function which is called when new Datas are pushed. The Function must follow the definition in {@link IEventCallback}
   * @param options Additional Options used during subscribing {@link INopeSubscriptionOptions}
   */
  subscribe(
    listener: IEventCallback<G, AD>,
    options?: INopeSubscriptionOptions
  ): INopeObserver;

  /**
   * Creates a Subscription for the value of the Event Emitter. After one Update the Subscription will be deleted
   * @param func Function which is called when new Datas are pushed. The Function must follow the definition in {@link IEventCallback}
   * @param options Additional Options used during subscribing {@link INopeSubscriptionOptions}
   */
  once(
    func: IEventCallback<G, AD>,
    options?: INopeSubscriptionOptions
  ): INopeObserver;

  /**
   * Async Function to Wait for an Update until the given `testCallback` returns `true`.
   * The `testCallback` defaultly test for `true`
   *
   * @param {?IWaitForCallback<G, AD>} [testCallback] Test-Callback which can be implemented `async` or `sync`. It must return `true` to fullfill the promise.
   * @param {?INopeWaitForEventOptions} [options] Options, to controll the method. (see {@link INopeWaitForEventOptions})
   * @returns {Promise<G>} Contains the Data, which firstly fullfilled the `testCallback`
   */
  waitFor(
    testCallback?: IWaitForCallback<G, AD>,
    options?: INopeWaitForEventOptions
  ): Promise<G>;

  /**
   * Async Function to Wait for an Update. No specific condition must match.
   * The code will be just awaited until an updat is received.
   *
   * @param mode Mode of the Subscription
   * @param options Additional Options for the Wait Function.
   */
  waitForUpdate(options?: INopeSubscriptionOptions): Promise<G>;

  /**
   * Flag, showing if there exists any subscription this particular observer.
   */
  readonly hasSubscriptions: boolean;

  /**
   * Returns the amout of interessed Subscribers / Observers.
   *
   * @readonly
   * @type {number}
   */
  readonly observerLength: number;
}
