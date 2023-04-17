/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:59
 * @modify date 2020-11-10 18:06:54
 * @desc [description]
 */

import { ILogger } from "js-logger";
import { join } from "path";
import {
  ArrowFunction,
  CallExpression,
  FunctionDeclaration,
  JSDoc,
  Node,
  ParameterDeclaration,
  SourceFile,
  Type,
  TypeNode,
} from "ts-morph";
import * as TJS from "typescript-json-schema";
import { createFile, replaceAll } from "../../../helpers/index.nodejs";
import { INopeDescriptor } from "../../../types";
import { IAnalyzeResult } from "../types/IAnalyzeResult";
import { IClassAnalyzeResult } from "../types/IClassAnalyzeResult";
import { IClassFilter } from "../types/IClassFilter";
import { IDecoratorFilter } from "../types/IDecoratorFilter";
import { IDecoratorInformation } from "../types/IDecoratorInformation";
import { IFileFilter } from "../types/IFileFilter";
import { IFunctionFilter } from "../types/IFunctionFilter";
import { IFunctionInformation } from "../types/IFunctionInformation";
import { IMethodFilter } from "../types/IMethodFilter";
import { IModifierInformation } from "../types/IModifierInformation";
import { IPropertyFilter } from "../types/IPropertyFilter";
import { IPropertyInformation } from "../types/IPropertyInformation";
import { analyzeClasses } from "./analyzeClasses";
import { createFileMapping } from "./createFileMapping";
import { getDeclarationByName } from "./getDeclarationByName";
import { getDescription } from "./getDescription";
import { getType } from "./getType";

/**
 * Helper Function, used to define the Import of an element.
 *
 * @param _requiredImports
 * @param mappingTypeToImport
 * @param fileMapping
 */
function _extractImports(
  _requiredImports: Set<string>,
  mappingTypeToImport: {
    [index: string]: Set<string>;
  },
  fileMapping: {
    [index: string]: SourceFile;
  }
) {
  const imports = {
    required: _requiredImports.size > 0,
    content: "",
  };

  const importedBaseTypes = new Set<string>();
  for (const reqType of _requiredImports) {
    if (
      mappingTypeToImport[reqType] &&
      mappingTypeToImport[reqType].size === 1
    ) {
      // Extract the Path of the File
      const name = Array.from(mappingTypeToImport[reqType].values())[0];
      const ending = name.includes("node_modules") ? ".d.ts" : ".ts";
      const pathToFile = name + ending;

      const declarations = getDeclarationByName(
        fileMapping,
        pathToFile,
        reqType
      ).filter((item) => !importedBaseTypes.has(item.baseType));
      declarations.map((item) => importedBaseTypes.add(item.baseType));

      imports.content += declarations
        .map((item) => item.originalCode)
        .reduce(
          (prev, current, idx) =>
            imports.content.length === 0 && idx === 0
              ? current
              : prev + "\n\n" + current,
          ""
        );
    } else if (mappingTypeToImport[reqType].size > 1) {
      // Multiple Items are using the Same Name.
      throw Error("Multiple Elements are used.");
    }
  }

  return imports;
}

/**
 * Helper Function, used to define the Import of an element.
 *
 * @param _requiredImports
 * @param mappingTypeToImport
 * @param fileMapping
 */
function _generalInformationModel(
  mappingTypeToImport: {
    [index: string]: Set<string>;
  },
  fileMapping: {
    [index: string]: SourceFile;
  }
) {
  let content = "";

  const importedBaseTypes = new Set<string>();

  for (const reqType of Object.getOwnPropertyNames(mappingTypeToImport)) {
    if (
      mappingTypeToImport[reqType] &&
      mappingTypeToImport[reqType].size === 1
    ) {
      // Extract the Path of the File
      const name = Array.from(mappingTypeToImport[reqType].values())[0];
      const ending = name.includes("node_modules") ? ".d.ts" : ".ts";
      const pathToFile = name + ending;

      const declarations = getDeclarationByName(
        fileMapping,
        pathToFile,
        reqType
      ).filter((item) => !importedBaseTypes.has(item.baseType));
      declarations.map((item) => importedBaseTypes.add(item.baseType));

      content += declarations
        .map((item) => item.originalCode)
        .reduce(
          (prev, current, idx) =>
            content.length === 0 && idx === 0
              ? current
              : prev + "\n\n" + current,
          ""
        );
    } else if (mappingTypeToImport[reqType].size > 1) {
      // Multiple Items are using the Same Name.
      throw Error("Multiple Elements are used.");
    }
  }

  return content;
}

