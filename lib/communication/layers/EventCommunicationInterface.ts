/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-03-22 19:03:15
 * @modify date 2022-01-10 15:56:50
 * @desc [description]
 */

import { EventEmitter } from "events";
import { ILogger } from "js-logger";
import { generateId } from "../../helpers/idMethods";
import { DEBUG } from "../../logger/index.browser";
import { NopeObservable } from "../../observables/nopeObservable";
import {
  EventnameToEventType,
  ICommunicationInterface,
  IEmitter,
} from "../../types/nope";
import { INopeObservable } from "../../types/nope/nopeObservable.interface";

/**
 * A Basic Mirror, used to share the events in a Mirror Style.
 * This Layer should not be used directly. this should only
 * be extended.
 *
 * @export
 * @class EventMirror
 * @implements {ICommunicationMirror}
 */
export class EventCommunicationInterface implements ICommunicationInterface {
  /**
   * Function which will be used to subscribe Data
   *
   * @param {(symbol | ValidEventTypesOfMirror)} event The Event to listen to
   * @param {(...args: any[]) => void} listener The "Listener" (A Callback, which will be called)
   * @memberof EventMirror
   */
  async on<T extends keyof EventnameToEventType>(
    eventname: T,
    cb: (data: EventnameToEventType[T]) => void
  ): Promise<void> {
    this._emitter.on(eventname, cb);
    if (eventname !== "statusChanged" && this._logger?.enabledFor(DEBUG)) {
      this._emitter.on(eventname, (...args) => {
        this._logger.debug("received", "'" + eventname + "'", ...args);
      });
    }
  }

  /**
   * Function, which will be used to emit data
   *
   * @param {ValidEventTypesOfMirror} event the name fo the event to emit something
   * @param {*} data the data to emit
   * @memberof EventMirror
   */
  async emit<T extends keyof EventnameToEventType>(
    eventname: T,
    data: EventnameToEventType[T]
  ): Promise<void> {
    this._emitter.emit(eventname, data);
  }

  /**
   * Flag, showing whether the Mirror is connected or not.
   *
   * @type {INopeObservable<boolean>}
   * @memberof EventMirror
   */
  connected: INopeObservable<boolean>;

  async dispose(): Promise<void> {
    // Disposes the Emitter.
    (this._emitter as any)?.removeAllListeners();
  }

  /**
   * Creates an instance of EventMirror.
   * @param {IEmitter} [_emitter=new EventEmitter() as any] The Type of Emitter to use.
   * @param {ILogger} [_logger] a Logger
   * @memberof EventMirror
   */
  constructor(
    protected _emitter: IEmitter = new EventEmitter() as any,
    protected _logger?: ILogger,
    public readonly receivesOwnMessages: boolean = true
  ) {
    this.connected = new NopeObservable<boolean>();
    this.connected.setContent(true);
    this.id = generateId();
  }

  detailListeners(
    type: "event" | "rpc" | "data" | "response",
    listeners: string[]
  ) {
    throw new Error("Method not implemented.");
  }

  public id: string;
}
