/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-08-03 17:32:16
 * @modify date 2021-08-03 21:14:12
 * @desc [description]
 */

import { ILogger } from "js-logger";
import { connect, MqttClient } from "mqtt";
import { matches } from "mqtt-pattern";
import { hostname } from "os";
import { generateId } from "../../helpers/idMethods";
import { SPLITCHAR } from "../../helpers/objectMethods";
import { replaceAll } from "../../helpers/stringMethods";
import {
  defineNopeLogger,
  ValidLoggerDefinition,
} from "../../logger/getLogger";
import { DEBUG, INFO } from "../../logger/index.browser";
import { NopeObservable } from "../../observables/nopeObservable";
import {
  EventnameToEventType,
  ICommunicationInterface,
} from "../../types/nope";

function _mqttMatch(subscription: string, offered: string): boolean {
  let _subscription = replaceAll(subscription, SPLITCHAR, "/");
  let _offered: string = replaceAll(offered, SPLITCHAR, "/");

  // Perform the Match
  let res = matches(_subscription, _offered);

  if (res) {
    // If it is matching => Quit method
    return res;
  }

  // Check if the Topic matches the data, based on a shortend Topic
  if (
    _offered.split("/").length > _subscription.split("/").length &&
    subscription.indexOf("+") === -1
  ) {
    // Shorten the offered Topic
    _offered = _offered
      .split("/")
      .slice(0, _subscription.split("/").length)
      .join("/");
    // Repreform the Matching
    res = matches(_subscription, _offered);
  } else if (
    _offered.split("/").length < _subscription.split("/").length &&
    subscription.indexOf("+") === -1
  ) {
    // Shorten the Subscription
    _subscription = _subscription
      .split("/")
      .slice(0, _offered.split("/").length)
      .join("/");
    // Repreform the Matching
    res = matches(_subscription, _offered);
  }

  // TODO: Fix

  // Return the Result
  return res;
}

/**
 * Default implementation of an {@link ICommunicationInterface}.
 *
 * This layer will use mqtt to connect and transport messages.
 *
 * Defaultly all messages will be subscribed on the following topics:
 * - `+/nope/<eventname>`
 *
 * Defaultly all messages will be published on the following topics:
 * - `<preTopic>/nope/<eventname>`
 * - `preTopic` is set to the hostname.
 *
 * The Layer is able to forward data, events etc to default ports.
 * Asume data is emitted using the `dataChanged` emit. If the flag
 * `forwardToCustomTopics` is set to true, the path of the data will
 * directly forward to mqtt.
 */
export class MQTTLayer implements ICommunicationInterface {
  protected _client: MqttClient;
  protected _cbs: Map<string, Set<(...args: any[]) => void>>;
  protected _logger: ILogger;

  public connected: NopeObservable<boolean>;
  public considerConnection: boolean;

  /**
   * See {@link ICommunicationInterface.id}
   */
  public id: string;

  /**
   * Creates an instance of MQTTLayer.
   * @param {string} uri Uri of the Broker. e.g. `mqtt://localhost:1883` or `ws://localhost:9000`.
   * @param {ValidLoggerDefinition} [logger="info"] Logger level
   * @param {string} [preTopic=hostname()] Defaultly all messages will be published on the following topics: `<preTopic>/nope/<eventname>`. `preTopic` is defaultly set to the hostname of the node in which `NoPE` is running.
   * @param {(0 | 1 | 2)} [qos=2] The QOS of mqtt. see https://www.hivemq.com/blog/mqtt-essentials-part-6-mqtt-quality-of-service-levels/ for more details. Default = Exactly once. Otherwise there might be an issue.
   * @param {boolean} [forwardToCustomTopics=true] The Layer is able to forward data, events etc to default ports. This flag enables this behavior
   * @memberof MQTTLayer
   */
  constructor(
    public uri: string,
    logger: ValidLoggerDefinition = "info",
    public preTopic: string = hostname(),
    public qos: 0 | 1 | 2 = 2,
    public forwardToCustomTopics = true
  ) {
    // Make shure we use the http before connecting.
    this.uri = this.uri.startsWith("mqtt://") ? this.uri : "mqtt://" + this.uri;
    this.connected = new NopeObservable<boolean>();
    this.connected.setContent(false);

    this._cbs = new Map();
    this._logger = defineNopeLogger(logger, "core.layer.mqtt");
    this._logger.info("connecting to:", this.uri);

    this.considerConnection = true;
    this.id = generateId();

    this.receivesOwnMessages = true;

    // Create a Broker and use the provided ID
    this._client = connect(this.uri);

    const _this = this;

    this._client.on("connect", () => {
      _this.connected.setContent(true);
    });
    this._client.on("disconnect", () => {
      _this.connected.setContent(false);
    });
    this._client.on("message", (topic, payload) => {
      const data = JSON.parse(payload.toString("utf-8"));
      for (const subscription of _this._cbs.keys()) {
        // Test if the Topic matches
        if (_mqttMatch(subscription, topic)) {
          if (
            _this._logger?.enabledFor(DEBUG) &&
            !topic.includes("nope/StatusChanged")
          ) {
            _this._logger.debug(
              "received",
              topic,
              data,
              _this._cbs.get(subscription).size
            );
          }
          for (const callback of _this._cbs.get(subscription)) {
            // Callback
            callback(data);
          }

          return;
        }
      }
    });
  }