/**
 * Helper to Parse the Docs.
 * @param docs The list of JS-Docs.
 * @returns
 */
function parseJsDoc(docs: JSDoc[]):
  | {
      description: string | false;
      inputs: { [index: string]: string | false };
      returnType: string | false;
    }
  | false {
  if (docs.length) {
    const doc = docs[0];
    const inputs = {};
    let returnType: string | false = false;

    doc.getTags().map((tag) => {
      if (Node.isJSDocParameterTag(tag)) {
        inputs[tag.getName()] = tag.getComment() || false;
      } else if (Node.isJSDocReturnTag(tag)) {
        returnType = (tag.getComment() as string) || false;
      }
    });

    return {
      description: doc.getDescription() || false,
      inputs,
      returnType,
    };
  }

  return false;
}

function parseParameters(params: ParameterDeclaration[]) {
  if (params.length) {
    const ret: { [index: string]: any } = {};

    for (const param of params) {
      ret[param.getName()] = getType(param, param.getType(), param.getText());
    }

    return ret;
  }

  return false;
}

/**
 * Helper to extract the function arguments.
 * @param file
 * @param item
 * @returns
 */
function getFunctionParameters(
  file: SourceFile,
  item: Node
):
  | {
      parameters: ParameterDeclaration[];
      jsDocs:
        | {
            description: string | false;
            inputs: { [index: string]: string | false };
            returnType: string | false;
          }
        | false;
      returnType: Type;
      node: ArrowFunction | FunctionDeclaration;
    }
  | false {
  if (Node.isArrowFunction(item)) {
    // Wir haben die Deklaration;
    return {
      parameters: parseParameters(item.getParameters()),
      node: item,
      jsDocs: false,
      returnType: item.getReturnType(),
    };
  } else if (Node.isFunctionDeclaration(item)) {
    return {
      parameters: parseParameters(item.getParameters()),
      node: item,
      jsDocs: parseJsDoc(item.getJsDocs()),
      returnType: item.getReturnType(),
    };
  } else if (Node.isIdentifier(item)) {
    const nameOfExported = item.getText();
    // const def = file.getFunction(nameOfExported);
    // jsDocs = def.getJsDocs();
    try {
      const item = file.getFunction(nameOfExported);
      return {
        parameters: parseParameters(item.getParameters()),
        node: item,
        jsDocs: parseJsDoc(item.getJsDocs()),
        returnType: item.getReturnType(),
      };
    } catch (e) {
      try {
        const variable = file.getVariableDeclaration(nameOfExported);
        const initializer = variable.getInitializer();
        return getFunctionParameters(file, initializer);
      } catch (e) {}
    }
  }
  return false;
}

/**
 * Function, that will create the imported Type classes based on source-Files.
 * @param sourceFiles
 * @param options Options, to Controll the generation.
 */
