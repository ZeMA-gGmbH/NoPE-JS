/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-11 13:27:58
 * @modify date 2021-10-19 09:15:38
 * @desc [description]
 *
 */

import { ArgumentParser } from "argparse";
import { readFile } from "fs/promises";
import "reflect-metadata";
import {
  getLayer,
  layerDefaultParameters,
  validLayerOrMirror,
  validLayers,
} from "../communication/getLayer.nodejs";
import { sleep } from "../helpers/async";
import { generateId } from "../helpers/idMethods";
import { deepClone } from "../helpers/objectMethods";
import { getPackageLoader } from "../loader/getPackageLoader.browser";
import { loadFunctions, loadPackages } from "../loader/loadPackages";
import { generateLogfilePath, useLogFile } from "../logger/fileLogging";
import { getNopeLogger } from "../logger/getLogger";
import { LoggerLevel, LoggerLevels } from "../logger/nopeLogger";
import { setGlobalLoggerLevel } from "../logger/setGlobalLoggerLevel";
import { recordCPUProfile } from "../profiling/index.nodejs";
import {
  INopeINopeConnectivityTimeOptions,
  ValidDefaultSelectors,
} from "../types/nope";
import { INopePackageLoader } from "../types/nope/nopePackageLoader.interface";
import { NOPELOGO } from "./renderNope";

export interface RunArgs {
  file: string;
  channel: validLayerOrMirror;
  channelParams: string;
  // Flag to prevent loading the configuration
  skipLoadingConfig: boolean;
  // Level of the logger.
  log: LoggerLevel;
  // The Enable Singletons. Defaults to true
  singleton: boolean;
  // The default-selector to select the service providers
  defaultSelector: ValidDefaultSelectors;
  // The default-selector to select the service providers
  dispatcherLogLevel: LoggerLevel;
  // The default-selector to select the service providers
  communicationLogLevel: LoggerLevel;
  // Enable File-logging:
  logToFile: boolean;
  // Delay to wait for system beeing ready.
  delay: number;
  // Flag to force using the selectors. Might have a performance inpact.
  forceUsingSelectors: boolean;
  // Prevents using varified Names
  preventVarifiedNames: boolean;
  // Define the Timingsparameter;
  timings: Partial<INopeINopeConnectivityTimeOptions>;
  // The Id to use.
  id: string;
  // Flag to enable profiling. Defaults to false.
  profile: boolean;
  // Flag to controll whether base-services should be loaded or not.
  useBaseServices: boolean;
}

export const DEFAULT_SETTINGS: RunArgs = {
  file: "./config/settings.json",
  channel: "event",
  skipLoadingConfig: false,
  channelParams: "not-provided",
  log: "debug",
  singleton: true,
  dispatcherLogLevel: "info",
  communicationLogLevel: "info",
  delay: 2,
  timings: {},
  defaultSelector: "first",
  forceUsingSelectors: false,
  preventVarifiedNames: false,
  logToFile: false,
  id: generateId(),
  profile: false,
  useBaseServices: true,
};

/**
 * Helper Function to Read-In the Arguments used by the
 * cli-tool `run`
 *
 * @export
 * @async
 * @param additionalArguments arguments for the `ArgumentParser`
 * @param {Partial<RunArgs>} [forcedArgs={}] The settings to run the args.
 * @param {ArgumentParser} [parser=null] An additional `ArgumentParser`. If not provided its created
 * @returns {Promise<RunArgs>}
 */
