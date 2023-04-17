/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-10-12 18:31:24
 * @modify date 2021-11-13 14:07:55
 * @desc [description]
 */

import {
  BehaviorSubject,
  CompletionObserver,
  ErrorObserver,
  NextObserver,
  Observable,
} from "rxjs";
import { INopeEventEmitter } from ".";
import {
  IEventAdditionalData,
  IEventCallback,
  INopeWaitForEventOptions,
} from "./nopeEventEmitter.interface";

export interface INopeWaitForObservableChangeOptions
  extends INopeWaitForEventOptions {
  /**
   * Directly test the current value.
   * Otherwise waits for an updated
   * value.
   */
  testCurrent?: boolean;
}

export interface INopePartialObserver<
  T,
  AD extends IEventAdditionalData = IEventAdditionalData
> {
  next?: IEventCallback<T, AD>;
  error?: (error: any) => void;
  complete?: () => void;
}

export declare type IPartialObserver<T> =
  | NextObserver<T>
  | ErrorObserver<T>
  | CompletionObserver<T>;

export type IPipe<T, K> = (
  scope: { [index: string]: any },
  observable: Observable<T>
) => Observable<K>;

export type IObservableType<
  T,
  AD extends IEventAdditionalData = IEventAdditionalData
> = Partial<AD> & {
  value: T;
};

/**
 * RsJX based Observable.
 *
 * Contains additional Functionalities like:
 *  - property with the current value
 *  - function to publish values. (wrapper for next)
 *  - enables performing a subscription with synced call or a immediate call.
 */
export interface INopeObservable<
  T = any,
  S = T,
  G = T,
  AD extends IEventAdditionalData = IEventAdditionalData
> extends INopeEventEmitter<T, S, G, AD> {
  /**
   * The original Observable. Implemented by an Behaviour Subject.
   * See here: https://www.learnrxjs.io/learn-rxjs/subjects/behaviorsubject
   * for more details.
   */
  observable: BehaviorSubject<IObservableType<G, AD>>;

  /**
   * Accessor to the currently stored value.
   */
  _value: T;

  /**
   * Function to update the Content
   * @param value The content
   * @param sender A sender, how has updated the Content (Optional)
   * @param timeStamp Timestampt of the Update (optional)
   * @param data
   */
  setContent(value: S | null, options?: Partial<AD>): boolean;

  /**
   * Function to Force an Update.
   * @param sender Sender, which initiated the Update
   * @param timestamp The Timestamp of the Updaet
   * @param data Additional Args.
   */
  forcePublish(options?: Partial<AD>): boolean;

  /**
   * Function to extract the Content.
   * If a Getter is provided, the Getter will be used
   * to Transform the item.
   */
  getContent(): G | null;
}
