/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { readFile } from "fs/promises";
import { join, resolve } from "path";
import "reflect-metadata";
import { sleep } from "../helpers/async";
import { createFile, listFiles } from "../helpers/fileMethods";
import { determineDifference } from "../helpers/setMethods";
import {
  deepClone,
  getCentralDecoratedContainer,
  parseWithFunctions,
  stringifyWithFunctions,
} from "../index.browser";
import { ValidLoggerDefinition, getNopeLogger } from "../logger/getLogger";
import { IPackageDescription } from "../types/nope/nopePackage.interface";
import { INopePackageLoader } from "../types/nope/nopePackageLoader.interface";
import { DEFAULT_SETTINGS } from "../cli/runNopeBackend";
import {
  validLayerOrMirror,
  validLayerParameters,
} from "../communication/index.nodejs";

const logger = getNopeLogger("helper-load-packages");

export interface IPackageConfig extends Partial<IPackageDescription<any>> {
  // File Path of the element.
  path: string;
}

export interface IConfigFile {
  functions: {
    path: string;
    functions: string[];
  }[];
  packages: IPackageConfig[];
  connections: {
    name: validLayerOrMirror;
    url: string;
    log: ValidLoggerDefinition;
    considerConnection: boolean;
    forwardData: boolean;
  }[];
  config: any;
}

/**
 * List the available Packages
 *
 * @export
 * @param {string} [dir='./modules']
 * @return {*}
 */
export async function listPackages(dir = "./modules") {
  // Define the Return Array.
  const ret = new Array<{
    package: IPackageDescription<any>;
    path: string;
  }>();

  // Scan for the Package-Files
  // And iterate over them.
  for (const fileName of await listFiles(dir, ".package.js")) {
    // Now Try to load a Package, to test whether is is an assembly.
    try {
      logger.info("found ", fileName);

      ret.push({
        package: (await import(resolve(fileName)))
          .DESCRIPTION as IPackageDescription<any>,
        path: fileName,
      });
    } catch (e) {
      logger.error("Failed Loading the Package " + fileName);
      logger.error(e);
    }
  }

  return ret;
}

export async function listFunctions(dir = "./modules") {
  // Define the Return Array.
  const ret = new Array<{
    content: any;
    path: string;
  }>();

  // Scan for the Package-Files
  // And iterate over them.
  for (const fileName of await listFiles(dir, ".functions.js")) {
    // Now Try to load a Package, to test whether is is an assembly.
    try {
      logger.info("found ", fileName);

      ret.push({
        content: (await import(resolve(fileName))).DESCRIPTION,
        path: fileName,
      });
    } catch (e) {
      logger.error("Failed Loading the functions in file: " + fileName);
      logger.error(e);
    }
  }

  return ret;
}

/**
 * Helper Function to write a default configuration.
 *
 * @export
 * @param {string} [dir='./modules']
 * @param {string} [filename=join(resolve(process.cwd()), 'config', 'assembly.json')]
 */
export async function writeDefaultConfig(
  dir = "./modules",
  filename: string = join(resolve(process.cwd()), "config", "settings.json")
) {
  // Determine all Packages
  const packages: IPackageConfig[] = (await listPackages(dir)).map((item) => {
    return {
      nameOfPackage: item.package.nameOfPackage,
      defaultInstances: item.package.defaultInstances,
      autostart: item.package.autostart,
      path: item.path,
    };
  });

  const functions = (await listFunctions(dir)).map((item) => {
    return {
      path: item.path,
      functions: Object.getOwnPropertyNames(item.content || {}),
    };
  });

  const config = deepClone(DEFAULT_SETTINGS);

  config.channelParams = "localhost:7000";
  config.channel = "event";

  delete config.id;

  const file: IConfigFile = {
    functions,
    packages,
    // Export the configuration
    config,
    connections: [],
  };

  await createFile(filename, stringifyWithFunctions(file, 4));
}

/**
 * Function to load the Packages.
 *
 * @export
 * @param {INopePackageLoader} loader
 * @param {string} filename
 */
