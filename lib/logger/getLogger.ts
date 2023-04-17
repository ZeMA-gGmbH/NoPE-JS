/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:54:35
 * @modify date 2022-01-03 18:02:49
 * @desc [description]
 */

import { ILogger } from "js-logger";
import { getSingleton } from "../helpers/singletonMethod";
import { LoggerLevel, NopeLogger } from "./nopeLogger";

/**
 * Return the central loger. This logger is a singleton (see {@link getSingleton})
 *
 * @author M.Karkowski
 * @export
 * @return {NopeLogger} A Returns the Logger {@link NopeLogger}
 */
export function getCentralNopeLogger(): NopeLogger {
  const container = getSingleton("nopeBackendLogger.instance", () => {
    return new NopeLogger();
  });

  return container.instance;
}

/**
 * Helper Function, to create a Logger. Therefore it uses a specific Level and a Lable of the
 * Logger. The Logger-Level can be overwritten by the central-logger see {@link getCentralNopeLogger}
 *
 *
 * @export
 * @param {LoggerLevel} level The Level, which should be rendered
 * @param {string} [label=''] An Lable for the Logger. Every Message beginns with that lable.
 * @return {*} Returns a Logger.
 */
export function getNopeLogger(name: string, level?: LoggerLevel): ILogger {
  return getCentralNopeLogger().getLogger(name, level);
}

/**
 * The valid defintion types for the logger.
 */
export type ValidLoggerDefinition = ILogger | LoggerLevel | false;

/**
 * Helper to define a Logger based on the given Logger-Definition.
 * Based on the type, a new logger is created ("LoggerLevel"), the
 * provided Logger is used or if "false" no logger is returned.
 *
 * @author M.Karkowski
 * @export
 * @param {ValidLoggerDefinition} param
 * @param {string} defaultName
 * @return {*}
 */
export function defineNopeLogger(
  param: ValidLoggerDefinition,
  defaultName: string
) {
  if (param == false) {
    return undefined;
  }
  if (typeof param === "string") {
    return getNopeLogger(defaultName, param);
  }
  return param as ILogger;
}
