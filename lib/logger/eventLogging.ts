/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-05-21 16:44:59
 * @modify date 2021-10-19 17:47:39
 * @desc [description]
 */

import { EventEmitter } from "events";
import { getSingleton } from "../helpers/singletonMethod";
import { getCentralNopeLogger } from "./getLogger";
import { LoggerLevel } from "./nopeLogger";

export type TCallback = (name: string, msg: string) => void;
export type TCallbackWithLevel = (
  level: LoggerLevel,
  name: string,
  msg: string
) => void;

export class LoggerAsEventEmitter {
  constructor(protected _emitter = new EventEmitter()) {
    this._emitter = new EventEmitter();
  }

  /**
   * Register a Callback for All Log Messages
   *
   * @author M.Karkowski
   * @param {TCallbackWithLevel} callback The callback to use.
   * @memberof LoggerAsEventEmitter
   */
  onLog(callback: TCallbackWithLevel): void {
    this._emitter.on("log", callback);
  }

  /**
   * Register a Callback for debug messages
   *
   * @author M.Karkowski
   * @param {TCallback} callback The callback to use
   * @memberof LoggerAsEventEmitter
   */
  onDebug(callback: TCallback): void {
    this._emitter.on("log.debug", callback);
  }

  /**
   * Register a Callback for info messages
   *
   * @author M.Karkowski
   * @param {TCallback} callback The callback to use
   * @memberof LoggerAsEventEmitter
   */
  onInfo(callback: TCallback): void {
    this._emitter.on("log.info", callback);
  }

  /**
   * Register a Callback for warn messages
   *
   * @author M.Karkowski
   * @param {TCallback} callback The callback to use
   * @memberof LoggerAsEventEmitter
   */
  onWarn(callback: TCallback): void {
    this._emitter.on("log.warn", callback);
  }

  /**
   * Register a Callback for error messages
   *
   * @author M.Karkowski
   * @param {TCallback} callback The callback to use
   * @memberof LoggerAsEventEmitter
   */
  onError(callback: TCallback): void {
    this._emitter.on("log.error", callback);
  }

  /**
   * Emits a logging message.
   *
   * @author M.Karkowski
   * @param {LoggerLevel} level The logging level
   * @param {string} name Name of the Logger.
   * @param {string} msg Message
   * @memberof LoggerAsEventEmitter
   */
  emit(level: LoggerLevel, name: string, msg: string): void {
    switch (level) {
      case "debug":
        this._emitter.emit("log.debug", name, msg);
        break;
      case "info":
        this._emitter.emit("log.info", name, msg);
        break;
      case "warn":
        this._emitter.emit("log.warn", name, msg);
        break;
      case "error":
        this._emitter.emit("log.error", name, msg);
        break;
    }
    this._emitter.emit("log", level, name, msg);
  }
}

export function getLogerAsEventEmitter(): LoggerAsEventEmitter {
  const res = getSingleton("nope.logger.event", () => {
    return new LoggerAsEventEmitter();
  });
  return res.instance;
}

/**
 * Function to use a log file instead of the console log.
 *
 * @export
 */
export function useEventLogger(): LoggerAsEventEmitter {
  const logger = getCentralNopeLogger();

  const emitter = getLogerAsEventEmitter();

  logger.setHandler((msg, context) => {
    const msgs: string[] = [];

    // Change the msg to an string based Object.
    for (const key in msg) {
      msgs.push(msg[key].toString());
    }

    emitter.emit(
      context.level.name.toLowerCase(),
      context.name,
      msgs.join(" ")
    );
  });

  return emitter;
}
