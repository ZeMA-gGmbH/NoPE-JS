/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { ArgumentParser } from "argparse";
import { join, resolve } from "path";
import "reflect-metadata";
import { convertPathToOsPath, createFile } from "../helpers/fileMethods";
import {
  getCentralDecoratedContainer,
  IServiceOptions,
  stringifyWithFunctions,
} from "../index.browser";
import { listFunctions, listPackages } from "../index.nodejs";
import { IUiDefinition } from "../types/ui";
import { readFile } from "node:fs/promises";
import { getNopeLogger, replaceAll } from "../index.browser";
import * as superagent from "superagent";

/**
 * Helper Function to write a default configuration.
 */
export async function writeUiFile(
  options: {
    dir: string;
    filename: string;
  } = {
    dir: "./dist",
    filename: join(resolve(process.cwd()), "config", "ui.json"),
  }
) {
  const uiFile: IUiDefinition = {
    functions: {},
    classes: {},
  };

  const logger = getNopeLogger("ui-scanner");

  // This call makes shure, that every function is loaded
  const functions = await listFunctions(options.dir);
  const packages = await listPackages(options.dir);

  const CONTAINER = getCentralDecoratedContainer();

  // Determine all Packages
  for (const item of packages) {
    // Iterate over the classes.
    try {
      for (const cls of item.package.providedClasses) {
        const itemToAdd: IUiDefinition["classes"][0] = {
          ui: cls.ui,
          // Define the Methods elements
          methods: {},
        };

        // The Service
        const services =
          CONTAINER.classes.get(cls.description.name)?._markedElements || [];

        for (const srv of services) {
          if (srv.type === "method" && (srv.options as IServiceOptions).ui) {
            itemToAdd.methods[srv.accessor] = (
              srv.options as IServiceOptions
            ).ui;
          }
        }

        if (
          itemToAdd.ui ||
          Object.getOwnPropertyNames(itemToAdd.methods).length > 0
        ) {
          // If an ui definition exists, we want
          // to export it and store it in our file.
          const ui = itemToAdd.ui || {};
          const methods = itemToAdd.methods || {};

          uiFile.classes[cls.description.name] = {
            ui,
            methods,
          };
        }
      }

      // Iterate over the functions and provide their uis.
      item.package.providedServices.map((funcs) => {
        if (funcs.options.ui) {
          // Store the UI definition in the config file.
          uiFile.functions[funcs.options.id] = {
            id: funcs.options.id,
            ui: funcs.options.ui,
            schema: funcs.options.schema,
          };
        }
      });
    } catch (e) {
      logger.error("Failed to consider file", item.path);
      logger.error(e);
    }
  }

  for (const [id, data] of CONTAINER.services.entries()) {
    if (data.options.ui) {
      uiFile.functions[id] = {
        id,
        ui: data.options.ui,
        schema: data.options.schema,
      };
    }
  }

  await createFile(options.filename, stringifyWithFunctions(uiFile, 4));
}

/**
 * Helper to extract the Arguments for the `writeUiFile` function @see writeUiFile
 *
 * @author M.Karkowski
 * @export
 * @param additionalArguments Arguments added by the nope.cli
 * @return {*} The Arguments
 */
export function readInWriteUiFileArgs(
  additionalArguments: {
    help: string;
    type: "string" | "number";
    name: string | string;
    defaultValue?: any;
  }[] = []
) {
  const parser = new ArgumentParser({
    // version: "1.0.0",
    add_help: true,
    description: "Command Line interface, determines the available Packages.",
  });

  for (const arg of additionalArguments) {
    parser.add_argument(arg.name, {
      help: arg.help,
      default: arg.defaultValue,
      type: arg.type,
    });
  }

  parser.add_argument("-f", "--file", {
    help: "Filename for the configuration.",
    default: "./config/ui.json",
    type: "str",
    dest: "filename",
  });

  parser.add_argument("-d", "--dir", {
    help: "Directory to search for the ui definitions",
    default: "./modules",
    type: "str",
    dest: "dir",
  });

  const args: {
    dir: string;
    filename: string;
  } = parser.parse_args();

  return args;
}

export interface IDataElement {
  name: string;
  originalName: string;
  path: string;
  keywords: string;
  identifier: string;
  additionalOptions: any;
  uuid: string;
  type: string;
  date: string;
}

export interface UploadArgs {
  /**
   * File containing the UI-Defintions
   */
  file: string;

  /**
   * Default uri of the upload server
   */
  uri: string;

  /**
   * The mode how to handle the ui-file.
   */
  mode: "replace" | "merge";
}

const VALID_MODES: Array<UploadArgs["mode"]> = ["replace", "merge"];

