/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { getSingleton } from "../helpers/singletonMethod";
import {
  IDispatcherConstructor,
  INopeDispatcherOptions,
  INopePackageLoader,
  INopePackageLoaderConstructor,
} from "../types/nope";
import { generateNopeBasicPackage } from "./generateNopeBasicPackage";
import { NopePackageLoader } from "./nopePackageLoader";

/**
 * Function to extract the Package-Loader. This Package-Loader omits methods, that depends on a file-system.
 * 
 * This method should be used in a browser enviroment, otherwise use the function created for the Backend.
 * 
 * @param {INopeDispatcherOptions} dispatcherOptions The provided options for the Dispatcher
 * @param options Settings for the creation of the Dispatcher etc.
 * @returns {INopePackageLoader} The Package loader.
 */
export function getPackageLoader(
  dispatcherOptions: INopeDispatcherOptions,
  options: {
    /**
     * If desired, the user is allowed ot change the Constructor of a Packageloader.
     * This will ensure modularity.
     */
    packageLoaderConstructorClass?: INopePackageLoaderConstructor;
    
    /**
     * If desired, the user is allowed ot change the Constructor of a Dipatcher.
     * This will ensure modularity.
     */
    dispatcherConstructorClass?: IDispatcherConstructor;
    /**
     * Flag to indicate, that there should be only 1 dispatcher per process. This
     * is the default setting and it is recommended. (Its way faster due to the 
     * communication overhead, created using a dispatcher). In special use-cases 
     * (e.g. testing ) it might be usefull to have full controll of the amount of
     * provided dispatchers.
     */
    singleton?: boolean;
    /**
     * Flag to enable / Disable the usage of base-services for a dispatcher. 
     * Please checkout {@link dispatcher.useBaseServices} to get an overview
     * of the defaultly implemented base-services.
     */
    useBaseServices?: boolean;
  } = {}
): INopePackageLoader {
  if (
    options.packageLoaderConstructorClass === null ||
    options.packageLoaderConstructorClass === undefined
  ) {
    options.packageLoaderConstructorClass = NopePackageLoader;
  }

  options = Object.assign(
    {
      packageLoaderConstructorClass: null,
      dispatcherConstructorClass: null,
      singleton: true,
      useBaseServices: true,
    },
    options
  );

  const create = () => {
    // Create a loader
    const loader = new options.packageLoaderConstructorClass();

    // load the default Package:
    loader
      .addPackage(
        generateNopeBasicPackage(dispatcherOptions, options.singleton)
      )
      .catch((e) => {
        throw e;
      });

    return loader;
  };

  if (options.singleton) {
    // Create a singaleton if required.
    // use the container to receive the
    // singleton object
    const container = getSingleton("nopeBackendPackageLoader.instance", create);

    return container.instance;
  }

  // No singleton is required =>
  // create a new instance.
  return create();
}
