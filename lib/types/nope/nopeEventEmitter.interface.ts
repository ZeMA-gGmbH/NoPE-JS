/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-10-12 18:31:24
 * @modify date 2021-10-19 16:23:53
 * @desc [description]
 */

import { Subscription } from "rxjs";

export type IWaitForCallback<
  T = unknown,
  AD extends IEventAdditionalData = IEventAdditionalData
> = (content: T | null, options: Partial<AD>) => boolean | Promise<boolean>;

export interface INopeWaitForEventOptions {
  subscriptionMode?: "immediate" | "sync";
  triggerMode?: Array<"sub" | "super" | "direct">;
  /**
   * Timeout in *ms* after the waifFor fails.
   */
  timeout?: number;
}

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
  type?: "immediate" | "sync";
  mode?: Array<"sub" | "super" | "direct">;
  skipCurrent?: boolean;
}

export type IEventCallback<
  T = unknown,
  AD extends IEventAdditionalData = IEventAdditionalData
> = (content: T | null, options: Partial<AD>) => void;

export interface IEventAdditionalData {
  sender: string;
  timestamp: number;
  forced: boolean;
  args: any[];
}

/**
 * RsJX based EventEmitter.
 *
 * Contains additional Functionalities like:
 *  - property with the current value
 *  - function to publish values. (wrapper for next)
 *  - enables performing a subscription with synced call or a immediate call.
 */
export interface INopeEventEmitter<
  T = unknown,
  S = T,
  G = T,
  AD extends IEventAdditionalData = IEventAdditionalData
> {
  /**
   * An id of the Observable.
   */
  readonly id: string;

  /**
   * options.
   */
  options: any;

  /**
   * Function to specify a Setter
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
   * Flag to Disable Publishing
   */
  disablePublishing: boolean;

  /**
   * Function, used to dispose the observable.
   * Every item will be unsubscribed.
   */
  dispose(): void;

  /**
   * A Function to subscribe to updates of the Observable.
   * @param listener The Listener, which will receive an update.
   * @param mode The Mode of the Subscription
   * @param options Additional Options.
   */
  subscribe(
    listener: IEventCallback<G, AD>,
    options?: INopeSubscriptionOptions
  ): INopeObserver;

  /**
   * Creates a Subscription for the value of the Observable. After one Update the Value will be deleted
   * @param func Function which is called when new Datas are pushed
   * @param mode Mode of the Subscription
   * @param options Additional Options
   */
  once(
    func: IEventCallback<G, AD>,
    options?: INopeSubscriptionOptions
  ): INopeObserver;

  /**
   * Async Function to Wait for an Update
   * @param mode Mode of the Subscription
   * @param options Additional Options for the Wait Function.
   */
  waitFor(
    testCallback?: IWaitForCallback<G, AD>,
    options?: INopeWaitForEventOptions
  ): Promise<G>;

  /**
   * Async Function to Wait for an Update
   * @param mode Mode of the Subscription
   * @param options Additional Options for the Wait Function.
   */
  waitForUpdate(options?: INopeSubscriptionOptions): Promise<G>;

  /**
   * Flag, showing if there exists any subscription this particular observer.
   */
  readonly hasSubscriptions: boolean;

  readonly observerLength: number;
}
