/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:54
 * @modify date 2020-11-06 08:51:54
 * @desc [description]
 */

import { SourceFile } from "ts-morph";

/**
 * Create a Mapping of Files. for simpler access.
 * @param files
 */
export function createFileMapping(files: SourceFile[]) {
  // Define the Return type.
  const ret: {
    [index: string]: SourceFile;
  } = {};

  let fileAsSet = new Set(files);
  let checked = new Set();

  while (fileAsSet.size) {
    const file = Array.from(fileAsSet)[0];
    fileAsSet.delete(file);
    checked.add(file);

    // We although want to add the references used in the file.
    // This may include items in node_modules
    for (const ref of file.getReferencedSourceFiles()) {
      if (!checked.has(ref)) {
        fileAsSet.add(ref);
      }
    }

    ret[file.getFilePath()] = file;
  }

  return ret;
}