export async function loadPackages(
  loader: INopePackageLoader,
  filename: string = join(resolve(process.cwd()), "config", "settings.json"),
  delay = 2
) {
  let data: IConfigFile = {
    functions: [],
    packages: [],
    connections: [],
    config: {},
  };

  try {
    /** Load the File and Parse it. */
    data = parseWithFunctions(await readFile(filename, { encoding: "utf8" }));
  } catch (e) {
    // Generate the Default File
    await writeDefaultConfig(filename);

    // Show an Hint
    logger.warn(
      "No configuration was present. Created a new config file in " + filename
    );

    // Readin the newly created Data.
    data = JSON.parse(
      await readFile(filename, {
        encoding: "utf8",
      })
    );
  }

  // Define the Return Array.
  const packages = new Array<IPackageDescription<any>>();

  // Scan for the Package-Files
  // And iterate over them.
  for (const item of data.packages) {
    // Now Try to load a Package, to test whether is is an assembly.
    try {
      const loadedPackage = (await import(resolve(item.path)))
        .DESCRIPTION as IPackageDescription<any>;
      loadedPackage.autostart = item.autostart;
      loadedPackage.defaultInstances = item.defaultInstances;
      packages.push(loadedPackage);
    } catch (e) {
      logger.error("Failed Loading the Package " + item.nameOfPackage);
      logger.error(e);
    }
  }

  await loader.dispatcher.ready.waitFor();

  // Iterate over the Packages
  for (const thePackageToLoad of packages) {
    try {
      await loader.addPackage(thePackageToLoad);
    } catch (e) {
      logger.error(
        'Failed Add the Package "' +
          thePackageToLoad.nameOfPackage +
          '" to the PackageLoader',
        e
      );
    }
  }

  if (delay > 0) {
    logger.info(`Waiting ${delay / 2} [s] before hosting services.`);
    await sleep(delay * 500);
  }

  await loader.generateInstances();

  if (delay > 0) {
    logger.info(`Waiting ${delay / 2} [s] before creating instances.`);
    await sleep(delay * 500);
  }

  // Generate the instances.
  await loader.generateInstances();
}

/**
 * Helper to read function provided in the defined configuration.
 *
 * @author M.Karkowski
 * @export
 * @param {string} [filename=join(resolve(process.cwd()), "config", "assembly.json")]
 * @return {*}
 */
export async function loadFunctions(
  loader: INopePackageLoader,
  filename: string = join(resolve(process.cwd()), "config", "settings.json"),
  delay = 2
) {
  let data: IConfigFile = {
    functions: [],
    packages: [],
    connections: [],
    config: {},
  };

  try {
    /** Load the File and Parse it. */
    data = JSON.parse(await readFile(filename, { encoding: "utf8" }));
  } catch (e) {
    // Generate the Default File
    await writeDefaultConfig(filename);

    // Show an Hint
    logger.warn(
      "No configuration was present. Created a new config file in " + filename
    );

    // Readin the newly created Data.
    data = JSON.parse(
      await readFile(filename, {
        encoding: "utf8",
      })
    );
  }

  // Define the Return Array.
  const successfull = new Array<any>();

  // Get the container containing all registered Services and Classes.
  const CONTAINER = getCentralDecoratedContainer();

  // Scan for the Package-Files
  // And iterate over them.
  for (const item of data.functions) {
    // Now Try to load a Package, to test whether is is an assembly.
    try {
      // Load the Function:
      const before = new Set<string>(CONTAINER.services.keys());
      await import(resolve(item.path));
      const after = new Set<string>(CONTAINER.services.keys());

      const diff = determineDifference(before, after);
      if (diff.added.size > 0) {
        logger.info(
          "loaded services of file",
          '"' + item.path + '"',
          "found:" + JSON.stringify(Array.from(diff.added), undefined, 4)
        );
      }

      // Mark the file as sucessfully loaded.
      successfull.push(item.path);
    } catch (e) {
      logger.error("Failed Loading function-file at " + item.path);
      logger.error(e);
    }
  }

  await loader.addDecoratedElements({
    consider: ["services"],
  });

  return successfull;
}