export async function readInArgs(
  additionalArguments: {
    help: string;
    type: "string" | "number";
    name: string | string;
    defaultValue?: any;
  }[] = [],
  forcedArgs: Partial<RunArgs> = {},
  parser: ArgumentParser = null
): Promise<RunArgs> {
  if (parser === null) {
    parser = new ArgumentParser({
      // version: "1.0.0",
      add_help: true,
      description: "Command Line interface, determines the available Packages.",
    });
  }

  for (const arg of additionalArguments) {
    parser.add_argument(arg.name, {
      help: arg.help,
      default: arg.defaultValue,
      type: arg.type,
    });
  }

  parser.add_argument("-f", "--file", {
    help: "File containing containing the package definitions.",
    default: "./config/settings.json",
    type: "str",
    dest: "file",
  });

  parser.add_argument("-c", "--channel", {
    help:
      "The Communication Channel, which should be used. Possible Values are: " +
      // Display all Options:
      Object.getOwnPropertyNames(validLayers)
        .map((item) => {
          return '"' + item + '"';
        })
        .join(", "),
    default: "event",
    type: "str",
    dest: "channel",
  });

  parser.add_argument("-p", "--channelParams", {
    help:
      "Paramas for the Channel, to connect to. The Following Defaults are used: \n" +
      JSON.stringify(layerDefaultParameters, undefined, 4),
    default: "not-provided",
    type: "str",
    dest: "channelParams",
  });

  parser.add_argument("-s", "--skip-loading-config", {
    help: "Flag to prevent loading the elements defined in the settings.json.",
    action: "append",
    nargs: "?",
    dest: "skipLoadingConfig",
  });

  parser.add_argument("--default-selector", {
    help:
      "The default-selector to select the service providers. Possible Values are: " +
      // Display all Options:
      ValidDefaultSelectors.map((item) => {
        return '"' + item + '"';
      }).join(", "),
    default: "first",
    type: "str",
    dest: "defaultSelector",
  });

  parser.add_argument("--log-to-file", {
    help: "Log will be stored in a logfile.",
    action: "append",
    nargs: "?",
    dest: "logToFile",
  });

  parser.add_argument("-l", "--log", {
    help:
      'Specify the Logger Level. Defaults to "info". Valid values are: ' +
      LoggerLevels.join(", "),
    default: "info",
    type: "str",
    dest: "log",
  });

  parser.add_argument("--id", {
    help: "Define a custom id to the Dispatcher",
    default: generateId({
      prestring: "_dispatcher",
      useAsVar: true,
    }),
    type: "str",
    dest: "id",
  });

  parser.add_argument("--dispatcher-log", {
    help:
      'Specify the Logger Level of the Dispatcher. Defaults to "info". Valid values are: ' +
      LoggerLevels.join(", "),
    default: "info",
    type: "str",
    dest: "dispatcherLogLevel",
  });

  parser.add_argument("--force-selector", {
    help: "Forces to use the Selector. Otherwise a smart approach is used, which only enables them if required.",
    action: "append",
    nargs: "?",
    dest: "forceUsingSelectors",
  });

  parser.add_argument("--prevent-varified-names", {
    help: "Enables Random names for variables etc. including var beginning with number or so.",
    action: "append",
    nargs: "?",
    dest: "preventVarifiedNames",
  });

  parser.add_argument("-d", "--delay", {
    help: 'Adds an delay, which will be waited, after the system connected. Parmeter is provided in [s]. Defaults to "2"',
    default: 2,
    type: "float",
    dest: "delay",
  });

  parser.add_argument("--communication-log", {
    help:
      'Specify the Logger Level of the Communication. Defaults to "info". Valid values are: ' +
      LoggerLevels.join(", "),
    default: "info",
    type: "str",
    dest: "communicationLogLevel",
  });

  parser.add_argument("--profile", {
    help: "Flag to enable Profiling",
    action: "append",
    nargs: "?",
    dest: "profile",
  });

  parser.add_argument("--noBaseServices", {
    help: "Flag to enable prevent the base Services to be loaded",
    action: "append",
    nargs: "?",
    dest: "useBaseServices",
  });

  const args: RunArgs = parser.parse_args();

  if (args.channelParams === "not-provided") {
    delete args.channelParams;
  }

  args.skipLoadingConfig = Array.isArray(args.skipLoadingConfig);
  args.profile = Array.isArray(args.profile);
  args.logToFile = Array.isArray(args.logToFile);
  args.forceUsingSelectors = Array.isArray(args.forceUsingSelectors);
  args.useBaseServices = !Array.isArray(args.useBaseServices);
  args.preventVarifiedNames = Array.isArray(args.preventVarifiedNames);

  return Object.assign(args, forcedArgs);
}

/**
 * Main tool to create a runtime. Returns a {@link INopePackageLoader}.
 *
 *
 * @async
 * @param {Partial<RunArgs>} [_args={}] Arguments to configure the runtime.
 * @returns {Promise<INopePackageLoader>} The central logger.
 */
