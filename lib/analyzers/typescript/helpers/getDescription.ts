/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 10:49:13
 * @modify date 2020-11-10 11:22:42
 * @desc [description]
 */

import {
  ExportedDeclarations,
  FunctionDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  Node,
  PropertyDeclaration,
} from "ts-morph";
import { NAME_PROMISE } from "../defaults/names";
import { IFunctionInformation } from "../types/IFunctionInformation";
import { IMethodInformation } from "../types/IMethodInformation";
import { IPropertyInformation } from "../types/IPropertyInformation";
import { ITypeInformation } from "../types/ITypeInformation";
import { getModifiers } from "./getModifiers";
import { getType } from "./getType";

/**
 * Helper Function to extract the Types of a Function Like Object.
 *
 * @template T
 * @param {T} declaration
 * @return {*}  {IFunctionInformation<T>}
 */
function _functionDescription<
  T extends FunctionDeclaration | MethodDeclaration
>(declaration: T): IFunctionInformation<T> {
  // Extract the Type Information:
  let typeInformation = getType(
    declaration,
    declaration.getType(),
    declaration.getType().getText()
  );

  const name = declaration.getName();
  const isGenerator = declaration.isGenerator();
  const isImplementation = declaration.isImplementation();
  const hasReturnType = typeInformation.returnType.simplifiedSubType !== "void";

  // Extract the Description of the Author.
  const authorDescription = declaration
    .getLeadingCommentRanges()
    .map((comment) => comment.getText())
    .join("\n");

  // Flag if the Function is Performed Async. (this is achieved by retruning a promise or adding an async tag in the beginning)
  const isAsync =
    declaration.isAsync() ||
    typeInformation.returnType.baseType == "Promise" ||
    typeInformation.returnType.baseType == NAME_PROMISE;

  const ret: IFunctionInformation<T> = Object.assign(typeInformation, {
    name,
    isGenerator,
    isImplementation,
    isAsync,
    hasReturnType,
    authorDescription,
    declaration,
  }) as any;

  return ret;
}

/**
 * Function get a Description of different Files.
 * @param declaration The Declaration to analyze
 */
export function getDescription(
  declaration:
    | PropertyDeclaration
    | InterfaceDeclaration
    | FunctionDeclaration
    | MethodDeclaration
    | ExportedDeclarations
):
  | IPropertyInformation
  | IMethodInformation
  | IFunctionInformation
  | ITypeInformation {
  let typeInformation: ITypeInformation;

  if (Node.isPropertyDeclaration(declaration)) {
    typeInformation = getType(
      declaration.getTypeNode(),
      declaration.getType(),
      declaration.getType().getText()
    );

    return Object.assign(
      // Use the Modifiers
      getModifiers(declaration),
      // Provide the Type Information.
      typeInformation,
      {
        // And use the Propertiy Name.
        name: declaration.getName(),
        // Keep the declartion object as well
        declaration,
        imports: {
          required: false,
          content: "",
        },
      }
    ) as IPropertyInformation;
  } else if (Node.isInterfaceDeclaration(declaration)) {
    const typeImports: {
      path: string;
      identifier: string;
    }[] = [];

    const addToTypeImports = (path, identifier) => {
      for (const item of typeImports) {
        if (item.identifier === identifier) {
          return;
        }
      }

      typeImports.push({
        path,
        identifier,
      });
    };

    declaration.getExtends().map((item) => {
      const identifier = item.getText();
      const regexPath = /(?<=import\(").+?(?="\).)/g;
      const path = [
        ...(item.getType().getText() as any).matchAll(regexPath),
      ][0].toString();

      addToTypeImports(path, identifier);
    });

    declaration.getProperties().map((p) => {
      let text = p.getType().getText();
      const externalTypesRegex = /import\(.+?\)\.\w+/g;
      const externalTypes = [...(text as any).matchAll(externalTypesRegex)];

      for (const externalType of externalTypes) {
        const section = externalType.toString();

        const regexType = /import\(.+?\)./g;
        const identifier = section.replace(regexType, "");

        const regexPath = /(?<=import\(").+?(?="\).)/g;
        const path = [...section.matchAll(regexPath)][0].toString();

        addToTypeImports(path, identifier);
      }
    });

    // // Define a Partial element of the Return-Value.
    const ret: ITypeInformation = {
      isBaseType: false,
      baseType: declaration.getName(),
      originalCode: declaration.getText(),
      typeImports,
      imports: {
        required: false,
        content: "",
      },
      declaration,
    };

    // Return the Type.
    return ret;
  } else if (Node.isMethodDeclaration(declaration)) {
    // Extract the Type Information:
    const isAbstract = declaration.isAbstract();

    return Object.assign(_functionDescription(declaration), {
      isAbstract,
    }) as IMethodInformation;
  } else if (Node.isFunctionDeclaration(declaration)) {
    return _functionDescription(declaration);
  }

  throw Error(
    "The declartation type is not defined. Expected types are 'FunctionDeclaration', ..."
  );
}
