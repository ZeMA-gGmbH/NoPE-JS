/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-11 13:27:58
 * @modify date 2021-01-18 18:48:59
 * @desc [description]
 */

import { ArgumentParser } from "argparse";
import { readFile } from "fs/promises";
import { join, resolve } from "path";
import {
  parseWithFunctions,
  stringifyWithFunctions,
} from "../helpers/jsonMethods";
import { IConfigFile, writeDefaultConfig } from "../loader/loadPackages";
import {
  ValidLoggerDefinition,
  getNopeLogger,
  LoggerLevel,
  LoggerLevels,
} from "../logger/index.nodejs";

import * as inquirer from "inquirer";
import { createInteractiveMenu } from "../helpers/cli";
import { createFile } from "../helpers/fileMethods";
import {
  layerDefaultParameters,
  validLayerOrMirror,
} from "../communication/index.nodejs";

inquirer.registerPrompt("search-checkbox", require("inquirer-search-checkbox"));

// Define the Main Function.
// This function is used as cli tool.
export const generateDefaultPackageConfig = async function (
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

  let opts: {
    modules: string;
  };

  for (const arg of additionalArguments) {
    parser.add_argument(arg.name, {
      help: arg.help,
      default: arg.defaultValue,
      type: arg.type,
    });
  }

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

  parser.add_argument("-f", "--file", {
    help: "File containing containing the package definitions.",
    default: "./config/settings.json",
    type: "str",
    dest: "file",
  });
  parser.add_argument("-d", "--dir", {
    help: "Directory containing the Modules.",
    default: "not-provided",
    type: "str",
    dest: "modules",
  });
  parser.add_argument("-i", "--interactive", {
    help: "Interactive mode to define the config.",
    action: "append",
    nargs: "?",
    dest: "interact",
  });

  const args = parser.parse_args();
  args.interact = Array.isArray(args.interact);

  if (args.modules != "not-provided") {
    opts.modules = args.modules;
  }

  // Define a Logger
  const logger = getNopeLogger("Setup-CLI");

  try {
    logger.info("Scanning " + opts.modules);
    // Write the Config.
    await writeDefaultConfig(opts.modules, args.file);
    // Inform the user.
    logger.info("Created Package-File at " + args.file);

    if (args.interact) {
      await reduceConfiguration(args.file);
    }
  } catch (error) {
    logger.error("Failed generating the Config");
    logger.error(error);
  }
};

