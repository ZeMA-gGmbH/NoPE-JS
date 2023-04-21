/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2022-01-05 17:43:03
 * @modify date 2022-01-05 18:47:06
 * @desc [description]
 */

import { INopeCore, INopeModule } from ".";
import {
  IAvailableInstancesMsg,
  IInstanceCreationMsg,
} from "./nopeCommunication.interface";
import { INopeStatusInfo } from "./nopeConnectivityManager.interface";
import { IMapBasedMergeData } from "./nopeHelpers.interface";
import {
  IGenericNopeModule,
  INopeModuleDescription,
} from "./nopeModule.interface";
import { INopeObservable } from "./nopeObservable.interface";
import { ValidSelectorFunction } from "./nopeRpcManager.interface";

// Callback to create a INopeModule
export type TConstructorCallback<I extends INopeModule = INopeModule> = (
  core: INopeCore,
  identifier: string,
  ...args
) => Promise<I>;

// Callback to create a Wrapper for a Module
export type TGenerateWrapperCallback<I extends INopeModule = INopeModule> = (
  core: INopeCore,
  description: INopeModuleDescription,
  options: {
    linkProperties: boolean;
    linkEvents: boolean;
  },
  ...args
) => Promise<I>;

// Callback to check a valid Assignment
export type TValidAsssignmentChecker = (
  module: INopeModuleDescription,
  usedDispatcher: INopeStatusInfo
) => Promise<boolean>;

/**
 * A Manager, which is capable of creating instance on different Managers in the Network.
 *
 * It is defaultly implemented by {@link NopeInstanceManager}
 *
 * The `instanceManager` is used to create, remove and get access to instances. the approach is based on the object oriented method. I.e. there are the following elements:
 * - Classes:
 *  - These describe a blueprint of a behavior.
 *  - Are identified in `NoPE` by an ID / a `type`.
 *  - Classes have constructors that create an instance:
 *    - Offered in `NoPE` as a service (service name includes the identifier, among other things).
 * - Instances:
 *     - Are instances of a class (corresponds to so-called objects).
 *     - Are identified in `NoPE` by identifier (here `strings`)
 *     - have the properties, methods and eventEmitters created in the classes.
 *     - Can be "destroyed" via so-called destroyers. Thus they are deleted.
 *
 * The manager keeps track of the available instances in the network and allows to create `wrappers` for these instances. This allows to simplify and unify the access for the user of instances running in a different runtime. To make this possible it uses the following elements:
 * - `connectivityManager`: see above. Used to identify new and dead dispatchers.
 *     - if a new `dispatcher` is identified, standardized descriptions of all hosted instances are sent.
 *     - if a `dispatcher` is identified as dead, the `wrappers` are deleted or removed.
 * - rpcManager`: see above. Used here to distribute `constructors` of classes and `destructors` of instances on the network. I.e.:
 *     - The creation of a new instance corresponds to a service call.
 *     - Deleting an instance corresponds to a service call
 *     - The `constructors` of the classes and `destructors` of the instances follow a defined naming convention, so that they can be identified by the `instanceManager`.
 * The `InstanceManger` can be interacted with using the following methods and properties:
 * - `getInstancesOfType`: returns all available instances of a given type.
 * - `instanceExists`: tests if an instance with the given identifier exists.
 * - `getInstanceDescription`: Returns the standardized description of an instance. This information is also shared with all `instanceManagers` on the network.
 * - `registerInstance`: Allows to **manually** register an instance.
 * - `deleteInstance`: Allows the **manual** removal of an instance.
 * - `registerConstructor`: Registers a constructor. Among other things, it is possible to specify the number of instances that may be created on the `instanceManager`. If more than one `dispatcher` is able to create an instance with the given type, then - as with `rpcManger` - the selection follows via a so-called selector.
 * - `unregisterConstructor`: Removes a constructor.
 * - `constructorExists`: Tests if a constructor is known for a type.
 * - `createInstance`: Allows the creation of an instance. This may be the case for remote dispatchers or for the same element. Only a wrapper communicating with a dispatcher is returned, since we do not know where the element is provided. To know which `instanceManager` hosts the instance can use the `getDispatcherForInstance` method. The returned `wrapper` behaves like a normal "internal" class. If this method is called, a `GenericModule` is returned as type by default. If a special wrapper is required for a type, such wrappers can be defined and customized via `registerInternalWrapperGenerator` and `unregisterInternalWrapperGenerator`. Here, too, the type is decisive.
 *
 * # Example
 * ```typescript
 * // Describe the required Test:
 * let manager = new NopeInstanceManager(
 *   {
 *     communicator: getLayer("event", "", false),
 *     logger: false,
 *   },
 *   () => new NopeEventEmitter(),
 *   () => new NopeObservable(),
 *   async () => "test",
 *   "test",
 *   undefined,
 *   undefined,
 *   manager as any
 * );
 *
 * // Crate a sample Class we want to be able to create:
 * class TestModule extends NopeBaseModule {
 *
 *   public async dispose(): Promise<void> {
 *     await super.dispose();
 *     called = true;
 *   }
 *
 *   public async init(p1: string, p2: string): Promise<void> {
 *     this.author = {
 *       forename: "test",
 *       surename: "test",
 *       mail: "test",
 *     };
 *     this.version = {
 *       date: new Date(),
 *       version: 1,
 *     };
 *     this.description = "Sample Class";
 *     await super.init();
 *   }
 *
 * }
 *
 * await manager.ready.waitFor();
 *
 * // Now we register the constructor with the type 'TestModule'
 * await manager.registerConstructor(
 *    "TestModule",
 *    async (core, identifier) => {
 *      assert(
 *        identifier === "instance",
 *        "The identifier has not been transmitted"
 *      );
 *      return new TestModule(core);
 *    }
 * );
 *
 * // Check the Constructors
 * const constructors = manager.constructors.extractedKey;
 * expect(constructors).to.include("TestModule");
 * expect(manager.constructors.amountOf.get("TestModule")).to.be(1);
 * expect(manager.constructorExists("TestModule")).to.be.true;
 *
 * // Create an Instance:
 * const instance = await manager.createInstance<TestModule>({
 *   identifier: "instance",
 *   type: "TestModule",
 *   params: ["p1", "p2"],
 * });
 * ```
 *
 *
 * @author M.Karkowski
 * @export
 * @interface INopeInstanceManager
 */