  /**
   * See {@link ICommunicationInterface.on}
   */
  async on<T extends keyof EventnameToEventType>(
    eventname: T,
    cb: (data: EventnameToEventType[T]) => void
  ): Promise<void> {
    return await this._on(`+/nope/${eventname}`, cb);
  }

  /**
   * See {@link ICommunicationInterface.emit}
   */
  async emit<T extends keyof EventnameToEventType>(
    eventname: T,
    data: EventnameToEventType[T]
  ): Promise<void> {
    await this._emit(`${this.preTopic}/nope/${eventname}`, data);

    if (this.forwardToCustomTopics) {
      switch (eventname) {
        case "dataChanged": {
          let topic = (data as EventnameToEventType["dataChanged"]).path;
          topic = this._adaptTopic(topic);
          await this._emit(
            topic,
            (data as EventnameToEventType["dataChanged"]).data
          );
          break;
        }
        case "event": {
          let topic = (data as EventnameToEventType["event"]).path;
          topic = this._adaptTopic(topic);
          await this._emit(topic, (data as EventnameToEventType["event"]).data);
          break;
        }
        case "rpcRequest": {
          let topic = (data as EventnameToEventType["rpcRequest"]).functionId;
          topic = this._adaptTopic(topic);
          await this._emit(
            topic,
            (data as EventnameToEventType["rpcRequest"]).params
          );
          break;
        }
      }
    }
  }

  readonly receivesOwnMessages: boolean;

  protected _adaptTopic(topic: string): string {
    return replaceAll(topic, ".", "/");
  }

  /**
   * Internal Function to subscribe to a topic using a specific callback
   * @param topic the topic, which should be subscribed to
   * @param callback the callback to call
   * @returns
   */
  protected _on(topic: string, callback: (...args) => void): Promise<void> {
    const _this = this;
    const _topic = `${this._adaptTopic(topic)}`;
    return new Promise<void>((resolve, reject) => {
      if (!_this._cbs.has(_topic)) {
        // No subscription is present:
        // create the subscription.
        _this._cbs.set(_topic, new Set());

        if (_this._logger?.enabledFor(DEBUG)) {
          _this._logger.debug("subscribing :", _topic);
        }

        // Call the Subscription on MQTT
        _this._client.subscribe(_topic, { qos: _this.qos }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });

        // Store the callback
        _this._cbs.get(_topic).add(callback);
      } else {
        // A susbcription is allready present:
        // Store the callback
        _this._cbs.get(_topic).add(callback);
        resolve();
      }
    });
  }

  /**
   * Internal function to remove a susbcription from a topic.
   * To be precise, we only remove the callback.
   * @param topic the topic, which should be unsubscribed
   * @param callback the callback to unsubscribe
   * @returns
   */
  protected _off(topic: string, callback: (...args) => void): Promise<void> {
    const _this = this;
    const _topic = this._adaptTopic(topic);

    return new Promise((resolve, reject) => {
      if (_this._cbs.has(_topic)) {
        _this._cbs.get(_topic).delete(callback);

        if (_this._cbs.get(_topic).size === 0) {
          _this._cbs.delete(_topic);
          if (_this._logger?.enabledFor(INFO)) {
            _this._logger.info("unsubscribing :", _topic);
          }
          _this._client.unsubscribe(_topic, {}, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
          return;
        }
      }

      resolve();
    });
  }

  /**
   * Internal function to publish data on the given topic
   * @param topic The topic to publish the data on
   * @param data The data to publish
   * @returns
   */
  protected _emit(topic: string, data: any): Promise<void> {
    const _this = this;
    const _topic = this._adaptTopic(topic);
    return new Promise<void>((resolve, reject) => {
      // Publish the event
      try {
        if (
          _this._logger?.enabledFor(DEBUG) &&
          !_topic.startsWith(_this.preTopic + "/nope/StatusChanged")
        ) {
          _this._logger.debug("emitting: ", _topic);
        }
        _this._client.publish(
          _topic,
          JSON.stringify(data),
          { qos: _this.qos },
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Function to dispose the Interface.
   * @returns nothing
   */
  public dispose(): Promise<void> {
    const _this = this;
    return new Promise<void>((resolve, reject) => {
      this._client.end(true, {}, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
