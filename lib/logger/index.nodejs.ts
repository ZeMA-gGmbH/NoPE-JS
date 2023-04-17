/**
 * @module logger
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 *
 * This module contains the basics of for logging content.
 *
 * For a logger please use the following methods.
 * - {@link defineNopeLogger} -> Helper to define Logger, based on given parameters or prevent to create that logger.
 * - {@link getCentralNopeLogger} -> The main Logger (singleton)
 * - {@link getNopeLogger} -> A logger with a given name. Child of the `centralLogger`
 *
 * To change the logging behavior use the one of the following funtions:
 * - {@link enabledFor},
 * - {@link enableFor},
 * - {@link shouldLog},
 *
 * You can convert the logger to an eventEmitter using the function {@link getLogerAsEventEmitter}
 *
 *
 * In the backend (`nodejs`) you can use the {@link useLogFile} method to log the content to a file.
 *
 * -----
 *
 * # Using a Logger:
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
 *
 */

export { generateLogfilePath, useLogFile } from "./fileLogging";
export * from "./index.browser";