export interface INopeInstanceManager {
  /**
   * Flag to indicate, that the system is ready.
   *
   * @author M.Karkowski
   * @type {INopeObservable<boolean>}
   * @memberof INopeInstanceManager
   */
  readonly ready: INopeObservable<boolean>;

  /**
   * Overview of the available Constructors in the
   * network.
   *
   * @author M.Karkowski
   * @type {IMapBasedMergeData<
   *     string,   // Dispatcher ID
   *     string,   // Dispatcher ID
   *     string[]  // Available Instances
   *   >}
   * @memberof INopeInstanceManager
   */
  readonly constructors: IMapBasedMergeData<
    string, // Dispatcher ID
    string[], // Available Generators of the Dispatcher
    string, // Dispatcher ID
    string // Generators-ID
  >;

  /**
   * Contains the rpcs used to create instances.
   */
  readonly constructorServices: INopeObservable<
    string[] // The Matching rpcs which will be used to create an instance.
  >;

  /**
   * Overview of the available instances in the network.
   *
   * - `OriginalKey` = `DispatcherID (string);`
   * - `OriginalValue` = `Available Instance Messages (IAvailableInstancesMsg);`
   * - `ExtractedKey` = `The name of the Instance (string);`
   * - `ExtractedValue` = `instance-description (INopeModuleDescription);`
   *
   *
   * @author M.Karkowski
   * @memberof INopeInstanceManager
   */
  readonly instances: IMapBasedMergeData<
    string, // Dispatcher ID
    IAvailableInstancesMsg, // Available Instance Messages
    string, // The name of the Instance?
    INopeModuleDescription // The instance-description
  >;

  /**
   * Contains the identifiers of the instances, which are hosted in the provided dispatcher.
   *
   * @author M.Karkowski
   * @type {INopeObservable<string[]>}
   * @memberof INopeInstanceManager
   */
  readonly internalInstances: INopeObservable<string[]>;

