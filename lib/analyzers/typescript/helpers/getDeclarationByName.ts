/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:45
 * @modify date 2020-11-10 11:07:22
 * @desc [description]
 */

import { SourceFile } from "ts-morph";
import { IPropertyInformation } from "../types/IPropertyInformation";
import { ITypeInformation } from "../types/ITypeInformation";
import { getDescription } from "./getDescription";
import { getImportsOfFile } from "./getImportsOfFile.";

/**
 * Function to extrac the Declaration by the Name of the Element
 * @param files A File Mapping
 * @param filePath The Relevant File
 * @param identifier The Identifier of the Element, on which the Description should be extracted
 * @param types Internal Object, used for recursion.
 */
export function getDeclarationByName(
  files: { [index: string]: SourceFile },
  filePath: string,
  identifier: string,
  types: { [index: string]: ITypeInformation } = {},
  tested = new Set<string>()
) {
  // Make shur the File is named correctly.
  if (!filePath.endsWith(".ts")) {
    filePath = filePath + ".ts";
  }

  // Iterate over all files, to finde the correct one.
  const file = files[filePath];
  if (file) {
    // Get all Declarations
    const declarations = file.getExportedDeclarations();
    // Get the Imports of the File.
    const importMapping = getImportsOfFile(file);

    // If the idenfifiert is know, go on otherwise throw an Error.
    if (declarations.has(identifier)) {
      const exportedDeclarations = declarations.get(identifier);
      const typesToTest = exportedDeclarations.map(
        (e) => getDescription(e) as IPropertyInformation | ITypeInformation
      );
      const recursiveTest = new Array<{
        path: string;
        identifier: string;
      }>();

      // Iterate as long, as there are elements to test
      while (typesToTest.length > 0) {
        // Get the Type.
        const type = typesToTest.pop();

        // Flag, indicating, whether the element has been imported or not
        const isImported =
          importMapping.aliasToOriginal[type.baseType] !== undefined ||
          importMapping.mapping[type.baseType] !== undefined;
        // Flag, showing whether the element imports other Items or not.
        const hasImport = type.typeImports && type.typeImports.length > 0;

        // If the Element isnt imported => simply add the item Type
        if (!isImported && types[type.originalCode] === undefined) {
          types[type.originalCode] = type;
          tested.add(type.baseType);
        } else if (isImported && types[type.originalCode] === undefined) {
          recursiveTest.push({
            path: importMapping.mapping[type.baseType].importSrc,
            identifier: type.baseType,
          });
        }

        if (hasImport) {
          type.typeImports.map((item) => {
            // We want to use our destructor in here
            const { path, identifier } = item;

            if (!tested.has(identifier)) {
              // Push the Elements to the Reverse Test.
              recursiveTest.push({
                path,
                identifier,
              });
            }
          });
        }
      }

      // Call this Function recursively.
      for (const rec of recursiveTest) {
        getDeclarationByName(files, rec.path, rec.identifier, types, tested);
      }

      return Object.getOwnPropertyNames(types).map((key) => types[key]);
    }
  }

  throw Error('Declaration "' + filePath + '" not found');
}