export const DEFAULT_SETTINGS: UploadArgs = {
  file: "./config/ui.json",
  uri: "http://localhost:5001",
  mode: "merge",
};

/**
 * Helper Function to Read-In the Arguments used by the
 * cli-tool
 *
 * @return {*}
 */
export async function readInArgs(
  additionalArguments: {
    help: string;
    type: "string" | "number";
    name: string | string;
    defaultValue?: any;
  }[] = [],
  forcedArgs: Partial<UploadArgs> = {}
): Promise<UploadArgs> {
  const parser = new ArgumentParser({
    // version: "1.0.0",
    add_help: true,
    description: "Command Line interface, to upload ui files",
  });

  for (const arg of additionalArguments) {
    parser.add_argument(arg.name, {
      help: arg.help,
      default: arg.defaultValue,
      type: arg.type,
    });
  }

  parser.add_argument("-f", "--file", {
    help:
      "File containing containing the package definitions. Defaults to '" +
      DEFAULT_SETTINGS.file +
      "'",
    default: DEFAULT_SETTINGS.file,
    type: "str",
    dest: "file",
  });

  parser.add_argument("-m", "--mode", {
    help:
      "The mode, how to handle the ui defintion: " +
      // Display all Options:
      VALID_MODES.map((item) => {
        return '"' + item + '"';
      }).join(", ") +
      '. Deaults to "' +
      DEFAULT_SETTINGS.mode +
      '"',
    default: DEFAULT_SETTINGS.mode,
    type: "str",
    dest: "mode",
  });

  parser.add_argument("-u", "--uri", {
    help: "The URI of the Server. Defaults to '" + DEFAULT_SETTINGS.uri + ",",
    default: DEFAULT_SETTINGS.uri,
    type: "str",
    dest: "params",
  });

  const args: UploadArgs = parser.parse_args();

  return Object.assign(args, forcedArgs);
}

export async function uploadUi(args: Partial<UploadArgs>) {
  const settingsToUse = Object.assign(DEFAULT_SETTINGS, args);
  let localContent: any = {};

  const logger = getNopeLogger("ui-uploader-cli");

  try {
    // Try to read in the default config file.
    logger.info(`Trying to read file ${settingsToUse.file}`);

    localContent = JSON.parse(
      await readFile(settingsToUse.file, {
        encoding: "utf-8",
      })
    );
  } catch (error) {
    logger.error("Failed to read File.");
    logger.error(error);
  }

  if (Object.keys(settingsToUse).length == 0) {
    logger.info("No Data contained. Goodbye!");

    return;
  }

  async function getFiles(
    query: (
      item: IDataElement,
      scope: { [index: string]: any }
    ) => boolean = () => true,
    scope: { [index: string]: any } = {}
  ) {
    const params = {
      query: stringifyWithFunctions(query),
      scope,
    };

    const result: IDataElement[] = (
      await superagent.post(settingsToUse.uri + "/storage/query").send(params)
    ).body;

    return result;
  }

  async function getContentOfNewestFile(): Promise<{
    functions: any;
    classes: any;
  }> {
    // Get all Possible Files
    const _files = await getFiles((item, scope) => {
      return item.identifier === "ui-definition";
    });

    let newest: IDataElement = null;
    _files.map((item) => {
      if (item.date > item.date) {
        newest = item;
      } else if (newest == null) {
        newest = item;
      }
    });

    if (newest) {
      try {
        const _file = join(
          convertPathToOsPath(settingsToUse.uri),
          convertPathToOsPath(newest.path)
        );
        return (await superagent.get(_file)).body;
      } catch (e) {
        logger.error("Failed getting Data");
        logger.error(e);
      }
    }
    return {
      functions: {},
      classes: {},
    };
  }

  logger.info(
    `Uploading file '${settingsToUse.file}' to '${settingsToUse.uri}'`
  );

  let contentToUpload: any = localContent;

  if (settingsToUse.mode === "merge") {
    const currentContent: any = await getContentOfNewestFile();
    contentToUpload.functions = Object.assign(
      currentContent.functions,
      localContent.functions
    );
    contentToUpload.classes = Object.assign(
      currentContent.classes,
      localContent.classes
    );
  }

  const params = {
    name: "ui",
    keywords: "ui-definition;",
    identifier: "ui-definition",
    data: contentToUpload,
  };
  const result = await superagent
    .post(settingsToUse.uri + "/storage/upload-data")
    .send(params);

  logger.info("sucessfully uploaded the file.");
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
  forcedArgs: Partial<UploadArgs> = {}
) {
  const args = await readInArgs(additionalArguments, forcedArgs);
  return await uploadUi(args);
}

export default uploadUi;

// If requested As Main => Perform the Operation.
if (require.main === module) {
  main();
}
