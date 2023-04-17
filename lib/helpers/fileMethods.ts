/**
 * @module files
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 *
 * Helper to handle with files.
 *
 *
 * Central Elements are:
 * - {@link FOLDER_SPLIT}: The folder splitchar of the os.
 * - {@link createFile}: A Helper to create a file.
 * - {@link createPath}: A Helper to create a file and the corresponding folders if they doesnt exists.
 * - {@link deletePath}: A Helper to remove a dir,
 * - {@link relativePath}: Creates a releative path
 * - {@link listFiles}: list files of a specific type in defined path.
 * - {@link listFolders}: list Folders in defined path.
 */

import { exists as __exists, lstat, ObjectEncodingOptions } from "fs";
import { mkdir, readdir, rmdir, unlink, writeFile } from "fs/promises";
import { type } from "os";
import { join } from "path";
import { promisify } from "util";

export const exists = promisify(__exists);
const _lstat = promisify(lstat);

// Based on the OS select the Path Element.
export const FOLDER_SPLIT = type() === "Linux" ? "/" : "\\";

/**
 * Function to create a File
 * @param fileName Read the File.
 * @param content content which should be stored
 * @param options The options to write the file. See original docu: https://nodejs.org/dist/latest-v8.x/docs/api/fs.html#fs_fs_writefile_file_data_options_callback
 */
export async function createFile(
  fileName: string,
  content: string,
  options?:
    | (ObjectEncodingOptions & {
        mode?: string | number;
        flag?: string | number;
      })
    | "ascii"
    | "utf8"
    | "utf-8"
    | "utf16le"
    | "ucs2"
    | "ucs-2"
    | "base64"
    | "latin1"
    | "binary"
    | "hex"
): Promise<string> {
  // Adapt the File Pathes
  fileName =
    type() === "Linux"
      ? fileName.replace(/\\\\/g, "/")
      : fileName.replace(/\//g, "\\");

  // Split the Path into different segements.
  const pathParts = fileName.split(FOLDER_SPLIT);

  // Pop the File.
  pathParts.pop();

  // Create the Path / Directories
  await createPath(pathParts.join(FOLDER_SPLIT));

  // Wirte the File.
  await writeFile(fileName, content, options);

  return fileName;
}

/**
 * Function to create a File at a given Path. If the File or the dir doesnt exists it will be created.
 * @param path Read the File.
 * @param content content which should be stored
 * @param options The options to write the file. See original docu: https://nodejs.org/dist/latest-v8.x/docs/api/fs.html#fs_fs_writefile_file_data_options_callback
 */
export async function createPath(path: string) {
  await mkdir(path, { recursive: true });
  return path;
}

/**
 * Deletes the complete Path recursevly.
 * > *WARNING: * Deletes Everything in the Folder.
 *
 * Example:
 * `deletePath('C:\\Test');`
 *
 * This deletes all Files and Subfolders in the given Path.
 * Furthermore the Folder Test itself is removed.
 *
 * @export
 * @param {string} dir_path
 */
export async function deletePath(dir_path: string): Promise<void> {
  if (!(await exists(dir_path))) {
    throw new URIError("path doesnt exits.");
  }
  const _totalPath = dir_path;
  /** Sort the Pathes according to their length. For instance:
   * _pathes = ['C:\\Test\\Sub', 'C:\\Test\\Sub\\SubSub']
   *
   * => After Sorting :
   * _pathes = ['C:\\Test\\Sub\\SubSub', 'C:\\Test\\Sub']
   *
   * This garantuees to delete all Sub Folders in a correct sequence.
   */
  const _pathes = (await listFolders(_totalPath)).sort(
    (a: string, b: string) => {
      return b.split(FOLDER_SPLIT).length - a.split(FOLDER_SPLIT).length;
    }
  );

  const _files = await listFiles(_totalPath);

  /** Delete all Files. */
  for (const _file of _files) {
    await unlink(_file);
  }

  /** Delete all Folders. */
  for (const _path of _pathes) {
    await rmdir(_path);
  }

  await rmdir(dir_path);
}

/**
 * Creates a relative Path based on the Folder where
 * 'node ...' was typed.
 * @param _dirPath the path to Check
 * @param _currentPath the current Path.
 */
export function relativePath(
  _dirPath: string,
  _currentPath = process.cwd()
): string {
  return join(_currentPath, _dirPath);
}

/**
 * Returns a List of File-Names.
 *
 * @export
 * @param {string} _dir_path Path where the system should look
 * @param {string} [type=''] specified ending of the File. For Instance '.conf'
 * @returns {Array<string>} List containing all Files
 */
export async function listFiles(
  _dir_path: string,
  type = ""
): Promise<string[]> {
  if (!exists(_dir_path)) {
    throw new URIError("path doesnt exits.");
  }

  const _dirPath = _dir_path;

  const _files = new Array<string>();

  /** Define a Function to Handle the Files. */
  const _fileFunc = async function (err, file_name) {
    if (err) {
      throw err;
    }
    // Check the File Ending.
    if (file_name.endsWith(type)) {
      _files.push(file_name);
    }
  };

  /** Define a Function to Handle the Dirs => Recursive call. */
  const _dirFunc = async function (err, _path) {
    if (err) {
      throw err;
    } else {
      await _walkRecursive(_path, _fileFunc, _dirFunc);
    }
  };

  // Function to Filter the Files and add it to the Array.
  await _walkRecursive(_dirPath, _fileFunc, _dirFunc);

  // Return the File.
  return _files;
}

/**
 * Lists all Subfolders in the given Path
 *
 * @export
 * @param {string} _dir_path Start path
 * @returns {Array<string>} Array containing all Pathes to the Subfolders
 */
export async function listFolders(_dir_path: string): Promise<Array<string>> {
  if (!(await exists(_dir_path))) {
    throw new URIError("path doesnt exits.");
  }
  const _dirPath = _dir_path;

  const _pathes = new Array<string>();

  /** Define a Function to Handle the Dirs => Recursive call. */
  const _dirFunc = async function (err, _path) {
    if (err) {
      throw err;
    } else {
      _pathes.push(_path);
      await _walkRecursive(
        _path,
        async () => {
          // no callback
        },
        _dirFunc
      );
    }
  };

  // Function to Filter the Files and add it to the Array.
  await _walkRecursive(
    _dirPath,
    async () => {
      // no callback
    },
    _dirFunc
  );

  // Return the File.
  return _pathes;
}

/**
 * Internal Function to walk through a directory and
 * call different functions on a found subdir or file.
 *
 * @param {string} dir_path start path
 * @param {(err, data) => void} filecallback function which is called on a file
 * @param {(err, data) => void} foldercallback function which is called on a folder
 */
async function _walkRecursive(
  dir_path: string,
  filecallback: (err, data) => Promise<void>,
  foldercallback: (err, data) => Promise<void>
) {
  for (const name of await readdir(dir_path)) {
    // Create the FilePath
    const filePath = join(dir_path, name);
    // Determine the Type
    const stat = await _lstat(filePath);
    if (stat.isFile()) {
      // It is a File => Store it.
      await filecallback(null, filePath);
    } else if (stat.isDirectory()) {
      // It is a Directory.
      await foldercallback(null, filePath);
    }
  }
}
