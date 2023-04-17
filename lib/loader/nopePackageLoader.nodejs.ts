/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { injectable } from "inversify";
import { resolve } from "path";
import "reflect-metadata";
import { IPackageDescription } from "../types/nope/nopePackage.interface";
import { NopePackageLoader } from "./nopePackageLoader";

/**
 * Helper Class to Build an inversify Container.
 *
 * @export
 * @class NopePackageLoader
 * @implements {INopePackageLoader}
 */
@injectable()
export class NopePackageLoaderFileAccess extends NopePackageLoader {

  /**
   * A Method, to load a package file, located at the given path. 
   * @param path Path to the `javascript` file
   * @param useAutostart Flag to enable / disable the Autostart
   * @param useInstance Flag to enable / disable considering the Instances.
   */
  async loadPackageFile(path: string, useAutostart = true, useInstance = true) {
    const loadedPackage = (await import(resolve(path)))
      .DESCRIPTION as IPackageDescription<any>;
    if (!useAutostart) {
      loadedPackage.autostart = {};
    }
    if (!useInstance) {
      loadedPackage.defaultInstances = [];
    }
  }
}
