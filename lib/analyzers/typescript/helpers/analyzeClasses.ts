/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 11:05:14
 * @modify date 2020-11-10 16:40:59
 * @desc [description]
 */

import { ILogger } from "js-logger";
import { MethodDeclaration, SourceFile } from "ts-morph";
import { IClassFilter } from "../types/IClassFilter";
import { IDecoratorFilter } from "../types/IDecoratorFilter";
import { IDecoratorInformation } from "../types/IDecoratorInformation";
import { IFileFilter } from "../types/IFileFilter";
import { IMethodFilter } from "../types/IMethodFilter";
import { IMethodInformation } from "../types/IMethodInformation";
import { IModifierInformation } from "../types/IModifierInformation";
import { IPropertyFilter } from "../types/IPropertyFilter";
import { IPropertyInformation } from "../types/IPropertyInformation";
import { getDecorators } from "./getDecorators";
import { getDescription } from "./getDescription";
import { getImportsOfFile } from "./getImportsOfFile.";
import { getMatchingProperties } from "./getMatchingProperties";
import { getModifiers } from "./getModifiers";

/**
 * Helper Function to List relevant classes with their corresponding elements
 * @param sources The Source Files
 * @param classDecorator Filter for the Class Decorators
 * @param classInterface Interfaces that should be implemented by the class
 * @param methodDecorator A Method-Decorator
 * @param propertyType The requrired Type for the Property
 * @param propertyDecorator The Decorator for the Property
 */
export function analyzeClasses(
  sources: SourceFile[],
  options: {
    filterClasses: IClassFilter;
    filterMethods: IMethodFilter;
    filterProperties: IPropertyFilter;
    filterDecorators: IDecoratorFilter;
    filterFiles: IFileFilter;
    logger?: ILogger;
  }
) {
  const ret: {
    className: string;
    decorator: IDecoratorInformation;
    methods: (IMethodInformation &
      IDecoratorInformation &
      IModifierInformation)[];
    properties: (IPropertyInformation &
      IDecoratorInformation &
      IModifierInformation)[];
  }[] = [];

  // Iterate over the Files:
  for (const file of sources) {
    try {
      if (!options.filterFiles(file.getFilePath())) {
        if (options.logger) {
          options.logger.debug("Skipping File: " + file.getFilePath());
        }
        continue;
      }

      if (options.logger) {
        options.logger.info("Checking File " + file.getFilePath());
      }

      // For Each File => Analyze the imported Files.
      // Create a Mapping File for the Improts.
      const importMapping = getImportsOfFile(file);

      // After all Imports has been detected => filter for all Classes that implement the provided classDecorator
      const relevantClasses = file
        .getClasses()
        .filter((cl) => options.filterClasses(cl, importMapping));

      // Now after each class is known => ierate over the relevant classes
      // and get their relevant Methods and Attributes.
      for (const relevantClass of relevantClasses) {
        // Extract the Methods.
        const sharedMethodsOfClass = relevantClass
          .getMethods()
          .map((method) =>
            getDecorators(method, options.filterDecorators, importMapping, true)
          )
          .filter((methodObject) => methodObject.decorators.length > 0);

        // Parsed Method
        const parsedMethods = sharedMethodsOfClass
          .map((methodObject) =>
            Object.assign(
              getDescription(methodObject.declaration) as IMethodInformation,
              getDecorators(
                methodObject.declaration,
                options.filterDecorators,
                importMapping
              ),
              getModifiers(methodObject.declaration as MethodDeclaration)
            )
          )
          .filter((item) =>
            options.filterMethods(relevantClass, item, importMapping)
          );

        // Get the Properties
        const relevantProperties = getMatchingProperties(relevantClass)
          .map((property) =>
            Object.assign(
              property,
              getDecorators(
                property.declaration,
                options.filterDecorators,
                importMapping,
                true
              ),
              getModifiers(property.declaration)
            )
          )
          .filter((property) =>
            options.filterProperties(relevantClass, property, importMapping)
          );

        const item = {
          decorator: getDecorators(
            relevantClass,
            options.filterDecorators,
            importMapping,
            true
          ),
          className: relevantClass.getName(),
          methods: parsedMethods,
          properties: relevantProperties,
        };

        ret.push(item);
      }
    } catch (e) {
      if (options.logger) {
        options.logger.error("Failed with source", file.getFilePath());
        options.logger.error(e);
      }
    }
  }

  return ret;
}
