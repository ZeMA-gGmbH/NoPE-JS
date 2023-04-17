/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:23
 * @modify date 2020-11-11 08:32:53
 * @desc [description]
 */

import { Node, Type } from "ts-morph";
import { ITypeInformation } from "../types/ITypeInformation";

function _defineType(
  compilerType,
  text: string,
  addToTypeImports: (path: string, identifier: string) => void
) {
  let baseType = "";
  let simplifiedType = "";
  let simplifiedSubType = "";

  // Test if the Type is a Base-Type.
  if (compilerType?.intrinsicName) {
    // Basic Type.
    baseType = compilerType.intrinsicName;
  } else if (compilerType?.symbol) {
    // A complex Type like a Map etc.
    baseType = compilerType.symbol.escapedName.toString();

    // Regex to extrat the Imports with the corresponding type.
    const externalTypes = /import\(.+?\)\.\w+/g;
    const result = [...(text as any).matchAll(externalTypes)];

    // Use the Regex to remove the Imports
    const regex = /import\(.+?\)./g;
    simplifiedType = text.replace(regex, "");

    // Only if the type isnt a function the result will be present:
    if (result.length > 0) {
      // Update the Imported Types.
      result.map((item) => {
        const text = item.toString();

        // Regex, to extract the path of the Import.
        const regex = /(?<=")(.*)(?=")/g;
        const path = regex.exec(text)[0].toString();
        // Get the corresponding Typ-Identifier
        const identifier = text.split(").")[1];

        addToTypeImports(path, identifier);
      });
    }

    // Define the a Simplified Subtype.
    simplifiedSubType = simplifiedType;
    if (
      simplifiedType.includes(baseType + "<") &&
      simplifiedType[simplifiedType.length - 1] === ">"
    ) {
      simplifiedSubType = simplifiedType.slice(
        baseType.length + "<".length,
        simplifiedType.length - 1
      );
    }
  }

  return {
    baseType,
    simplifiedType,
    simplifiedSubType,
  };
}

