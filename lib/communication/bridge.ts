/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { EventEmitter } from "events";
import { ILogger } from "js-logger";
import { generateId } from "../helpers/idMethods";
import {
  DEBUG,
  defineNopeLogger,
  ValidLoggerDefinition,
  WARN,
} from "../logger/index.browser";
import { NopeObservable } from "../observables/nopeObservable";
import {
  Eventname,
  EventnameToEventType,
  ICommunicationBridge,
  ICommunicationInterface,
  INopeObservable,
} from "../types/nope";

export class Bridge implements ICommunicationBridge {
  public connected: INopeObservable<boolean>;
  public considerConnection = true;
  public ownDispatcherId: string;
  public id: string;

  protected _useInternalEmitter: boolean;
  protected _logger: ILogger;
  protected _internalEmitter: EventEmitter;
  protected _layers: Map<
    string,
    {
      layer: ICommunicationInterface;
      considerConnection: boolean;
      forwardData: boolean;
    }
  >;

  protected _callbacks: Map<Eventname, Array<(...args) => any>>;

  /**
   * Creates an instance of Bridge.
   * @param {*} [id=generateId()] The ID. (this can be adapted later and is only used to simplify debugging)
   * @param {string} [loggerName="bridge"] The Name of the Logger.
   * @param {LoggerLevel} [level="info"] The Level of the Logger.
   * @memberof Bridge
   */
  constructor(id = generateId(), logger: ValidLoggerDefinition = false) {
    this._internalEmitter = new EventEmitter();
    this._callbacks = new Map();
    this._layers = new Map();

    this.id = id;
    this._logger = defineNopeLogger(logger, `nope.bridge`);

    this._useInternalEmitter = true;

    const _this = this;

    this.connected = new NopeObservable();
    this.connected.setContent(false);

    // Add a custom handler for the connect flag.
    // the Flag is defined as true, if every socket
    // is connected.
    this.connected.getter = () => {
      for (const data of _this._layers.values()) {
        if (data.considerConnection && !data.layer.connected.getContent()) {
          return false;
        }
      }
      return true;
    };
  }

  async on<T extends keyof EventnameToEventType>(
    eventname: T,
    cb: (data: EventnameToEventType[T]) => void
  ): Promise<void> {
    return this._on(eventname, cb);
  }

  async emit<T extends keyof EventnameToEventType>(
    eventname: T,
    data: EventnameToEventType[T]
  ): Promise<void> {
    return this._emit(eventname, null, data);
  }

  detailListeners(
    type: "event" | "rpc" | "data" | "response",
    listeners: string[]
  ) {}

  get receivesOwnMessages(): boolean {
    for (const layer of this._layers.values()) {
      if (!layer.layer.receivesOwnMessages) {
        return false;
      }
    }

    return true;
  }

  async dispose(): Promise<void> {
    // Iterate over the Layers and dispose them.
    for (const item of this._layers.values()) {
      await item.layer.dispose();
    }
  }

  protected _checkInternalEmitter(): void {
    this._useInternalEmitter = true;
    for (const layer of this._layers.values()) {
      if (layer.layer.receivesOwnMessages) {
        this._useInternalEmitter = false;
        break;
      }
    }
  }

  /**
   * Helper Function, which will internally subscribe to the Events of the Layer.
   *
   * @protected
   * @param {ICommunicationInterface} layer The Layer to consinder, on this layer, we will subscribe to the events
   * @param {keyof ICommunicationInterface} method The method used for subscription
   * @param {string} event The name of the Event
   * @param {boolean} forwardData Flag, showing whether data will be forwarded or not.
   * @memberof BridgeV2
   */
  protected _subscribeToCallback(
    layer: ICommunicationInterface,
    event: Eventname,
    forwardData: boolean
  ): void {
    const _this = this;
    // Subscribe to the Event.
    layer
      .on(event, (data) => {
        // Now we are able to iterate over the Methods and forward the content
        // but only if the Layer forwards the content
        if (forwardData) {
          _this._emit(event, layer, data);
        } else {
          _this._internalEmitter.emit(event, data);
        }
      })
      .catch((error) => {
        if (_this._logger) {
          _this._logger.error(`failed subscribing to event "${event}"`);
          _this._logger.error(error);
        }
      });
  }

