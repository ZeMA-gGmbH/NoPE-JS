/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-03-22 19:03:15
 * @modify date 2022-01-03 17:34:13
 * @desc [description]
 */

import * as io from "socket.io";
import {
  defineNopeLogger,
  ValidLoggerDefinition,
} from "../../logger/getLogger";
import { DEBUG, ILogger, INFO } from "../../logger/index.browser";
import { Eventnames, IRpcResponseMsg, IRequestRpcMsg } from "../../types/nope";
import { EventCommunicationInterface } from "./EventCommunicationInterface";

/**
 * Mirror Layer using IO-Sockets.
 *
 * @export
 * @class IoSocketMirrorServer
 */
export class ioSocketServerLayer extends EventCommunicationInterface {
  protected _sockets: Set<io.Socket>;
  protected _openRequests: { [index: string]: number } = {};
  protected _profile: boolean;

  /**
   * Creates an instance of IoSocketMirrorServer.
   * @author M.Karkowski
   * @param {number} port Port the Server is running on.
   * @param {ValidLoggerDefinition} [logger="info"]
   * @memberof IoSocketMirrorServer
   */
  constructor(
    public port: number,
    logger: ValidLoggerDefinition = "info",
    profile = false
  ) {
    super(
      // As event Emitter, we provide the IO-Client.
      (io as any)({
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      }),
      defineNopeLogger(logger, "core.mirror.io-srv")
    );
    const _this = this;

    // Store, whether we want to profile our data or not.
    this._profile = profile;

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

      _this._sockets.add(client);

      // Now Subscribe the Events and make shure we
      // are forwarding the data.
      for (const event of Eventnames) {
        client.on(event, (data) => {
          if (_this._profile) {
            if (event == "rpcRequest") {
              _this._profileTask("add", data.taskId);
            } else if (event == "rpcResponse") {
              _this._profileTask("remove", data.taskId);
            }
          }

          if (event !== "statusChanged" && _this._logger?.enabledFor(DEBUG)) {
            _this._logger.debug(
              "forwarding",
              "'" + event.toString() + "'",
              data
            );
          }
          _this._forward(client, event, data);
        });
      }

      // Subscribe to Loosing connection:
      client.on("disconnect", () => {
        if (_this._logger?.enabledFor(INFO)) {
          _this._logger.info("Connection of : " + client.id + " lost.");
        }
        _this._sockets.delete(client);

        // Force an Update of the connect-flag
        _this.connected.forcePublish();
      });

      // Force an Update of the connect-flag
      _this.connected.forcePublish();
    });

    this._sockets = new Set();
  }

  protected _profileTask(
    mode: "add" | "remove",
    data: IRequestRpcMsg | IRpcResponseMsg
  ) {
    try {
      if (mode == "add") {
        this._openRequests[data.taskId] = Date.now();
      } else {
        if (this._openRequests[data.taskId] !== undefined) {
          const start = this._openRequests[data.taskId];
          const end = Date.now();
          const delta = Math.round((end - start) * 100) / 100;

          this._logger.info(`The execution of the task took ${delta} [ms]!`);

          delete this._openRequests[data.taskId];
        }
      }
    } catch (e) {
      logger.error(`Failed in 'profileTask' mode=${mode}, data=${data}`);
    }
  }

  /**
   * Helper Function, to forward events to the other connected Sockets.
   *
   * @protected
   * @param {io.Socket} socket The socket, which initally received the data.
   * @param {string} event the event which was received
   * @param {*} data the data, that needs to be forwarded
   * @memberof IoSocketMirrorServer
   */
  protected _forward(socket: io.Socket, event: string, data: any): void {
    // Flag, used to Debug
    let forwarded = false;
    for (const socketToForward of this._sockets) {
      if (socket !== socketToForward) {
        socketToForward.emit(event, data);
        // If data has been sended, our flag is set to true
        forwarded = true;
      }
    }

    // Now we log the output
    if (event !== "statusChanged" && this._logger?.enabledFor(DEBUG)) {
      this._logger.debug(
        forwarded ? "forwarded" : "didnt forward",
        "'" + event.toString() + "'",
        data
      );
    }
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