export async function analyzeFiles(
  sourceFiles: SourceFile[],
  options: {
    filterClasses: IClassFilter;
    filterMethods: IMethodFilter;
    filterProperties: IPropertyFilter;
    filterFunctions: IFunctionFilter;
    filterDecorators: IDecoratorFilter;
    filterFiles: IFileFilter;
    checkImport: (type: string) => boolean;
    assignProp: (
      prop: IPropertyInformation & IDecoratorInformation & IModifierInformation
    ) => "events" | "properties";
    tempDir: string;
    logger?: ILogger;
  }
) {
  const fileMapping = createFileMapping(sourceFiles);

  // Show which file is relevant.
  if (options.logger) {
    options.logger.debug("Mapping of files defined");
  }

  const classes = analyzeClasses(sourceFiles, options);

  const ret: IAnalyzeResult = {
    classes: [],
    functions: [],
    generalModel: {},
  };

  const mappingTypeToImport: {
    [index: string]: Set<string>;
  } = {};

  /**
   * Iterate over the SourceFiles.
   *
   * For every source File, check if there exists a
   * method. (The methods are wrapped by a decorator
   * Function. ==> This results in detecting exported
   * Variables.) If so, filter the Methods and extract
   * the descriptor, we get the corresponding method.
   */
  for (const file of sourceFiles) {
    try {
      if (!options.filterFiles(file.getFilePath())) {
        continue;
      }

      // Show which file is relevant.
      if (options.logger) {
        options.logger.info("Analyzing File " + file.getFilePath());
      }

      const variableStatements = file
        .getVariableStatements()
        .map((item) => {
          if (item.isExported()) {
            const declarations = item.getDeclarations();
            if (declarations.length == 1) {
              const declaration = declarations[0];
              const name = declaration.getName();
              const initializer = declaration.getInitializer();
              if (initializer && Node.isCallExpression(initializer)) {
                const expr = initializer.getExpression();
                if (Node.isIdentifier(expr)) {
                  const authorDescription = declaration
                    .getLeadingCommentRanges()
                    .map((comment) => comment.getText())
                    .join("\n");
                  const nameOfFunc = expr.getText();

                  if (options.filterFunctions(nameOfFunc)) {
                    // Now we know, that we are dealing with a desired function.
                    const firstArg = initializer.getArguments()[0];
                    const secondArg = initializer.getArguments()[1];

                    let schema: INopeDescriptor | false = false;

                    if (Node.isObjectLiteralExpression(secondArg)) {
                      try {
                        let text = secondArg.getProperty("schema").getText();

                        if (text.endsWith(",")) {
                          text = text.slice(0, text.length - 1);
                        }
                        text = text.slice("schema:".length);
                        schema = eval("() => { return " + text + "}")();
                      } catch (e) {
                        const debug = "Use a Breakpoint to see the Error.";
                      }
                    }

                    const res = getFunctionParameters(file, firstArg);

                    if (res) {
                      return Object.assign(res, { schema, name });
                    }

                    return false;
                  }
                }
              }
            }
          }
        })
        .filter((item) => item);

      const functionsWithDecorators = Array.from(
        file.getExportedDeclarations().values()
      )
        .map((value) => {
          // Extract the Element
          const declaration = value[0];

          if (declaration && Node.isVariableDeclaration(declaration)) {
            const name = declaration.getName();
            // Use the Regex to remove the Imports from the Head
            const regex = /import\(.+?\)./g;
            // Extract the Description of the Author.
            const authorDescription = declaration
              .getLeadingCommentRanges()
              .map((comment) => comment.getText())
              .join("\n");

            const typeInformation = getType(
              declaration.getTypeNode(),
              declaration.getType(),
              declaration.getType().getText()
            );

            if (!typeInformation.isBaseType) {
              // Get the Defintion of the Function.
              const funcDefintion = file.getFunction(typeInformation.baseType);
              if (funcDefintion) {
                const jsDoc = funcDefintion.getJsDocs();

                const ret = Object.assign(
                  getDescription(funcDefintion) as IFunctionInformation,
                  {
                    // Provide Author Information
                    authorDescription,
                    // Original Declaration code.
                    declarationCode: declaration.getText(),
                  },
                  getType(
                    funcDefintion,
                    funcDefintion.getType(),
                    funcDefintion.getText()
                  ),
                  {
                    name,
                    jsDoc,
                  }
                );

                ret.originalCode = declaration.getText();

                let decoratorSettings: any = {};

                // Bad Practice. Create the Code create Function that will create the Object.
                try {
                  const open = ret.originalCode.indexOf("{");
                  const close = ret.originalCode.lastIndexOf("}");

                  // Try to get the Decorator settings.
                  const slice = ret.originalCode.slice(open, close + 1);
                  decoratorSettings = eval("() => { return " + slice + "}")();
                } catch (e) {
                  if (options.logger) {
                    options.logger.error(
                      "Failed to parse the Decorator settings of " +
                        file.getFilePath()
                    );
                  }
                  decoratorSettings = {};
                }

                const returnElement = Object.assign(ret, {
                  decoratorSettings,
                });

                return returnElement;
              }
            }
          }

          // Return if the Element is a Declaration or not.
          return false;
        })
        .filter((value) => {
          // Instead of returnin the declaration return its descriptor.
          return value;
        })
        .filter((item) =>
          // Additional Filter the Methods with custom filtering method.
          options.filterFunctions(item as any)
        );

      const requiredImports = new Set<string>();
      for (const func of functionsWithDecorators) {
        if (typeof func === "boolean") {
          continue;
        }

        // Add the Parameter Imports for every element
        for (const parameter of func.parameters) {
          parameter.imports = _extractImports(
            new Set(
              parameter.typeImports.map((item) => {
                // Check if the Imported Type has been Adden multiple Times.
                if (mappingTypeToImport[item.identifier] === undefined) {
                  mappingTypeToImport[item.identifier] = new Set<string>();
                }

                mappingTypeToImport[item.identifier].add(item.path);

                return item.identifier;
              })
            ),
            mappingTypeToImport,
            fileMapping
          );
        }

        func.returnType.imports = _extractImports(
          new Set(
            func.returnType.typeImports.map((item) => {
              // Check if the Imported Type has been Adden multiple Times.
              if (mappingTypeToImport[item.identifier] === undefined) {
                mappingTypeToImport[item.identifier] = new Set<string>();
              }

              mappingTypeToImport[item.identifier].add(item.path);

              return item.identifier;
            })
          ),
          mappingTypeToImport,
          fileMapping
        );

        const _requiredImportsOfFunction = new Set<string>();

        for (const { identifier, path } of func.typeImports || []) {
          // Only if the import isnt the Base Type, add it to the List.
          if (options.checkImport(identifier)) {
            // Check if the Imported Type has been Adden multiple Times.
            if (mappingTypeToImport[identifier] === undefined) {
              mappingTypeToImport[identifier] = new Set<string>();
            }

            mappingTypeToImport[identifier].add(path);
            requiredImports.add(identifier);
            _requiredImportsOfFunction.add(identifier);
          }
        }

        func.imports = _extractImports(
          _requiredImportsOfFunction,
          mappingTypeToImport,
          fileMapping
        );

        ret.functions.push(func as any);
      }
    } catch (e) {
      // Show which file is relevant.
      if (options.logger) {
        options.logger.error("Failed analyzing file " + file.getFilePath());
        options.logger.error(e);
      }
    }
  }

  // Iterate over the Classes
  for (const relevantClass of classes) {
    try {
      // Show which file is relevant.
      if (options.logger) {
        options.logger.info("Analyzing Class " + relevantClass.className);
      }

      // Reurn Result of a class.
      const item: IClassAnalyzeResult = {
        className: relevantClass.className,
        classDecorator: relevantClass.decorator,
        methods: [],
        properties: [],
        events: [],
        imports: {
          content: "",
          required: false,
        },
      };

      const requiredImports = new Set<string>();

      // Iterate over the Properties
      for (const prop of relevantClass.properties) {
        // Show which file is relevant.
        if (options.logger) {
          options.logger.debug(
            "Analyzing Property " + relevantClass.className + "." + prop.name
          );
        }

        if (!prop.isBaseType) {
          const _requiredImportsOfProp = new Set<string>();

          prop.imports = {
            required: false,
            content: "",
          };

          for (const { identifier, path } of prop.typeImports || []) {
            // Only if the import isnt the Base Type, add it to the List.
            if (options.checkImport(identifier)) {
              // Check if the Imported Type has been Adden multiple Times.
              if (mappingTypeToImport[identifier] === undefined) {
                mappingTypeToImport[identifier] = new Set<string>();
              }

              mappingTypeToImport[identifier].add(path);
              requiredImports.add(identifier);

              _requiredImportsOfProp.add(identifier);
            }
          }

          // Extract the Relevant imports.
          prop.imports = _extractImports(
            _requiredImportsOfProp,
            mappingTypeToImport,
            fileMapping
          );
        }

        item[options.assignProp(prop)].push(prop);
      }

      // Iterate over the Methods
      for (const method of relevantClass.methods) {
        if (options.logger) {
          options.logger.debug(
            "Analyzing Method " + relevantClass.className + "." + method.name
          );
        }

        // List containing the already used Types
        const importedBaseTypes = new Set<string>();
        const _requiredImportsOfMethod = new Set<string>();

        if (!method.returnType.isBaseType) {
          for (const { identifier, path } of method.returnType.typeImports ||
            []) {
            // Only if the import isnt the Base Type, add it to the List.
            if (options.checkImport(identifier)) {
              // Check if the Imported Type has been Adden multiple Times.
              if (mappingTypeToImport[identifier] === undefined) {
                mappingTypeToImport[identifier] = new Set<string>();
              }

              mappingTypeToImport[identifier].add(path);
              requiredImports.add(identifier);
              _requiredImportsOfMethod.add(identifier);
            }
          }
        }

        // Iterate over the Parameters and extract
        // the required elements. (If they arent base
        // types).
        for (const parm of method.parameters) {
          if (!parm.isBaseType) {
            const _requiredImportsOfParameter = new Set<string>();

            for (const { identifier, path } of parm.typeImports || []) {
              // Only if the import isnt the Base Type, add it to the List.
              if (options.checkImport(identifier)) {
                // Check if the Imported Type has been Adden multiple Times.
                if (mappingTypeToImport[identifier] === undefined) {
                  mappingTypeToImport[identifier] = new Set<string>();
                }

                mappingTypeToImport[identifier].add(path);
                requiredImports.add(identifier);

                // Handle the Imports.
                _requiredImportsOfParameter.add(identifier);
                _requiredImportsOfMethod.add(identifier);
              }
            }

            // Determine the imports of the Parameter.
            parm.imports = _extractImports(
              _requiredImportsOfParameter,
              mappingTypeToImport,
              fileMapping
            );
          }
        }

        // Additionally Check the Returntype.
        if (!method.returnType.isBaseType) {
          const _requiredImportsOfReturn = new Set<string>();

          for (const { identifier, path } of method.returnType.typeImports ||
            []) {
            // Only if the import isnt the Base Type, add it to the List.
            if (options.checkImport(identifier)) {
              // Check if the Imported Type has been Adden multiple Times.
              if (mappingTypeToImport[identifier] === undefined) {
                mappingTypeToImport[identifier] = new Set<string>();
              }

              mappingTypeToImport[identifier].add(path);
              requiredImports.add(identifier);

              // Handle the Imports.
              _requiredImportsOfReturn.add(identifier);
              _requiredImportsOfMethod.add(identifier);
            }
          }

          // Determine the imports of the ReturnType.
          method.returnType.imports = _extractImports(
            _requiredImportsOfReturn,
            mappingTypeToImport,
            fileMapping
          );
        }

        // Determine the imports of the Method
        method.imports = _extractImports(
          _requiredImportsOfMethod,
          mappingTypeToImport,
          fileMapping
        );

        item.methods.push(method);
      }

      item.imports.content = "";
      item.imports.required = requiredImports.size > 0;

      // List containing the already used Types
      const importedBaseTypes = new Set<string>();

      // Iterate over the Imports
      for (const reqType of requiredImports) {
        if (
          mappingTypeToImport[reqType] &&
          mappingTypeToImport[reqType].size === 1
        ) {
          // Extract the Path of the File
          const name = Array.from(mappingTypeToImport[reqType].values())[0];
          const ending = name.includes("node_modules") ? ".d.ts" : ".ts";
          const pathToFile = name + ending;

          const declarations = getDeclarationByName(
            fileMapping,
            pathToFile,
            reqType
          ).filter((item) => !importedBaseTypes.has(item.baseType));
          declarations.map((item) => importedBaseTypes.add(item.baseType));

          item.imports.content += declarations
            .map((item) => item.originalCode)
            .reduce(
              (prev, current, idx) =>
                item.imports.content.length === 0 && idx === 0
                  ? current
                  : prev + "\n\n" + current,
              ""
            );
        } else if (mappingTypeToImport[reqType].size > 1) {
          // Multiple Items are using the Same Name.
          throw Error("Multiple Elements are used.");
        }
      }

      ret.classes.push(item);
    } catch (e) {
      // Show which file is relevant.
      if (options.logger) {
        options.logger.error(
          "Failed analyzing Class " + relevantClass.className
        );
        options.logger.error(e);
      }
    }
  }

  try {
    // Options for the TJS.Compiler;
    const compilerOptions: TJS.CompilerOptions = {
      strictNullChecks: true,
      skipLibCheck: true,
    };

    // After all files has been written => Generate the Schemas:
    const _settings: TJS.PartialArgs = {
      required: true,
    };

    await createFile(
      join(options.tempDir, "temp.ts"),
      // join(options.tempDir, 'param.ts'),
      _generalInformationModel(mappingTypeToImport, fileMapping)
    );

    const _program = TJS.getProgramFromFiles(
      [join(options.tempDir, "temp.ts")],
      compilerOptions
    );

    // We can either get the schema for one file and one type...
    ret.generalModel = JSON.parse(
      JSON.stringify(TJS.generateSchema(_program, "*", _settings))
    );
  } catch (e) {
    if (options.logger) {
      options.logger.error("Failed parsing the general model", e);
    }

    ret.generalModel = {};
  }

  // Return the Type.
  return ret;
}
