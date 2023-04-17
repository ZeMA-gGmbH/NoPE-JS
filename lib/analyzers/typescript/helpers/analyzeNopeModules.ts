/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:27:45
 * @modify date 2020-11-10 16:29:02
 * @desc [description]
 */

import { ILogger } from "js-logger";
import { Project } from "ts-morph";
import {
  NAME_BASEMODULE,
  NAME_EMITTER,
  NAME_EMITTER_DEC,
  NAME_FUNC_DEC,
  NAME_GENERICMODULE,
  NAME_METHOD_DEC,
  NAME_OBSERVABLE,
  NAME_PROMISE,
  NAME_PROP_DEC,
} from "../defaults/names";
import { analyzeFiles } from "./analyzeFiles";
import { isClassExtending } from "./isClassExtending";
import { isPropOfType } from "./isPropOfType";

export async function analyzeNopeModules(options: {
  inputDir: string;
  outputFile?: string;
  tempDir: string;
  tsConfig: string;
  // A Logger.
  logger?: ILogger;
}) {
  // Function to Determine new project files.
  const project = new Project({
    tsConfigFilePath: options.tsConfig,
    skipAddingFilesFromTsConfig: false,
  });

  // Readin the Sources of the Dir.
  project.addSourceFilesAtPaths(options.inputDir);

  // Readin the Source-Files.
  const sourceFiles = project.getSourceFiles();

  // Contains all Nope-Files.
  const nopeFiles = [
    NAME_OBSERVABLE,
    NAME_PROMISE,
    NAME_BASEMODULE,
    NAME_GENERICMODULE,
    NAME_EMITTER,
  ];

  // Generate the Files
  const result = await analyzeFiles(sourceFiles, {
    checkImport(type) {
      // Prevent analyzing Nope Files.
      return !nopeFiles.includes(type);
    },
    filterClasses(cd, mapping) {
      return isClassExtending(cd, NAME_BASEMODULE, mapping);
    },
    filterDecorators() {
      return true;
    },
    filterMethods(cd, md, mapping) {
      return (
        md.isAsync && md.isPublic && md.decoratorNames.includes(NAME_METHOD_DEC)
      );
    },
    filterFunctions(fd: string) {
      return fd == NAME_FUNC_DEC;
    },
    filterFiles(filename) {
      return (
        filename.endsWith("module.ts") || filename.endsWith("functions.ts")
      );
    },
    filterProperties(cd, pd, mapping) {
      const isObservable = isPropOfType(pd.declaration, NAME_OBSERVABLE, false);
      const isExportedAsPorp = pd.decoratorNames.includes(NAME_PROP_DEC);

      const isEmitter = isPropOfType(pd.declaration, NAME_EMITTER, false);
      const isExportedAsEmitter = pd.decoratorNames.includes(NAME_EMITTER_DEC);

      return (
        pd.isPublic &&
        ((isObservable && isExportedAsPorp) ||
          (isEmitter && isExportedAsEmitter))
      );
    },
    assignProp(prop) {
      if (prop.decoratorNames.includes(NAME_EMITTER_DEC)) {
        return "events";
      }
      return "properties";
    },
    tempDir: options.tempDir,
    logger: options.logger,
  });

  // Compile the Template and parse the Code.
  return result;
}
