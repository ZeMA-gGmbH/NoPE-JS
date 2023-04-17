/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:34
 * @modify date 2020-11-06 08:51:35
 * @desc [description]
 */

import { SourceFile } from "ts-morph";
import { IImportMapping } from "../types/IImportMapping";

/**
 * Helperfunction, used to extract a Mapping of imported Files. This allows the user to rename the interfaces
 * to custom names. this will then be mapped to the original name
 * @param file The Source File.
 */
export function getImportsOfFile(file: SourceFile): IImportMapping {
  const mapping: {
    [index: string]: {
      // The Source that is used for importing the class.
      importSrc: string;

      // an alias for the classs
      alias?: string;
    };
  } = {};

  // Maps alias to original names
  const aliasToOriginal: { [index: string]: string } = {};

  // Filter the Imports, that only use named imports.
  file
    .getImportDeclarations()
    .filter((_import) => _import.getNamedImports().length > 0)
    .map((_import) => {
      // Extract the Name and loaded Module / Path.
      return {
        namespaces: _import.getNamedImports().map((_namedImport) => {
          // Store the Import with the File.
          mapping[_namedImport.getName()] = {
            importSrc: _import.getModuleSpecifierValue(),
          };
          // If an alias is used update the import.
          if (_namedImport.getAliasNode()) {
            mapping[_namedImport.getName()] = {
              importSrc: _import.getModuleSpecifierValue(),
              alias: _namedImport.getAliasNode().getText(),
            };
            aliasToOriginal[_namedImport.getAliasNode().getText()] =
              _namedImport.getName();
          }
          return _namedImport.getName();
        }),
        module: _import.getModuleSpecifierValue(),
      };
    });

  return { mapping, aliasToOriginal };
}
