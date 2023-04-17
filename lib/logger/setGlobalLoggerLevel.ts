/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-11-11 11:27:38
 * @modify date 2021-11-11 11:27:38
 * @desc [description]
 */

import { getCentralNopeLogger } from "./getLogger";
import { LoggerLevel } from "./nopeLogger";

/**
 * Helper Function to set the general Logger Level.
 * @param level The Level of the Nope.
 */
export function setGlobalLoggerLevel(level: LoggerLevel): void {
  getCentralNopeLogger().level = level;
}
