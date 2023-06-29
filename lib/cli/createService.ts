/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { ArgumentParser } from "argparse";
import { readFileSync } from "fs";
import * as handlebars from "handlebars";
import * as inquirer from "inquirer";
import { camelCase } from "lodash";
import { type } from "os";
import { join } from "path";
import {
  layerDefaultParameters,
  validLayers,
} from "../communication/addLayer.nodejs";
import { createFile } from "../helpers/fileMethods";
import { IConfigFile } from "../loader/loadPackages";
import { getNopeLogger } from "../logger/getLogger";
import { LoggerLevels } from "../logger/nopeLogger";

// Define the Main Function.
// This function is used as cli tool.
export async function createService(
  additionalArguments: {
    help: string;
    type: "str" | "number";
    name: string | string;
    defaultValue?: any;
  }[] = []
) {
  // Flag, to determine the OS
  const runningInLinux = type() === "Linux";

  const parser = new ArgumentParser({
    // version: "1.0.0",
    add_help: true,
    description: "Command Line interface, which enables creating services.",
  });

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

  parser.add_argument("-o", "--outputDir", {
    help: "File containing containing the package definitions.",
    default: "./services/",
    type: "str",
    dest: "outputDir",
  });

  parser.add_argument("--noFuncs", {
    help: "Prevents using Functions",
    action: "store_true",
    dest: "noFuncs",
  });

  parser.add_argument("--runInstances", {
    help: "Run instances provided in a packages.",
    action: "store_true",
    dest: "runInstances",
  });

  parser.add_argument("--runEveryService", {
    help: "Run instances provided in a packages.",
    action: "store_true",
    dest: "runEveryService",
  });

  parser.add_argument("--runExtra", {
    help: "Runs every instance in an extra Service",
    action: "store_true",
    dest: "runExtra",
  });

  parser.add_argument("--layer", {
    help: "Defaultly selects layer to use.",
    default: "not-provided",
    type: "str",
    dest: "layer",
  });

  parser.add_argument("--params", {
    help:
      "Paramas for the Channel, to connect to. The Following Defaults are used: \n" +
      JSON.stringify(layerDefaultParameters, undefined, 4),
    default: "not-provided",
    type: "str",
    dest: "params",
  });

  parser.add_argument("--log", {
    help:
      'Specify the Logger Level of the Services. Defaults to "info". Valid values are: ' +
      LoggerLevels.join(", "),
    default: "not-provided",
    type: "str",
    dest: "logLevel",
  });

  const args = parser.parse_args();

  // Define a Logger
  const logger = getNopeLogger("Setup-CLI");

  try {
    logger.info("Reading config File");

    const data: IConfigFile = JSON.parse(
      readFileSync(args.file).toString("utf-8")
    );

    const config: IConfigFile = {
      functions: [],
      packages: [],
      config: {},
      connections: [],
    };

    const modeSelection = [];
    const argsToUse: any = {};

    if (!args.noFuncs) {
      modeSelection.push({
        type: "confirm",
        name: "useFunction",
        message: "Do you want to share Functions",
        default: false,
      });
    } else {
      argsToUse.useFunction = false;
    }

    if (!args.runInstances) {
      modeSelection.push({
        type: "confirm",
        name: "detailPackages",
        message: "Do you want to run instances provided in a package?",
        default: true,
      });
    } else {
      argsToUse.detailPackages = false;
    }

    if (!args.runEveryService) {
      modeSelection.push({
        type: "confirm",
        name: "detailInstances",
        message:
          "Do you want to detail, which instance should be hosted as Service?",
        default: true,
      });
    } else {
      argsToUse.detailInstances = false;
    }

    if (!args.runExtra) {
      modeSelection.push({
        type: "confirm",
        name: "runExtra",
        message: "Do you want to run every selected option as single Service?",
        default: true,
      });
    } else {
      argsToUse.runExtra = true;
    }

    if (args.logLevel === "not-provided") {
      modeSelection.push({
        type: "list",
        name: "logLevel",
        message: "Select the Level of the Logger, to use.",
        choices: LoggerLevels,
      });
    } else {
      argsToUse.logLevel = args.logLevel;
    }

    if (args.layer === "not-provided") {
      modeSelection.push({
        type: "list",
        name: "layer",
        message: "Select the Communication Layer to use",
        choices: Object.getOwnPropertyNames(validLayers),
      });
    } else {
      argsToUse.layer = args.layer;
    }

    let result: any = {};

    if (modeSelection.length > 0) {
      result = await inquirer.prompt(modeSelection);
    }

    result = Object.assign({}, result, argsToUse);

    let params: string = null;

    if (result.layer !== "event" && args.params === "not-provided") {
      const resultOfQuestion = (
        await inquirer.prompt({
          type: "confirm",
          name: "result",
          message: "Do you want to add custom Layer Parameters",
          default: true,
        })
      ).result;

      if (resultOfQuestion) {
        while (params == null) {
          params = (
            await inquirer.prompt({
              type: "input",
              name: "result",
              message: "Please enter the parameters.",
              default: true,
            })
          ).result;
        }
      } else {
        params = layerDefaultParameters[args.channel];
      }
    } else {
      try {
        try {
          // We try to parse the data.
          params = JSON.parse(args.params);
        } catch (e) {
          params = JSON.parse('"' + args.params + '"');
        }
      } catch (e) {
        logger.error(
          "Unable to parse the Parameters for the channel. Please use valid JSON!"
        );
        logger.error(args.params[0]);
        logger.error(e);
        return;
      }
    }

    if (result.useFunction) {
      config.functions = (
        await inquirer.prompt([
          {
            type: "checkbox",
            name: "functions",
            message: "Select/Deselect Functions, that should be hosted",
            choices: data.functions.map((func) => {
              return {
                name: func.path,
                value: func,
                checked: false,
              };
            }),
          },
        ])
      ).functions;
    }

    // Defaultly assign the default-Packages.
    config.packages = data.packages;

    if (result.detailPackages) {
      // Determine the Packages which should be hosted.
      config.packages = (
        await inquirer.prompt([
          {
            type: "checkbox",
            name: "packages",
            message: "Select/Deselect Packages, that should be hosted:",
            choices: data.packages.map((p) => {
              return {
                name: p.nameOfPackage,
                value: p,
                checked: true,
              };
            }),
          },
        ])
      ).packages;
    }

    // Now, that we know, which package we should use, let us "detail" the instances we should use.
    if (result.detailInstances) {
      // Iterate over the Pacakges
      for (const p of config.packages) {
        // Determine the Instances to keep:
        if (p.defaultInstances.length > 0) {
          p.defaultInstances = (
            await inquirer.prompt([
              {
                type: "checkbox",
                name: "instances",
                message: "Select/Deselect Instances, that should be hosted:",
                choices: p.defaultInstances.map((instance) => {
                  return {
                    name: instance.options.identifier,
                    value: instance,
                    checked: true,
                  };
                }),
              },
            ])
          ).instances;
        }
      }
    }

    const serviceTemplates = runningInLinux
      ? [
          {
            name: "nopeService.service",
            render: handlebars.compile(
              readFileSync(
                join(
                  __dirname,
                  "..",
                  "..",
                  "lib",
                  "templates",
                  "linux.service.handlebars"
                )
              ).toString("utf-8")
            ),
          },
        ]
      : [
          {
            name: "index.js",
            render: handlebars.compile(
              readFileSync(
                join(
                  __dirname,
                  "..",
                  "..",
                  "lib",
                  "templates",
                  "index.js.handlebars"
                )
              ).toString("utf-8")
            ),
          },
          {
            name: "service.js",
            render: handlebars.compile(
              readFileSync(
                join(
                  __dirname,
                  "..",
                  "..",
                  "lib",
                  "templates",
                  "service.js.handlebars"
                )
              ).toString("utf-8")
            ),
          },
          {
            name: "00-install.bat",
            render: handlebars.compile(`set DIR=%~dp0
cd "%DIR%"
cd ..
cd ..
cd ..
node {{{pathToFolder}}}\\service.js -m install
            `),
          },
          {
            name: "01-start.bat",
            render: handlebars.compile(`set DIR=%~dp0
cd "%DIR%"
cd ..
cd ..
cd ..
node {{{pathToFolder}}}\\service.js -m start
            `),
          },
          {
            name: "02-restart.bat",
            render: handlebars.compile(`set DIR=%~dp0
cd "%DIR%"
cd ..
cd ..
cd ..
node {{{pathToFolder}}}\\service.js -m restart
            `),
          },
          {
            name: "03-uninstall.bat",
            render: handlebars.compile(`set DIR=%~dp0
cd "%DIR%"
cd ..
cd ..
cd ..
node {{{pathToFolder}}}\\service.js -m uninstall`),
          },
          {
            name: "00-manual_starter.bat",
            render: handlebars.compile(`set DIR=%~dp0
cd "%DIR%"
cd ..
cd ..
cd ..
node {{{pathToFolder}}}\\index.js`),
          },
        ];

    const storeConfig = async (
      config: IConfigFile,
      name: string,
      path: string
    ) => {
      // Create the Settings File:
      await createFile(
        join(path, "settings.json"),
        JSON.stringify(config, undefined, 4)
      );

      // Write the Templates
      for (const template of serviceTemplates) {
        await createFile(
          join(path, template.name),
          template.render({
            name,
            path,
            params,
            layer: result.layer,
            pathToFile: join(path, template.name),
            pathToFolder: join(path),
            logLevel: result.logLevel,
          })
        );
      }

      logger.info("Create Service at", path);
    };

    if (result.runExtra) {
      const promises: Promise<any>[] = [];

      for (const _package of config.packages) {
        for (const _instance of _package.defaultInstances) {
          const autostart = {};
          if (_package.autostart[_instance.options.identifier]) {
            autostart[_instance.options.identifier] =
              _package.autostart[_instance.options.identifier];
          }

          const _config: IConfigFile = {
            functions: [],
            packages: [
              {
                autostart,
                defaultInstances: [_instance],
                nameOfPackage: _package.nameOfPackage,
                path: _package.path,
              },
            ],
            config: {},
            connections: [],
          };

          promises.push(
            storeConfig(
              _config,
              camelCase(_package.nameOfPackage),
              join(
                args.outputDir,
                camelCase(_package.nameOfPackage),
                camelCase(_instance.options.identifier)
              )
            )
          );
        }
      }

      await Promise.all(promises);
    } else {
      // Create a Syntetic Package, which will be created.
      await storeConfig(
        config,
        "NopeService",
        join(args.outputDir, "combinedService")
      );
    }
  } catch (error) {
    logger.error("Failed generating the Config");
    logger.error(error);
  }
}

// If requested As Main => Perform the Operation.
if (require.main === module) {
  createService().catch((e) => {
    console.error(e);
  });
}
