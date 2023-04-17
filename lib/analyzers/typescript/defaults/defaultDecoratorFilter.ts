/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:52:11
 * @modify date 2021-01-18 17:19:40
 * @desc [description]
 */

import {
  ClassDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
} from "ts-morph";
import { IDecoratorFilter } from "../types/IDecoratorFilter";

export function defaultDecoratorFilter(
  decorators: {
    class: string[];
    methods: string[];
    properties: string[];
  },
  caseSensitive = false
): IDecoratorFilter {
  // Update the Decorators:
  if (!caseSensitive) {
    decorators.class = decorators.class.map((item) => {
      return item.toLocaleLowerCase();
    });
    decorators.methods = decorators.methods.map((item) => {
      return item.toLocaleLowerCase();
    });
    decorators.properties = decorators.properties.map((item) => {
      return item.toLocaleLowerCase();
    });
  }

  return (declaration, decorator, mapping) => {
    // Get the Name of the Decorator
    let nameOfDecorator = decorator.getName();
    // Let CaseSensitive or not
    if (!caseSensitive) {
      nameOfDecorator = nameOfDecorator.toLowerCase();
    }

    if (declaration instanceof ClassDeclaration) {
      for (const name of decorators.class) {
        if (typeof mapping.aliasToOriginal[nameOfDecorator] === "string") {
          if (name === mapping.aliasToOriginal[nameOfDecorator]) return true;
        } else if (name === nameOfDecorator) {
          return true;
        }
      }
    } else if (declaration instanceof MethodDeclaration) {
      for (const name of decorators.methods) {
        if (typeof mapping.aliasToOriginal[nameOfDecorator] === "string") {
          if (name === mapping.aliasToOriginal[nameOfDecorator]) return true;
        } else if (name === nameOfDecorator) {
          return true;
        }
      }
    } else if (declaration instanceof PropertyDeclaration) {
      for (const name of decorators.properties) {
        if (typeof mapping.aliasToOriginal[nameOfDecorator] === "string") {
          if (name === mapping.aliasToOriginal[nameOfDecorator]) return true;
        } else if (name === nameOfDecorator) {
          return true;
        }
      }
    }

    return false;
  };
}
