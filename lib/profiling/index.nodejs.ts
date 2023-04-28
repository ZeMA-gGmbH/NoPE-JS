"use strict";
import { join } from "path";
import { replaceAll } from "../helpers/stringMethods";
import { getNopeLogger } from "../index.browser";
import { createFile } from "../index.nodejs";

export const CURRENT_DATE = _parsableISOString();
export const DEFAULT_LOG_LOCATION = join(process.cwd(), "logs");
const DEFAULT_FILE = join(
  DEFAULT_LOG_LOCATION,
  "cpu_profile_" + CURRENT_DATE + ".cpuprofile"
);
const logger = getNopeLogger("CPU-Profiler");

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
  return join(
    DEFAULT_LOG_LOCATION,
    name + "_" + _parsableISOString() + ".cpuprofile"
  );
}

export function recordCPUProfile(pathToFile = DEFAULT_FILE) {
  const title = "cpu-profile";

  const nodeVersion = process.version.match(/^v(\d+\.\d+)/)[1];
  const major = nodeVersion.split(".")[0];

  if (parseInt(major) >= 19) {
    const v8Profiler = require("v8-profiler-next");
    // set generateType 1 to generate new format for cpuprofile
    // to be compatible with cpuprofile parsing in vscode.
    v8Profiler.setGenerateType(1);

    // ex. 5 mins cpu profile
    v8Profiler.startProfiling(title, true);

    let stopped = false;

    const stopProfiling = async () => {
      if (stopped) {
        return;
      }

      stopped = true;

      const profile = v8Profiler.stopProfiling(title);

      const promise = new Promise((resolve, reject) => {
        profile.export(function (error, result) {
          if (error) {
            reject(error);
          }
          resolve(result);
        });
      });

      const result: any = await promise;

      // if it doesn't have the extension .cpuprofile then
      // chrome's profiler tool won't like it.

      // examine the profile:
      //   Navigate to chrome://inspect
      //   Click Open dedicated DevTools for Node
      //   Select the profiler tab
      //   Load your file
      await createFile(pathToFile, result);

      logger.info(
        "Please open google chrome and open chrome://inspect and load the file",
        pathToFile
      );

      // Clear the Profile.
      profile.delete();
    };

    return stopProfiling;
  }

  logger.warn("Logging not enabled for the current node version. ");

  return async () => {
    // Placeholder.
  };
}