  protected _on(event: Eventname, cb): void {
    // Store the Unspecific callbacks
    if (!this._callbacks.has(event)) {
      this._callbacks.set(event, [cb]);

      // We only are going to subscribe, if there is no log listener.
      if (this._logger?.enabledFor(DEBUG) && event !== "statusChanged") {
        this._logger.debug("subscribe to", event);

        // Rise the max listeners
        this._internalEmitter.setMaxListeners(
          this._internalEmitter.getMaxListeners() + 1
        );

        // If logging is enable, we subscribe to that.
        const _this = this;

        this._internalEmitter.on(event, (data) => {
          _this._logger.debug("received", event, data);
        });
      }

      // Iterate over the Layers and on the connected Layers,
      // subscribe the methods.
      for (const data of this._layers.values()) {
        if (data.layer.connected.getContent()) {
          this._subscribeToCallback(data.layer, event, data.forwardData);
        }
      }
    } else {
      this._callbacks.get(event).push(cb);
    }

    // Rise the max listeners
    this._internalEmitter.setMaxListeners(
      this._internalEmitter.getMaxListeners() + 1
    );
    // Subscribe
    this._internalEmitter.on(event, cb);
  }

  protected _emit(
    event: Eventname,
    toExclude: ICommunicationInterface = null,
    dataToSend: any,
    force = false
  ): void {
    if (this._logger?.enabledFor(WARN) && event !== "statusChanged") {
      this._logger.debug("emitting", event, dataToSend);
    }
    if (this._useInternalEmitter || force) {
      // Emit the Event on the internal Layer.
      this._internalEmitter.emit(event, dataToSend);
    }

    const _this = this;

    // Iterate over the Layers.
    for (const data of this._layers.values()) {
      // If the Layer has been conneced
      if (data.layer !== toExclude && data.layer.connected.getContent()) {
        // Only Publish the Data, on which we are forwarding
        data.layer.emit(event, dataToSend).catch((error) => {
          if (_this._logger) {
            _this._logger.error(`failed to emit the event "${event}"`);
            _this._logger.error(error);
          }
        });
      }
    }
  }

  public async addCommunicationLayer(
    layer: ICommunicationInterface,
    forwardData = false,
    considerConnection = false
  ): Promise<void> {
    if (!this._layers.has(layer.id)) {
      // Store the Layers:
      this._layers.set(layer.id, {
        layer,
        considerConnection,
        forwardData,
      });

      // Forward the Events of the Layer
      // being connected to our aggregated
      // state
      const _this = this;
      layer.connected.subscribe(() => {
        _this.connected.forcePublish();
      });

      // Wait until the Layer is connected.
      await layer.connected.waitFor();

      // Register all know unspecific methods
      for (const [event, cbs] of this._callbacks.entries()) {
        for (const callback of cbs) {
          layer.on(event, callback);
        }
      }

      this._checkInternalEmitter();
    }
  }

  public async removeCommunicationLayer(
    layer: ICommunicationInterface
  ): Promise<void> {
    if (this._layers.has(layer.id)) {
      this._layers.delete(layer.id);

      this._checkInternalEmitter();
    }
  }

  public toDescription() {
    return {
      connected: this.connected.getContent(),
      layers: Array.from(this._layers.values()).map((item) => {
        return {
          forwardData: item.forwardData,
          receivesOwnMessages: item.layer.receivesOwnMessages,
          id: item.layer.id,
          considerConnection: item.considerConnection,
        };
      }),
    };
  }
}
