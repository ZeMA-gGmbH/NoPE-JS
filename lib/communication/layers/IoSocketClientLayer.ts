/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { connect } from "socket.io-client";
import {
  defineNopeLogger,
  ValidLoggerDefinition,
} from "../../logger/getLogger";
import { EventCommunicationInterface } from "./EventCommunicationInterface";

/**
 * Mirror Layer using IO-Sockets.
 *
 * @export
 * @class IoSocketMirrorClient
 */
export class IoSocketClientLayer extends EventCommunicationInterface {
  /**
   * Creates an instance of IoSocketMirrorClient.
   * @author M.Karkowski
   * @param {string} uri
   * @param {ValidLoggerDefinition} [logger="info"]
   * @memberof IoSocketMirrorClient
   */
  constructor(public uri: string, logger: ValidLoggerDefinition = "info") {
    super(
      // As event Emitter, we provide the IO-Client.
      connect(uri.startsWith("http://") ? uri : "http://" + uri) as any,
      defineNopeLogger(logger, "core.mirror.io"),
      false
    );

    // Make shure we use the http as starting of the uri.
    this.uri = this.uri.startsWith("http://") ? this.uri : "http://" + this.uri;

    // Now, because we arent connected we set the connected flag to false,
    // it will only be true, if a connection with the server has been established
    // Therefore we will connect to the "connect" and "disconnect" event of the
    // socket.
    this.connected.setContent(false);

    this._logger.info("connecting to: " + uri);

    const _this = this;

    this._emitter.on("connect", (...args) => {
      // Element is connected
      _this._logger.info("connected");
      _this.connected.setContent(true);
    });

    this._emitter.on("disconnect", () => {
      // Connection Lost.
      _this._logger.error("Connection lost!");
      _this.connected.setContent(false);
    });
  }

  async dispose(): Promise<void> {
    // Disposes the Emitter.
    (this._emitter as any as SocketIOClient.Socket).removeAllListeners();
    (this._emitter as any as SocketIOClient.Socket).disconnect();
  }
}
