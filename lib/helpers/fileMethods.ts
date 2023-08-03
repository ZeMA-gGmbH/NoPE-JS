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
import {
  RUNNINGINLINUX,
  RUNNINGINOSX,
  RUNNINGINWINDOWS,
} from "./runtimeMethods";
import { replaceAll } from "./stringMethods";

export const exists = promisify(__exists);
const _lstat = promisify(lstat);

/**
 * Helper to determine the Path Seperator.
 * @returns
 */
export function getPathSeparator() {
  if (RUNNINGINWINDOWS) {
    return "\\";
  } else if (RUNNINGINOSX || RUNNINGINLINUX) {
    return "/";
  }

  // default to *nix system.
  return "/";
}

/**
 * Helper to convert the Path to an os specific path.
 * @param path
 * @returns
 */
export function convertPathToOsPath(path: string): string {
  if (RUNNINGINWINDOWS) {
    return replaceAll(path, "\\", FOLDER_SPLIT);
  }

  return replaceAll(path, "/", FOLDER_SPLIT);
}

// Based on the OS select the Path Element.
export const FOLDER_SPLIT = getPathSeparator();

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
  fileName = convertPathToOsPath(fileName);

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
  // Adapt the File Pathes
  path = convertPathToOsPath(path);

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
 * @param {string} dirPath
 */
export async function deletePath(dirPath: string): Promise<void> {
  if (!(await exists(dirPath))) {
    throw new URIError("path doesnt exits.");
  }
  // Make shure we are using the correct path.
  dirPath = convertPathToOsPath(dirPath);

  const _totalPath = dirPath;
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

  await rmdir(dirPath);
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
  return join(convertPathToOsPath(_currentPath), convertPathToOsPath(_dirPath));
}

/**
 * Returns a List of File-Names.
 *
 * @export
 * @param {string} dirPath Path where the system should look
 * @param {string} [type=''] specified ending of the File. For Instance '.conf'
 * @returns {Array<string>} List containing all Files
 */
export async function listFiles(dirPath: string, type = ""): Promise<string[]> {
  // Adapt the Path
  dirPath = convertPathToOsPath(dirPath);

  if (!exists(dirPath)) {
    throw new URIError("path doesnt exits.");
  }

  const _dirPath = dirPath;

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
 * @param {string} dirPath Start path
 * @returns {Array<string>} Array containing all Pathes to the Subfolders
 */
export async function listFolders(dirPath: string): Promise<Array<string>> {
  // Adapt the Path
  dirPath = convertPathToOsPath(dirPath);

  if (!(await exists(dirPath))) {
    throw new URIError("path doesnt exits.");
  }
  const _dirPath = dirPath;

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
 * @param {string} dirPath start path
 * @param {(err, data) => void} filecallback function which is called on a file
 * @param {(err, data) => void} foldercallback function which is called on a folder
 */
async function _walkRecursive(
  dirPath: string,
  filecallback: (err, data) => Promise<void>,
  foldercallback: (err, data) => Promise<void>
) {
  // Adapt the Path
  dirPath = convertPathToOsPath(dirPath);

  for (const name of await readdir(dirPath)) {
    // Create the FilePath
    const filePath = join(dirPath, name);
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
