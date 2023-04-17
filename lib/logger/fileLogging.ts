/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-05-21 16:44:59
 * @modify date 2021-10-19 17:47:56
 * @desc [description]
 */

import { writeFile } from "fs";
import { join } from "path";
import { createFile } from "../helpers/fileMethods";
import { replaceAll } from "../helpers/stringMethods";
import { sleep } from "../index.browser";
import { getCentralNopeLogger, getNopeLogger } from "./getLogger";
import { formatMsgForConsole } from "./nopeLogger";

export const CURRENT_DATE = _parsableISOString();
export const DEFAULT_LOG_LOCATION = join(process.cwd(), "logs");
const DEFAULT_FILE = join(DEFAULT_LOG_LOCATION, CURRENT_DATE + ".log");

function _parsableISOString(date = new Date()) {
  let isoString = date.toISOString();
  isoString = replaceAll(isoString, ":", "-");
  isoString = replaceAll(isoString, ".", "-");
  return isoString;
}

/**
 * Generates a Log-File Path based on the given name with the following format:
 * /logs/{name}_{date}.log
 *
 * @export
 * @param {string} name Name of the File.
 * @return {string}
 * @backend **Only in Nodejs available**
 */
export function generateLogfilePath(name: string): string {
  return join(DEFAULT_LOG_LOCATION, name + "_" + _parsableISOString() + ".log");
}

/**
 * Function to use a log file instead of the console log.
 *
 * @author M.Karkowski
 * @export
 * @param {string} [pathToFile=DEFAULT_FILE] Path to the logfile
 * @param {number} [bufferSize=0] Default Buffer-Size. If > 0 we will write the log with buffering.
 * @backend **Only in Nodejs available**
 */
export function useLogFile(
  pathToFile = DEFAULT_FILE,
  bufferSize = 100
): () => Promise<void> {
  const logger = getCentralNopeLogger();
  let bufferSizeToUse = bufferSize;

  // Define a function, that will write the content of the Buffer to our
  // file.
  const writeBufferToFile = function (cb: () => void = null) {
    const textToStore = "\n" + buffer.join("\n");

    readyToWrite = false;

    // Now lets start to write the Fil.e
    writeFile(
      pathToFile,
      textToStore,
      {
        encoding: "utf-8",
        flag: "a",
      },
      (err) => {
        if (err) {
          console.error(err);
        } else {
          readyToWrite = true;

          if (typeof cb == "function") {
            cb();
          }
        }
      }
    );

    buffer = [];
  };

  let buffer: string[] = [];
  let readyToWrite = false;

  // Now every thing, is defined, so we are able to
  // define our file.

  const consoleLogger = getNopeLogger("file-logger");

  createFile(pathToFile, "", { encoding: "utf-8" }).then(
    // If our file has been created,
    (_) => {
      readyToWrite = true;

      // Now make shure, that our inital buffer has been written
      if (buffer.length > 0) {
        writeBufferToFile();
      }
    }
  );

  logger.setHandler((msg, context) => {
    // Else we extend our buffer:
    const logAsString = [
      new Date().toISOString(),
      "-",
      context.level.name,
      "-",
      context.name,
      ":",
      // Try to store the Elements a String.
      Object.values(msg)
        .map((item) => {
          try {
            if (typeof item === "object")
              return JSON.stringify(item, undefined, 2);
            return item;
          } catch (e) {
            try {
              return item.toString();
            } catch (e) {
              return item;
            }
          }
        })
        .join(" "),
    ].join(" ");
    buffer.push(logAsString);

    if (context.level.name === "ERROR") {
      // We want errors to be rendered in here as well.
      console.log(...formatMsgForConsole(msg, context));
    }

    if (bufferSizeToUse < buffer.length) {
      if (readyToWrite) {
        // Now if the Data is ready, lets write the
        // buffer to the File.
        writeBufferToFile();
      } else if (_clearing) {
        clearBufferAtEnd();
      }
    }
  });

  let _clearing = false;

  const clearBufferAtEnd = async () => {
    consoleLogger.info("Shutdown detected! Trying to Write the Buffer");
    _clearing = true;

    while (!readyToWrite || buffer.length > 0) {
      if (readyToWrite) {
        const promise = new Promise<void>((resolve, reject) => {
          writeBufferToFile(resolve);
        });

        await promise;
      } else await sleep(50);
    }

    bufferSizeToUse = 0;
  };

  return clearBufferAtEnd;
}