export async function runNopeBackend(
  _args: Partial<RunArgs> = {}
): Promise<INopePackageLoader> {
  let opts: {
    params: string | number;
  };

  // Default Settings
  const _defaultSettings: RunArgs = deepClone(DEFAULT_SETTINGS);
  // Use a different ID.
  _defaultSettings.id = generateId();

  const args = Object.assign(_defaultSettings, _args);

  if (args.channel === "io-server") {
    args.skipLoadingConfig = true;
  }

  const closeCallbacks = [];

  try {
    // Try to read in the default config file.
    opts = JSON.parse(
      await readFile("./nopeconfig.json", {
        encoding: "utf-8",
      })
    );
  } catch (error) {
    opts = {} as any;
  }

  if (LoggerLevels.includes(args.log)) {
    setGlobalLoggerLevel(args.log);
  }

  // Define a Logger
  const logger = getNopeLogger("starter");

  if (args.logToFile) {
    const fileName = generateLogfilePath("run");
    logger.warn("Using File Logger. Logging to", fileName);
    closeCallbacks.push(useLogFile(fileName, 200));
  }

  if (args.profile) {
    logger.warn("Enabled Profiling.");
    closeCallbacks.push(recordCPUProfile());
  }

  if (args.channel === "io-server") {
    logger.warn("Running as Server. Wont load any module!");
    args.skipLoadingConfig = true;
  }

  if (!Object.getOwnPropertyNames(validLayers).includes(args.channel)) {
    logger.error(
      "Invalid Channel. Please use the following values. " +
        Object.getOwnPropertyNames(validLayers)
          .map((item) => {
            return '"' + item + '"';
          })
          .join(", ")
    );

    const error = Error(
      "Invalid Channel. Please use the following values. " +
        Object.getOwnPropertyNames(validLayers)
          .map((item) => {
            return '"' + item + '"';
          })
          .join(", ")
    );

    logger.error(error);

    throw error;
  }

  let _closing = false;
  const _dispose = (reason = null, p = null) => {
    if (_closing) {
      return;
    }

    _closing = true;

    if (reason) {
      // If there is a reason
      logger.error("Unhandled Rejection at: Promise", p, "reason:", reason);
      logger.error(reason);
    } else {
      // We should close the Process:
      logger.warn("received 'ctrl+c'. Shutting down the Instances");
    }
    // Exit the Process
    const promises = [];
    for (const callback of closeCallbacks) {
      try {
        promises.push(callback());
      } catch (e) {
        logger.error("During exiting, an error occourd");
        logger.error(e);
      }
    }
    // Wait for all Promises to finish.
    Promise.all(promises).then(() => {
      process.exit();
    });
  };

  // Subscribe to unhandled Reactions.
  process.on("unhandledRejection", (reason, p) => _dispose(reason, p));
  process.on("SIGINT", () => _dispose());
  process.on("SIGTERM", () => _dispose());
  process.on("exit", () => {
    logger.info("Completed. Goodbye");
  });

  // Assign the Default Setting for the Channel.
  opts.params = layerDefaultParameters[args.channel];

  if (args.channelParams != "not-provided") {
    try {
      try {
        // We try to parse the data.
        opts.params = JSON.parse(args.channelParams);
      } catch (e) {
        opts.params = JSON.parse('"' + args.channelParams + '"');
      }
    } catch (e) {
      logger.error(
        "Unable to parse the Parameters for the channel. Please use valid JSON!"
      );
      logger.error(args.channelParams[0]);
      logger.error(e);
      throw e;
    }
  }

  let loader: INopePackageLoader;
  try {
    loader = getPackageLoader(
      {
        communicator: getLayer(
          args.channel,
          opts.params,
          args.communicationLogLevel
        ),
        logger: getNopeLogger("dispatcher", args.dispatcherLogLevel),
        defaultSelector: args.defaultSelector,
        forceUsingSelectors: args.forceUsingSelectors,
        forceUsingValidVarNames: !args.preventVarifiedNames,
        id: args.id,
        isMaster: args.channel !== "io-server" ? null : false,
      },
      {
        singleton: _args.singleton,
        useBaseServices: _args.useBaseServices,
      }
    );

    // Add the Dispatcher
    closeCallbacks.push(async () => {
      await loader.dispatcher.dispose();
    });

    // If required load all Packages.
    if (!args.skipLoadingConfig) {
      // Try to load the Modules.

      if (args.delay > 0) {
        logger.info(`Waiting ${args.delay} [s] to get all information.`);
        await sleep(args.delay * 1000);
      }

      // If required load all Packages.
      try {
        logger.info("loading Functions");
        await loadFunctions(loader, args.file, args.delay);
      } catch (e) {
        logger.error("Unable to load the Functions defined in " + args.file);
      }

      try {
        logger.info("loading Packages");
        await loadPackages(loader, args.file, args.delay);
      } catch (e) {
        logger.error("Unable to load the Packages defined in " + args.file);
      }
    }
  } catch (e) {
    getNopeLogger("cli", "info").error("failed to load the Packages", e);

    throw e;
  }

  return loader;
}

/**
 * Main Function.
 *
 * @export
 */
export async function main(
  additionalArguments: {
    help: string;
    type: "string" | "number";
    name: string | string;
    defaultValue?: any;
  }[] = [],
  forcedArgs: Partial<RunArgs> = {},
  quiet = false
) {
  if (!quiet) {
    console.log(NOPELOGO);
    console.log("\n\n");
  }

  const args = await readInArgs(additionalArguments, forcedArgs);
  return await runNopeBackend(args);
}

// If requested As Main => Perform the Operation.
if (require.main === module) {
  main();
}

export default main;
