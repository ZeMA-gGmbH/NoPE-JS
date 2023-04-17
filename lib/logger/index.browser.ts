/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 *
 *
 * # Logging:
 * 1. Lets create our logger:
 *
 *
 * ```javascript
 * // First lets install nope using npm
 * const nope = require("../dist-nodejs/index.nodejs");
 *
 * // Create our Observable:
 * const logger = nope.getNopeLogger("demo");
 * ```
 *
 * Now, that our logger has been created, we are able to log our first messages:
 *
 *
 * ```javascript
 * logger.trace("hello from 'trace' level")
 * logger.debug("hello from 'debug' level")
 * logger.info("hello from 'info' level")
 * logger.warn("hello from 'warn' level")
 * logger.error("hello from 'error' level")
 * ```
 *
 * >```
 * >    2023-03-28T15:50:49.827Z - DEBUG - demo : hello from 'debug' level
 * >    2023-03-28T15:50:49.827Z - INFO  - demo : hello from 'info' level
 * >
 * >
 * >    2023-03-28T15:50:49.827Z - WARN  - demo : hello from 'warn' level
 * >    2023-03-28T15:50:49.827Z - ERROR - demo : hello from 'error' level
 * >```
 *
 * To change the logging level use the property level:
 *
 *
 * ```javascript
 * logger.setLevel(nope.WARN);
 * ```
 *
 *
 * ```javascript
 * logger.trace("hello from 'trace' level")
 * logger.debug("hello from 'debug' level")
 * logger.info("hello from 'info' level")
 * logger.warn("hello from 'warn' level")
 * logger.error("hello from 'error' level")
 * ```
 *
 * >```
 * >    2023-03-28T15:52:36.027Z - WARN  - demo : hello from 'warn' level
 * >    2023-03-28T15:52:36.027Z - ERROR - demo : hello from 'error' level
 * >```
 *
 * As you can see you are able to change the log level.
 *
 */

import * as Logger from "js-logger";
import { getCentralNopeLogger } from "./getLogger";

// Create a Central Logger instance.
getCentralNopeLogger();

/**
 * Tracing Logger-Level
 */
export const TRACE = (Logger as any).TRACE;
/**
 * Debug Logger-Level
 */
export const DEBUG = (Logger as any).DEBUG;
/**
 * Info Logger-Level
 */
export const INFO = (Logger as any).INFO;
/**
 * Warn Logger-Level
 */
export const WARN = (Logger as any).WARN;
/**
 * Error Logger-Level
 */
export const ERROR = (Logger as any).ERROR;

/**
 * The valid log-levels
 */
export const LEVELS = {
  trace: TRACE,
  debug: DEBUG,
  info: INFO,
  warn: WARN,
  error: ERROR,
};

/**
 * The Logger-Interface
 */
export { ILogger } from "js-logger";
export {
  getLogerAsEventEmitter,
  LoggerAsEventEmitter,
  TCallback,
  TCallbackWithLevel,
  useEventLogger,
} from "./eventLogging";
export {
  defineNopeLogger,
  getCentralNopeLogger,
  getNopeLogger,
  ValidLoggerDefinition,
} from "./getLogger";
export {
  enabledFor,
  enableFor,
  LoggerLevel,
  LoggerLevels,
  shouldLog,
} from "./nopeLogger";
export { setGlobalLoggerLevel } from "./setGlobalLoggerLevel";