function _getTypeInformation(inputType: Type, text: string) {
  // Define return Properties.
  let baseType = "";
  let simplifiedType = "";
  let simplifiedSubType = "";
  let typeImports: { path: string; identifier: string }[] = [];
  let originalCode = inputType.getText();

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

  // Test if there is only one Type:
  if (
    !(inputType.compilerType as any)?.types ||
    (inputType.compilerType as any)?.types?.length === 1
  ) {
    // Test if the Type is a Base-Type.
    if ((inputType.compilerType as any)?.intrinsicName) {
      // Basic Type.
      baseType = (inputType.compilerType as any).intrinsicName;
    } else if ((inputType.compilerType as any)?.symbol) {
      // A complex Type like a Map etc.
      baseType = (inputType.compilerType as any).symbol.escapedName.toString();

      // Regex to extrat the Imports with the corresponding type.
      const externalTypes = /import\(.+?\)\.\w+/g;
      const result = [...(text as any).matchAll(externalTypes)];

      // Use the Regex to remove the Imports
      const regex = /import\(.+?\)./g;
      simplifiedType = text.replace(regex, "");

      // Only if the type isnt a function the result will be present:
      if (result.length > 0) {
        // Update the Imported Types.
        result.map((item) => {
          const text = item.toString();

          // Regex, to extract the path of the Import.
          const regex = /(?<=")(.*)(?=")/g;
          const path = regex.exec(text)[0].toString();
          // Get the corresponding Typ-Identifier
          const identifier = text.split(").")[1];

          addToTypeImports(path, identifier);
        });
      }

      // Define the a Simplified Subtype.
      simplifiedSubType = simplifiedType;
      if (
        simplifiedType.includes(baseType + "<") &&
        simplifiedType[simplifiedType.length - 1] === ">"
      ) {
        simplifiedSubType = simplifiedType.slice(
          baseType.length + "<".length,
          simplifiedType.length - 1
        );
      }
    }
  } else if ((inputType.compilerType as any)?.types?.length > 1) {
    // Iterate over all partial Parts.
    // for (const partialType of (inputType.compilerType as any).types){

    // }

    // Regex to extrat the Imports with the corresponding type.
    const externalTypes = /import\(.+?\)\.\w+/g;
    const result = [...(text as any).matchAll(externalTypes)];

    // Use the Regex to remove the Imports
    const regex = /import\(.+?\)./g;
    simplifiedType = text.replace(regex, "");

    // Only if the type isnt a function the result will be present:
    if (result.length > 0) {
      // Update the Imported Types.
      result.map((item) => {
        const text = item.toString();

        // Regex, to extract the path of the Import.
        const regex = /(?<=")(.*)(?=")/g;
        const path = regex.exec(text)[0].toString();
        // Get the corresponding Typ-Identifier
        const identifier = text.split(").")[1];

        addToTypeImports(path, identifier);
      });
    }

    // Define the a Simplified Subtype.
    simplifiedSubType = simplifiedType;
    if (
      simplifiedType.includes(baseType + "<") &&
      simplifiedType[simplifiedType.length - 1] === ">"
    ) {
      simplifiedSubType = simplifiedType.slice(
        baseType.length + "<".length,
        simplifiedType.length - 1
      );
    }
  }

  // Define a Partial element of the Return-Value.
  const ret: ITypeInformation = {
    isBaseType: !!(inputType.compilerType as any).intrinsicName,
    baseType,
    originalCode,
    typeImports,
    imports: {
      required: false,
      content: "",
    },
    declaration: inputType,
  };

  // Add the Additional elements if required.
  if (!ret.isBaseType) {
    ret.simplifiedType = simplifiedType;
    ret.simplifiedSubType = simplifiedSubType;
    ret.typeImports = typeImports;
  }

  // Return the Type.
  return ret;
}

/**
 * Function, used to analyze the Type of a Prop / Parameter etc.
 * @param node The node used to describe the element
 * @param inputType The type
 * @param text The textual representation.
 */
export function getType(node: Node, inputType: Type, text: string) {
  const ret = _getTypeInformation(inputType, text);
  ret.declaration = node;

  // The Element could be a Function.
  if (
    Node.isFunctionDeclaration(node) ||
    Node.isFunctionTypeNode(node) ||
    Node.isFunctionLikeDeclaration(node) ||
    Node.isMethodDeclaration(node)
  ) {
    ret.baseType = "function";

    // Iterate over the parameters and add additional imports.
    ret.parameters = node.getParameters().map((parameter) => {
      const defintion = getType(
        parameter.getTypeNode(),
        parameter.getType(),
        parameter.getType().getText()
      );

      if (!defintion.isBaseType) {
        // Add the Elements to the Import.
        ret.typeImports.push(...defintion.typeImports);
      }

      return Object.assign(defintion, {
        name: parameter.getName(),
        isOptional: parameter.isOptional(),
      });
    });

    ret.returnType = getType(
      node.getReturnTypeNode(),
      node.getReturnType(),
      node.getReturnType().getText()
    );

    // Add the Imports.
    ret.typeImports.push(...ret.returnType.typeImports);
  }

  if (Node.isInterfaceDeclaration(node)) {
    const addToTypeImports = (path, identifier) => {
      for (const item of ret.typeImports) {
        if (item.identifier === identifier) {
          return;
        }
      }
      ret.typeImports.push({
        path,
        identifier,
      });
    };
    node.getExtends().map((item) => {
      const identifier = item.getText();
      const regexPath = /(?<=import\(").+?(?="\).)/g;
      const path = [
        ...(item.getType().getText() as any).matchAll(regexPath),
      ][0].toString();

      addToTypeImports(path, identifier);
    });
  }

  // Return the Type.
  return ret;
}
