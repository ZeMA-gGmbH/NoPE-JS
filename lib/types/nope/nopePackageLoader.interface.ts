import { Container } from "inversify";
import { IexportAsNopeServiceParameters } from "../../decorators";
import { INopeDispatcher } from "./nopeDispatcher.interface";
import { INopeModule } from "./nopeModule.interface";
import {
  IClassDescriptor,
  INopeActivationHanlder,
  IPackageDescription,
} from "./nopePackage.interface";

export interface INopePackageLoaderConstructor {
  new (): INopePackageLoader;
}

export interface INopePackageLoader {
  /**
   * Accessor for a Dispatcher; This dispatcher is created using a default package,
   * containing definition for the dispatcher etc. please see {@link nope.loader.generateNopeBasicPackage}
   * to checkout the default function.
   *
   * @type {INopeDispatcher}
   * @memberof INopePackageLoader
   */
  dispatcher: INopeDispatcher;

  /**
   * Resets the Package Loader
   *
   * @return {*}  {Promise<void>}
   * @memberof INopePackageLoader
   */
  reset(): Promise<void>;

  /**
   * Add a Description of a Package to the Loader.
   * This results in hosting the contained services and 
   * providing constructors for the shared classes.
   * 
   * Additionally all defined instances of a pac
   *
   * @param {Array<IClassDescriptor>}  the Descriptions as Array.
   * @return {*}  {Promise<void>}
   * @memberof INopePackageLoader
   */
  addDescription(element: Array<IClassDescriptor>): Promise<void>;

  /**
   * Function to add Activation Handlers.
   *
   * @param {(INopeActivationHanlder | Array<INopeActivationHanlder>)} handler
   * @return {*}  {Promise<void>}
   * @memberof INopePackageLoader
   */
  addActivationHandler(
    handler: INopeActivationHanlder | Array<INopeActivationHanlder>
  ): Promise<void>;

  /**
   * Functionality to add a complete Package. 
   * This results in hosting the contained services and 
   * providing constructors for the shared classes.
   * 
   * Afterwards the provided instances can be created using
   * {@link INopePackageLoader.generateInstances}.
   *
   *
   * @param {IPackageDescription<any>} element
   * @return {*}  {Promise<void>}
   * @memberof INopePackageLoader
   */
  addPackage(element: IPackageDescription<any>): Promise<void>;

  /**
   * Internally the loader is build using inversify. InversifyJS is a powerful and lightweight
   * inversion of control container for JavaScript & Node.js apps powered by TypeScript. 
   * 
   * For more details about InversifyJS please checkout: https://inversify.io/
   * 
   * This Element contains a default inversify container 
   */
  container: Container;

  /**
   * This is a helper used during the Building process of 
   * utilizing inversify. This might be deprecated.
   * @deprecated
   */
  activationHandlers: INopeActivationHanlder[];

  /**
   * Function to Add a different inversify container to the system. This will lead to a
   * merge. This might be deprecated.
   *
   * @deprecated
   * @param {Container} container
   * @memberof INopePackageLoader
   */
  addContainers(container: Container);

  /**
   * Generate the Instances that has been added via the packages.
   *
   * @param {boolean} [testRequirements] Flag to turn on / off the Tests. Defaultly the test is activated. Circular dependencies are not handled.
   * @return {Promise<void>}
   * @memberof INopePackageLoader
   */
  generateInstances(testRequirements?: boolean): Promise<void>;

  /**
   * Helper to add the decorated Elements.
   * @param options
   */
  addDecoratedElements(options?: {
    addServiceCallback?: (
      options: IexportAsNopeServiceParameters
    ) => Promise<boolean>;
    addClassCallback?: (options: INopeModule) => Promise<boolean>;
    consider?: Array<"services" | "classes">;
  }): Promise<void>;
}
