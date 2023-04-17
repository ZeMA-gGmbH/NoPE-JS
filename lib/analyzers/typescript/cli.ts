/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-09 13:27:58
 * @modify date 2020-11-10 16:20:05
 * @desc [description]
 */

import { ArgumentParser } from "argparse";
import { readFile } from "fs/promises";
import { ILogger } from "js-logger";
import { createFile } from "../../helpers/index.nodejs";
import { getNopeLogger } from "../../logger/getLogger";
import { ISystemElements } from "../../types/ISystemElements";
import { extractDefinitions } from "./analyzeTypescriptFiles";

const logger = getNopeLogger("TS-Analyzer");

// Define the Main Function.
// This function is used as cli tool.
const main = async function () {
  let opts: {
    inputDir: string;
    tsConfig: string;
    tempDir: string;
    // A Logger.
    logger?: ILogger;
  } = null;

  try {
    const settings = JSON.parse(
      await readFile("./nopeconfig.json", {
        encoding: "utf-8",
      })
    );

    // Try to read in the default config file.
    opts = settings.analyzers.typescript;

    opts.tempDir = settings.tempDir;
  } catch (error) {
    opts = {} as any;
  }

  const parser = new ArgumentParser({
    // version: "1.0.0",
    add_help: true,
    description:
      "Command Line interface, generate the interface based on the project folder.",
  });
  parser.add_argument("-i", "--inputDir", {
    help: "Input Folder to Scan",
    default: "not-provided",
    type: "str",
    dest: "inputDir",
  });
  parser.add_argument("-t", "--tsConfig", {
    help: "Typescript-Settings File to use.",
    default: "not-provided",
    type: "str",
    dest: "tsConfig",
  });
  parser.add_argument("-f", "--file", {
    help: "File containing all Defintions, which are currently available. If it doenst extists it will be generated",
    default: "./config/description.json",
    type: "str",
    dest: "file",
  });
  parser.add_argument("-o", "--overwrite", {
    help: "You can extend the existing description file or overwrite it.",
    default: true,
    dest: "overwrite",
  });

  const args = parser.parse_args();

  if (args.inputDir != "not-provided") {
    opts.inputDir = args.inputDir;
  }
  if (args.inputDir != "not-provided") {
    opts.tsConfig = args.tsConfig;
  }

  logger.debug(
    "using the following settings: \n" + JSON.stringify(opts, undefined, 4)
  );

  logger.info("scanning: " + opts.inputDir);
  opts.logger = logger;

  let definition: ISystemElements = {
    services: [],
    modules: [],
    generalInformationModel: {},
  };

  try {
    if (!args.overwrite) {
      // Try to read in the default config file.
      definition = JSON.parse(
        await readFile(args.file, {
          encoding: "utf-8",
        })
      );
    }
  } catch (error) {
    definition = {
      services: [],
      modules: [],
      generalInformationModel: {},
    };
  }

  // Extract the Definitions.
  const res = await extractDefinitions(opts, definition);

  await createFile(args.file, JSON.stringify(res, undefined, 4));

  logger.info("Defined config in " + args.file);
};

main().catch((e) => {
  logger.error(e);
});