  /**
   * Registers a Constructor, that enables other NopeInstanceManagers to create an instance of the
   * given type. Therefore a callback "cb" is registered with the given "typeIdentifier".
   *
   * The function allways need as callback which must return a {@link INopeModule} (or an extension of it)
   *
   * # Example:
   * # Example
   * ```typescript
   * // Now we register the constructor with the type 'TestModule'
   * await manager.registerConstructor(
   *    "TestModule",
   *    async (core, identifier) => {
   *      assert(
   *        identifier === "instance",
   *        "The identifier has not been transmitted"
   *      );
   *      return new TestModule(core);
   *    }
   * );
   * ```
   *
   * @author M.Karkowski
   * @param {string} typeIdentifier The identifier for the Constructor (Like a service)
   * @param {TConstructorCallback<I>} cb The callback used, to create an instance.
   * @return {Promise<void>}
   * @memberof INopeInstanceManager
   */
  registerConstructor<I extends INopeModule = INopeModule>(
    typeIdentifier: string,
    cb: TConstructorCallback<I>
  ): Promise<void>;

  /**
   * Unregisters a present Constructor. After this, created instances are still valid, the user isnt
   * able to create new ones.
   *
   * @author M.Karkowski
   * @param {string} typeIdentifier The identifier for the Constructor (Like a service)
   * @return {Promise<void>}
   * @memberof INopeInstanceManager
   */
  unregisterConstructor(typeIdentifier: string): Promise<void>;

  /**
   * Allows to create an instance. This might be the case on remote dispatchers or
   * on the same element. Only a wrapper is returned, which communicates with a
   * dispatcher, because we dont know where the element is provided. To know which
   * `instanceManager` hosts the instance can use the  {@link INopeInstanceManager.getDispatcherForInstance} method.
   * The returned `wrapper` behaves like a normal "internal" class. If this method
   * is called, a `{@link IGenericNopeModule}` is returned as type by default. If a
   * special wrapper is required for a type, such wrappers can be defined and customized
   * via {@link INopeInstanceManager.registerInternalWrapperGenerator} and {@link INopeInstanceManager.unregisterInternalWrapperGenerator}.
   * Here, too, the type is decisive.   *
   *
   *
   * If there are multiple {@link INopeInstanceManager} able to create an instance,
   * the `selector` is used to select a `dispatcher`and  its instanceManger, to create
   * the instance.
   *
   * If the instances already exists and the type is matching, the `assignmentValid` callback
   * is used, to test if the required assignmet could be valid. E.g. you require the instance
   * to be hosted on a specific host. The `assignmentValid` will check if the assignment is valid.
   *
   * # Example
   * ```typescript   *
   * // Create an Instance:
   * const instance = await manager.createInstance<TestModule>({
   *   identifier: "instance",  // <- Must be provided
   *   type: "TestModule",      // <- Must be provided and present in the Network
   *   params: ["p1", "p2"],    // <- Optional. The Parameters, required by the class to initialize see {@link INopeModule.init}
   * });
   * ```
   *
   * @author M.Karkowski
   * @template I The Type of the Return type.
   * @return {Promise<I>}
   * @memberof INopeInstanceManager
   */
  createInstance<I = IGenericNopeModule>(
    /**
     * Description requrired to create the Message (see {@link IInstanceCreationMsg}).
     * The properties `type` and `identifier` **must** be provided.
     */
    description: Partial<IInstanceCreationMsg>,
    /**
     * Additional Options used during creating the Instance
     */
    options?: {
      /**
       * If there are multiple {@link INopeInstanceManager} able to create an instance,
       * the `selector` is used to select a `dispatcher`and  its instanceManger, to create
       * the instance.
       */
      selector?: ValidSelectorFunction;
      /**
       * If the instances already exists and the type is matching, the `assignmentValid` callback
       * is used, to test if the required assignmet could be valid. E.g. you require the instance
       * to be hosted on a specific host. The `assignmentValid` will check if the assignment is valid.
       */
      assignmentValid?: TValidAsssignmentChecker;
      /**
       * Flag to link the properties. Defaults to true. Should not be touched.
       * can be used, if e.g. only methods of an instance are relevant.
       */
      linkProperties?: boolean;
      /**
       * Flag to link the events. Defaults to true. Should not be touched.
       * can be used, if e.g. only methods of an instance are relevant.
       */
      linkEvents?: boolean;
    }
  ): Promise<I & IGenericNopeModule>;

