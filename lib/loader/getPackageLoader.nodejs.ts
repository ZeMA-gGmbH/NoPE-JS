/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { INopePackageLoaderConstructor } from "../index.browser";
import {
  IDispatcherConstructor,
  INopeDispatcherOptions,
} from "../types/nope/nopeDispatcher.interface";
import { getPackageLoader as getBrowserPackageLoader } from "./getPackageLoader.browser";
import { NopePackageLoaderFileAccess } from "./nopePackageLoader.nodejs";

/**
 * Function to extract the Package-Loader. This one here includes file access.
 * @param {INopeDispatcherOptions} dispatcherOptions The provided options for the Dispatcher
 * @param options Settings for the creation of the Dispatcher etc.
 * @returns {INopePackageLoader} The Package loader.
 */
export function getPackageLoader(
  dispatcherOptions: INopeDispatcherOptions,
  options: {
    packageLoaderConstructorClass?: INopePackageLoaderConstructor;
    dispatcherConstructorClass?: IDispatcherConstructor;
    singleton?: boolean;
    useBaseServices?: boolean;
  } = {}
) {
  options.packageLoaderConstructorClass = NopePackageLoaderFileAccess;

  return getBrowserPackageLoader(dispatcherOptions, options);
}
