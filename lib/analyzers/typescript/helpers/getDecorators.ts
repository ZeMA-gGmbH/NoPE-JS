/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 11:37:19
 * @modify date 2020-11-05 11:37:20
 * @desc [description]
 */

import {
  ClassDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
} from "ts-morph";
import { IDecoratorFilter } from "../types/IDecoratorFilter";
import { IDecoratorInformation } from "../types/IDecoratorInformation";
import { IImportMapping } from "../types/IImportMapping";

/**
 * Function to extract the Decorator settings of the defined type.
 * @param declaration The declaration to test.
 * @param decorator The decorator, that should be used.
 * @param aliasToOriginal Mapping of aliases to original imported names.
 * @param caseSensitive Turn off / on case sensitive for the checked decorator
 * @param extractArgs Turn off / on extracting the Arguments of the Decorator.
 */
export function getDecorators(
  declaration: MethodDeclaration | PropertyDeclaration | ClassDeclaration,
  decoratorFilter: IDecoratorFilter,
  mapping: IImportMapping,
  extractArgs = true
) {
  // Define the Returntype.
  const ret: IDecoratorInformation = {
    declaration,
    decoratorNames: [],
    decoratorSettings: {},
    decorators: [],
  };

  ret.decorators = declaration.getDecorators().filter((usedDecorator) => {
    return decoratorFilter(declaration, usedDecorator, mapping);
  });

  if (extractArgs) {
    ret.decorators.map((usedDecorator) => {
      // Try to extract the arguments of the Decorator (doest work on none static object / elements)
      const _arguments = usedDecorator.getArguments();

      if (_arguments.length > 0) {
        _arguments.map((a) => {
          // Parse the Text
          const text = a.getText();

          // Bad Practice. Create the Code create Function that will create the Object.
          try {
            ret.decoratorSettings[usedDecorator.getName()] = eval(
              "() => { return " + text + "}"
            )();
          } catch (e) {
            // Failed to Parse
          }
        });
      } else {
        // ret.decoratorSettings[nameOfDecorator] = null
      }
    });
  }

  ret.decoratorNames = ret.decorators.map((d) => d.getName());

  return ret;
}