export async function reduceConfiguration(
  filename: string = join(resolve(process.cwd()), "config", "settings.json")
) {
  /** Load the File and Parse it. */
  let data: IConfigFile = parseWithFunctions(
    await readFile(filename, { encoding: "utf8" })
  );

  await createInteractiveMenu(
    [
      {
        name: "save changes",
        value: "save",
        type: "item",
        async onSelect() {
          // Store the config file
          await createFile(filename, stringifyWithFunctions(data, 4));
        },
      },
      {
        name: "reload configuration",
        value: "reload",
        type: "item",
        async onSelect() {
          // Reload the data.
          data = parseWithFunctions(
            await readFile(filename, { encoding: "utf8" })
          );
        },
      },
      {
        name: "service",
        type: "menu",
        items: [
          {
            name: "remove services",
            value: "remove-services",
            type: "item",
            async onSelect() {
              const functions = (
                await inquirer.prompt({
                  type: "search-checkbox",
                  name: "result",
                  message: "Please select the enabled services",
                  choices: data.functions.map((func) => {
                    return {
                      key: func.path,
                      name: func.path,
                      value: func,
                    };
                  }),
                })
              ).result;
              data.functions = functions;
            },
          },
        ],
        value: "service",
      },
      {
        type: "menu",
        value: "package",
        items: [
          {
            name: "select provided packages",
            value: "select-packages",
            type: "item",
            async onSelect() {
              const packages = (
                await inquirer.prompt({
                  type: "search-checkbox",
                  name: "result",
                  message: "Please select the enabled packages",
                  choices: data.packages.map((pkg) => {
                    return {
                      key: pkg.path,
                      name: pkg.nameOfPackage,
                      value: pkg,
                      checked: true,
                    };
                  }),
                })
              ).result;
              data.packages = packages;
            },
          },
          {
            name: "select default instances",
            value: "select-default-instances",
            type: "item",
            async onSelect() {
              const choices: {
                key: string;
                name: string;
                value: any;
                checked: true;
              }[] = [];
              for (const pkg of data.packages) {
                for (const instance of pkg.defaultInstances || []) {
                  choices.push({
                    key: pkg.nameOfPackage + instance.options.identifier,
                    name: pkg.nameOfPackage + "." + instance.options.identifier,
                    value: {
                      pkg,
                      instance,
                    },
                    checked: true,
                  });
                }
              }

              const selectedInstances = (
                await inquirer.prompt({
                  type: "search-checkbox",
                  name: "result",
                  message: "Please select the packages to use.",
                  choices,
                })
              ).result;

              for (const pkg of data.packages) {
                pkg.defaultInstances = [];
              }

              for (const item of selectedInstances) {
                const { instance, pkg } = item;
                pkg.defaultInstances.push(instance);
              }
            },
          },
          {
            name: "disable default instances",
            value: "disable-default-instances",
            type: "item",
            async onSelect() {
              for (const pkg of data.packages) {
                pkg.defaultInstances = [];
                pkg.autostart = {};
              }
            },
          },
          {
            name: "select autostart of instances",
            value: "select-autostart",
            type: "item",
            async onSelect() {
              const choices: {
                key: string;
                name: string;
                value: any;
                checked: true;
              }[] = [];
              for (const pkg of data.packages) {
                for (const name in pkg.autostart || {}) {
                  const start = pkg.autostart[name];

                  choices.push({
                    key: pkg.nameOfPackage + name,
                    name: pkg.nameOfPackage + "." + name,
                    value: {
                      pkg,
                      start,
                      name,
                    },
                    checked: true,
                  });
                }
              }

              const selectedInstances = (
                await inquirer.prompt({
                  type: "search-checkbox",
                  name: "result",
                  message: "Please select the packages to use.",
                  choices,
                })
              ).result;

              for (const pkg of data.packages) {
                pkg.autostart = {};
              }

              for (const item of selectedInstances) {
                const { pkg, start, name } = item;
                pkg.autostart[name] = start;
              }
            },
          },
          {
            name: "disable autostart of instances",
            value: "disable-autostart",
            type: "item",
            async onSelect() {
              for (const pkg of data.packages) {
                pkg.autostart = {};
              }
            },
          },
        ],
        name: "packages",
      },
      {
        type: "menu",
        value: "connection",
        items: [
          {
            name: "add connection",
            value: "add-connection",
            type: "item",
            async onSelect() {
              const name: Omit<validLayerOrMirror, "event"> = (
                await inquirer.prompt({
                  type: "search-list",
                  name: "layer",
                  message: "Please select the layer:",
                  choices: Object.getOwnPropertyNames(layerDefaultParameters),
                })
              ).layer;

              console.log(
                "Please provide the required URL. Please use '" +
                  layerDefaultParameters[name as any] +
                  "' as example."
              );

              const url = (
                await inquirer.prompt([
                  {
                    type: "input",
                    message: "Please enter valid JSON.",
                    name: "url",
                  },
                ])
              ).url;

              const wantToLog = (
                await inquirer.prompt({
                  type: "confirm",
                  name: "result",
                  message: "Do you want to have a logger for the Layer?",
                })
              ).result;

              let log: ValidLoggerDefinition = false;

              if (wantToLog) {
                log = (
                  await inquirer.prompt({
                    type: "list",
                    name: "result",
                    message: "Please select the logger level.",
                    choices: LoggerLevels,
                  })
                ).result;
              }

              const considerConnection = (
                await inquirer.prompt({
                  type: "confirm",
                  name: "result",
                  message:
                    "Do you want to consider that layer as base Layer. If 'yes', the Dispatcher will wait until the Layer is connected before autostarting.",
                })
              ).result;

              const forwardData = (
                await inquirer.prompt({
                  type: "confirm",
                  name: "result",
                  message:
                    "Do you want to forward data of other layers to this layer?",
                })
              ).result;

              data.connections.push({
                name: name as any,
                url,
                considerConnection,
                log,
                forwardData,
              });
            },
          },
          {
            name: "select enabled connections",
            value: "select-connections",
            type: "item",
            async onSelect() {
              const connections = (
                await inquirer.prompt({
                  type: "search-checkbox",
                  name: "result",
                  message: "Please select the enabled packages",
                  choices: data.connections.map((item, index) => {
                    return {
                      key: index,
                      name: item.name + ": " + item.url.toString(),
                      value: item,
                      checked: true,
                    };
                  }),
                })
              ).result;
              data.connections = connections;

              // Store the config file
              await createFile(filename, stringifyWithFunctions(data, 4));
            },
          },
        ],
        name: "connections",
      },
    ],
    {
      addExit: true,
      async exitCallback() {
        // Store the change
        await createFile(filename, stringifyWithFunctions(data, 4));
      },
    }
  );
}

if (require.main === module) {
  generateDefaultPackageConfig().catch((e) => {
    console.error(e);
  });
}
