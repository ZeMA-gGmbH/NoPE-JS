/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import * as io from "socket.io";
import {
  defineNopeLogger,
  ValidLoggerDefinition,
} from "../../logger/getLogger";
import { INFO } from "../../logger/index.browser";
import {
  EventnameToEventType,
  ICommunicationBridge,
  ICommunicationInterface,
} from "../../types/nope";
import { EventCommunicationInterface } from "./EventCommunicationInterface";

/**
 * Mirror Layer using IO-Sockets.
 *
 * @export
 * @class IoSocketMirrorClient
 */
export class IoHostLayer extends EventCommunicationInterface {
  protected _sockets: Map<io.Socket, ICommunicationInterface>;
  protected _openRequests: { [index: string]: number } = {};

  /**
   * Creates an instance of IoSocketMirrorClient.
   * @author M.Karkowski
   * @param {string} uri
   * @param {ValidLoggerDefinition} [logger="info"]
   * @memberof IoSocketMirrorClient
   */
  constructor(
    protected _bridge: ICommunicationBridge,
    public port: number,
    logger: ValidLoggerDefinition = "info",
    public shareData = false
  ) {
    super(
      // As event Emitter, we provide the IO-Client.
      (io as any)({
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      }),
      defineNopeLogger(logger, "core.layer.io-host"),
      false
    );

    const _this = this;

    // Tell the Server to listen.
    (this._emitter as any).listen(port);

    // Now, because we arent connected we set the connected flag to false,
    // it will only be true, if a connection with this server has been established
    this.connected.getter = () => {
      return true;
    };

    if (_this._logger?.enabledFor(INFO)) {
      this._logger.info("Hosting Server on Port " + port.toString());
    }

    (this._emitter as any).on("connection", (client) => {
      if (_this._logger?.enabledFor(INFO)) {
        _this._logger.info("New Connection established: " + client.id);
      }

      /// Create an Event interface. This we will use as "new layer"
      const nopeIoLayer = new EventCommunicationInterface(
        client,
        this._logger,
        false
      );

      _this._sockets.set(client, nopeIoLayer);
      _this._bridge.addCommunicationLayer(nopeIoLayer).catch((e) => {
        if (_this._logger) {
          _this._logger.error("IO-Host failed to add new client to bridge !");
          _this._logger.error(e);
        }
      });

      // Subscribe to Loosing connection:
      client.on("disconnect", () => {
        if (_this._logger?.enabledFor(INFO)) {
          _this._logger.info("Connection of : " + client.id + " lost.");
        }
        _this._sockets.delete(client);
        _this._bridge.removeCommunicationLayer(nopeIoLayer).catch((e) => {
          if (_this._logger) {
            _this._logger.error(
              "IO-Host failed to remove client from bridge !"
            );
            _this._logger.error(e);
          }
        });

        // Force an Update of the connect-flag
        _this.connected.forcePublish();
      });

      // Force an Update of the connect-flag
      _this.connected.forcePublish();
    });

    this._sockets = new Map();
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
    const promises = new Array<Promise<void>>();
    for (const client of this._sockets.values()) {
      promises.push(client.emit(eventname, data));
    }

    await Promise.all(promises);
  }

  dispose(): Promise<void> {
    // Disposes the Emitter.
    return new Promise<void>((resolve, reject) => {
      (this._emitter as any as io.Server).removeAllListeners();
      (this._emitter as any as io.Server).close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