  /**
   * Manual function, used to generate a Wrapper. This should only be called, when instances are
   * registerd with {@link NopeInstanceManager.registerInstance} is used and you are shure, that
   * the instance is created manually. Please allways prefer to use {@link NopeInstanceManager.createInstance}
   * @param description
   */
  generateWrapper<I = IGenericNopeModule>(
    description: Partial<IInstanceCreationMsg>
  ): Promise<I & IGenericNopeModule>;

  /**
   * Creates Wrappers for the Type of the given element.
   * @param type
   */
  getInstancesOfType<I = IGenericNopeModule>(
    type: string
  ): Promise<(I & IGenericNopeModule)[]>;

  /**
   * Defaultly a generic wrapper will be returned, when an instance is created. you
   * can specifiy specific wrapper type for different "typeIdentifier" with this method.
   *
   * @author M.Karkowski
   * @param {string} typeIdentifier The identifier for the Constructor (Like a service)
   * @param {TGenerateWrapperCallback<I>} cb The Callback which creates the specific wrapper.
   * @memberof INopeInstanceManager
   */
  registerInternalWrapperGenerator(
    typeIdentifier: string,
    cb: TGenerateWrapperCallback
  ): void;

  /**
   * Removes a specific generator for for a wrapper.
   *
   * @author M.Karkowski
   * @param {string} typeIdentifier The identifier for the Constructor (Like a service)
   * @memberof INopeInstanceManager
   */
  unregisterInternalWrapperGenerator(typeIdentifier: string): void;

  /**
   * Helper, to test if an instance with the given identifier exists or not.
   *
   * @author M.Karkowski
   * @param {string} instanceIdentifier identifier of the instance.
   * @return {boolean} Result
   * @memberof INopeInstanceManager
   */
  instanceExists(instanceIdentifier: string): boolean;

  /**
   * Helper to test if a constructor linkt to the provided "typeIdentifier" exists or not.
   *
   * @author M.Karkowski
   * @param {string} typeIdentifier The identifier for the Constructor (Like a service)
   * @return {boolean} Result
   * @memberof INopeInstanceManager
   */
  constructorExists(typeIdentifier: string): boolean;

  /**
   * Returns the hosting dispatcher for the given instance.
   *
   * @author M.Karkowski
   * @param {string} instanceIdentifier The identifier for instance (its name)
   * @return {(INopeStatusInfo | false)} The Status or false if not present.
   * @memberof INopeInstanceManager
   */
  getManagerOfInstance(instanceIdentifier: string): INopeStatusInfo | false;

  /**
   * Returns the instance Description for a specific instance. It is just a simplified wrapper
   * for the "instances"-property.
   *
   * @author M.Karkowski
   * @param {string} instanceIdentifier The identifier for instance (its name)
   * @return {(INopeModuleDescription | false)}
   * @memberof INopeInstanceManager
   */
  getInstanceDescription(
    instanceIdentifier: string
  ): INopeModuleDescription | false;

  /**
   * Option, to statically register an instance, without using an specific generator etc.
   * This instance is just present in the network.
   *
   * @author M.Karkowski
   * @template I
   * @param {I} instance The Instance to consider
   * @return {Promise<I>}
   * @memberof INopeInstanceManager
   */
  registerInstance<I extends INopeModule = INopeModule>(
    instance: I
  ): Promise<I>;

  /**
   * Disposes an instance and removes it. Thereby the Instance wont be available for other
   * InstanceManagers in the system.
   *
   * @author M.Karkowski
   * @template I
   * @param {(I | string)} instance The Instance to consider
   * @return {Promise<boolean>}
   * @memberof INopeInstanceManager
   */
  deleteInstance<I extends INopeModule = INopeModule>(
    instance: I | string
  ): Promise<boolean>;

  /**
   * Resets the Instance Manager.
   *
   * @author M.Karkowski
   * @memberof INopeInstanceManager
   */
  reset(): void;

  /**
   * Disposes all instances and the Manager.
   *
   * @author M.Karkowski
   * @return {Promise<void>}
   * @memberof INopeInstanceManager
   */
  dispose(): Promise<void>;

  /**
   * Description of an Instance-Manager
   */
  toDescription(): {
    constructors: {
      all: string[];
      internal: string[];
    };
    instances: {
      all: INopeModuleDescription[];
      internal: string[];
    };
  };
}
