/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { ILogger } from "js-logger";
import { waitFor } from "../../helpers/async";
import { generateId } from "../../helpers/idMethods";
import { MapBasedMergeData } from "../../helpers/mergedData";
import { generateHash } from "../../helpers/hash";
import { SPLITCHAR } from "../../helpers/objectMethods";
import { varifyPath } from "../../helpers/path";
import { defineNopeLogger } from "../../logger/getLogger";
import { DEBUG, ERROR } from "../../logger/index.browser";
import { NopeGenericWrapper } from "../../module/index";
import { NopeObservable } from "../../observables";
import {
  IAvailableInstancesMsg,
  ICommunicationBridge,
  IDisposeInstanceMsg,
  IGenericNopeModule,
  IInstanceCreationMsg,
  IInstanceDescriptionMsg,
  IMapBasedMergeData,
  INopeConnectivityManager,
  INopeCore,
  INopeDispatcherOptions,
  INopeEventEmitter,
  INopeModule,
  INopeModuleDescription,
  INopeObservable,
  INopeRpcManager,
  INopeStatusInfo,
  TValidAsssignmentChecker,
  ValidSelectorFunction,
} from "../../types/nope";
import {
  INopeInstanceManager,
  TConstructorCallback,
  TGenerateWrapperCallback,
} from "../../types/nope/nopeInstanceManager.interface";
import { NopeConnectivityManager } from "../ConnectivityManager";
import { NopeRpcManager } from "../RpcManager/NopeRpcManager";
import { registerGarbageCallback } from "../../helpers/gc";

/**
 * Please checkout the Docu of {@link INopeInstanceManager}
 */
export class NopeInstanceManager implements INopeInstanceManager {
  protected _logger: ILogger;

  /**
   * The used Communication interface
   *
   */
  protected readonly _communicator: ICommunicationBridge;

  /**
   * Flag to indicate, that the system is ready.
   *
   * @author M.Karkowski
   * @type {INopeObservable<boolean>}
   * @memberof NopeInstanceManager
   */
  public readonly ready: INopeObservable<boolean>;

  /**
   * Element holding the Mapping of the Dispatcher and its instance
   * generators
   *
   * Key = Dispatcher-ID
   * Value = Available Generators
   *
   * @protected
   * @type {Map<
   *     string,
   *     IAvailableInstanceGeneratorsMsg
   *   >}
   * @memberof NopeInstanceManager
   */
  protected _mappingOfRemoteDispatchersAndGenerators: Map<string, string[]>;

  protected _internalWrapperGenerators: Map<
    string,
    TGenerateWrapperCallback<INopeModule>
  >;

  protected _registeredConstructors: Map<
    string,
    (...args: any[]) => Promise<IInstanceDescriptionMsg>
  >;

  protected _instances: Map<
    string,
    {
      instance: INopeModule;
      usedBy: Array<string>;
      manual?: boolean;
    }
  >;

  protected _internalInstances: Set<string>;

  protected _mappingOfRemoteDispatchersAndInstances: Map<
    string,
    IAvailableInstancesMsg
  >;
  protected _externalInstancesNames: Set<string>;
  protected _externalInstances: Map<string, INopeModuleDescription>;
  protected _initializingInstance: Map<string, string>;

  /**
   * Element showing the available services.
   * Its more or less a map, that maps the
   * services with their dispatchers.
   *
   * T = services name.
   * K = dispatcher - ids
   *
   * @author M.Karkowski
   * @type {IMapBasedMergeData<string>}
   * @memberof NopeInstanceManager
   */
  public readonly constructors: IMapBasedMergeData<
    string, // Dispatcher ID
    string[],
    string, // Dispatcher ID
    string // Available Instances
  >;

  /**
   * Element showing the available instances.
   * Its more or less a map, that maps the
   * instances with their dispatchers.
   *
   * - `originalKey` = DispatcherID (`string`);
   * - `originalValue` = Available Instance Messages (`IAvailableInstancesMsg`);
   * - `extractedKey` = The name of the Instance (`string`);`
   * - `extractedValue` = instance-description (`INopeModuleDescription`);
   *
   * @author M.Karkowski
   * @type {IMapBasedMergeData<
   *     string,
   *     string,
   *     IAvailableInstancesMsg
   *   >}
   * @memberof NopeInstanceManager
   */
  public readonly instances: IMapBasedMergeData<
    string, // Dispatcher ID
    IAvailableInstancesMsg, // Available Instance Messages
    string, // The name of the Instance?
    INopeModuleDescription // The instance-description
  >;

  public readonly constructorServices: INopeObservable<
    string[] // The Matching rpcs which will be used to create an instance.
  >;

  /**
   * Contains the identifiers of the instances, which are hosted in the provided dispatcher.
   *
   * @author M.Karkowski
   * @type {INopeObservable<string[]>}
   * @memberof NopeInstanceManager
   */
  public readonly internalInstances: INopeObservable<string[]>;

  /**
   * Create the Instance Manager.
   */
  constructor(
    public options: INopeDispatcherOptions,
    protected _generateEmitter: <T>() => INopeEventEmitter<T>,
    protected _generateObservable: <T>() => INopeObservable<T>,
    protected _defaultSelector: ValidSelectorFunction,
    protected readonly _id: string = null,
    protected _connectivityManager: INopeConnectivityManager = null,
    protected _rpcManager: INopeRpcManager = null,
    protected _core: INopeCore = null
  ) {
    this._communicator = options.communicator;

    if (_id == null) {
      this._id = generateId();
    }

    if (_connectivityManager == null) {
      // Creating a new Status-Manager.
      this._connectivityManager = new NopeConnectivityManager(
        options,
        _generateObservable,
        this._id
      );
    }

    if (_rpcManager == null) {
      // Creating a new Status-Manager.
      this._rpcManager = new NopeRpcManager(
        options,
        _generateObservable,
        this._defaultSelector,
        this._id
      );
    }

    this._logger = defineNopeLogger(options.logger, `core.instance-manager`);

    // Flag to show if the system is ready or not.
    this.ready = this._generateObservable();
    this.ready.setContent(false);

    this.constructorServices = this._generateObservable();
    this.constructorServices.setContent([]);

    // Define teh constructors
    const _this = this;
    this._mappingOfRemoteDispatchersAndGenerators = new Map();
    this.constructors = new MapBasedMergeData(
      this._mappingOfRemoteDispatchersAndGenerators,
      "+",
      "+"
    ) as MapBasedMergeData<string, string[], string, string>;

    this._mappingOfRemoteDispatchersAndInstances = new Map();
    this.instances = new MapBasedMergeData(
      this._mappingOfRemoteDispatchersAndInstances,
      "instances/+",
      "instances/+/identifier"
    );

    this.internalInstances = new NopeObservable();
    this.internalInstances.setContent([]);

    const ctorStart = `nope${SPLITCHAR}core${SPLITCHAR}constructor${SPLITCHAR}`;

    // We will subscribe to some generators.
    this._rpcManager.services.data.subscribe((_) => {
      // Clear the Mapping of the Generators
      _this._mappingOfRemoteDispatchersAndGenerators.clear();

      const constructorServices = new Set<string>();

      for (const [
        dispatcher,
        services,
      ] of _this._rpcManager.services.originalData.entries()) {
        // Filter the Generators based on the existing services
        const generators = services.services
          .filter((item) => {
            if (item?.id.startsWith(ctorStart)) {
              constructorServices.add(item.id);
              return true;
            }
            return false;
          })
          .map((item) => {
            return item.id.slice(ctorStart.length);
          });

        // If the Dispatcher has a generator we will add it.
        if (generators.length) {
          _this._mappingOfRemoteDispatchersAndGenerators.set(
            dispatcher,
            generators
          );
        }
      }

      // Update the Generators
      _this.constructorServices.setContent(Array.from(constructorServices));
      _this.constructors.update();
    });

    if (this._logger) {
      this._logger.info("core.instance-manager online");
    }

    this.reset();
    this._init().catch((error) => {
      if (_this._logger) {
        _this._logger.error("Failed to intialize the Dispatcher", error);
      }
    });

    registerGarbageCallback(this, this.dispose.bind(this));
  }

  /**
   * Update the Available Instances
   *
   * @protected
   * @memberof NopeInstanceManager
   */
  protected async _sendAvailableInstances(): Promise<void> {
    const _this = this;
    // Update the Instances provided by this module.
    await this._communicator.emit("instancesChanged", {
      dispatcher: this._id,
      // We will send the descriptions.
      instances: Array.from(this._internalInstances).map((identifier) => {
        // Generate the Module Description for every identifier:
        return _this._instances.get(identifier).instance.toDescription();
      }),
    });

    // Update the Instances
    this.internalInstances.setContent(Array.from(this._internalInstances));
  }

  /**
   * Internal Function, used to initialize the Dispatcher.
   * It subscribes to the "Messages" of the communicator.
   *
   * @protected
   * @memberof NopeInstanceManager
   */
  protected async _init(): Promise<void> {
    const _this = this;

    // Wait until the Element is connected.
    await this._communicator.connected.waitFor();
    await this._connectivityManager.ready.waitFor();
    await this._rpcManager.ready.waitFor();

    this.registerInternalWrapperGenerator(
      "*",
      async (dispather, description, options) => {
        const mod = new NopeGenericWrapper(
          dispather,
          _this._generateEmitter,
          _this._generateObservable,
          options.linkProperties,
          options.linkEvents
        );
        await mod.fromDescription(description, "overwrite");
        return mod;
      }
    );

    await this._communicator.on("bonjour", (msg) => {
      if (msg.dispatcherId !== _this._id) {
        // If there are dispatchers online,
        // We will emit our available services.
        _this
          ._sendAvailableInstances()
          .then((_) => {})
          .catch((e) => {
            if (_this._logger?.enabledFor(ERROR)) {
              // If there is a Logger:
              _this._logger.error(
                `Dispatcher "${_this._id}" failed to emit available instances`
              );
            }
          });
      }
    });

    // We will use our status-manager to listen to changes.
    this._connectivityManager.dispatchers.onChange.subscribe((changes) => {
      if (changes.added.length) {
        // If there are dispatchers online,
        // We will emit our available services.
        _this._sendAvailableInstances().catch((e) => {
          if (_this._logger) {
            _this._logger.error("Failed to emit the available instance");
            _this._logger.error(e);
          }
        });
      }
      if (changes.removed.length) {
        // Remove the dispatchers.
        changes.removed.map((id) => {
          _this.removeDispatcher(id);
        });
      }
    });

    // Listen to newly created instances.
    await this._communicator.on("instancesChanged", (message) => {
      // Store the instances:
      _this._mappingOfRemoteDispatchersAndInstances.set(
        message.dispatcher,
        message
      );
      // Update the Mapping:
      _this.instances.update();

      if (_this._logger?.enabledFor(DEBUG)) {
        // If there is a Logger:
        _this._logger.debug(
          'Remote Dispatcher "' +
            message.dispatcher +
            '" updated its available instances'
        );
      }
    });

    if (this._logger) {
      this._logger.info("core.instance-manager", this._id, "initialized");
    }

    this.ready.setContent(true);
  }

  /**
   * Helper to get the corresponding Service name
   * @param {string} name  name
   * @param {"constructor" | "dispose"} type The desired type of the requested service name
   * @returns {string} the name.
   */
  public getServiceName(name: string, type: "constructor" | "dispose") {
    switch (type) {
      case "constructor":
        return `nope${SPLITCHAR}core${SPLITCHAR}constructor${SPLITCHAR}${name}`;
      case "dispose":
        return `nope${SPLITCHAR}core${SPLITCHAR}destructor${SPLITCHAR}${name}`;
      default:
        throw Error("The given type is not correct.");
    }
  }

  /**
   * Function, that will extract the information of the instance and the
   * the providing dispatcher.
   *
   * @author M.Karkowski
   * @param {string} identifier The identifier of instance
   * @return {*}  {(INopeModuleDescription & { dispatcher: IDispatcherInfo })}
   * @memberof nopeDispatcher
   */
  protected _getInstanceInfo(identifier: string):
    | {
        description: INopeModuleDescription;
        dispatcher: INopeStatusInfo;
      }
    | undefined {
    // First check if the instance exists.
    if (!this.instanceExists(identifier, false)) {
      return undefined;
    }

    // Define the return type
    const ret: {
      description: INopeModuleDescription;
      dispatcher: INopeStatusInfo;
    } = {} as any;

    // First we check if we are taking care of an internal instance, if so
    // we will use this instance to enrich the description, otherwise, we
    // will look in the external instances.
    if (this._instances.has(identifier)) {
      ret.description = this._instances
        .get(identifier)
        .instance.toDescription();
    } else {
      // Now extract teh
      for (const item of this._mappingOfRemoteDispatchersAndInstances.values()) {
        const instances = item.instances;
        for (const instance of instances) {
          if (instance.identifier == identifier) {
            ret.description = instance;
            break;
          }
        }
      }
    }
    // Additionally add some information about the used dispatcher.
    ret.dispatcher = this.getManagerOfInstance(identifier);

    return ret;
  }

  /**
   * Helper to remove a dispatcher.
   *
   * @author M.Karkowski
   * @param {string} dispatcher
   * @memberof NopeRpcIn
   */
  public removeDispatcher(dispatcher: string): void {
    // Delete the Generators of the Instances.
    this._mappingOfRemoteDispatchersAndInstances.delete(dispatcher);
    this.instances.update();

    // Now we need to delete every Instance of the dispatcher.
    // All open calls will be handeled by the RpcManager.

    // TODO:
    // this.cancelRunningTasksOfDispatcher(
    //   dispatcher,
    //   new Error(
    //     "Dispatcher has been removed! Tasks cannot be executed any more."
    //   )
    // );
  }

  // See interface description
  public async registerConstructor<I extends INopeModule>(
    identifier: string,
    cb: TConstructorCallback<I>
  ): Promise<void> {
    const _this = this;

    if (this._logger?.enabledFor(DEBUG)) {
      this._logger.debug(
        'Adding instance generator for "' +
          identifier +
          '" to external Generators. Other Elements can now create instances of this type.'
      );
    }

    const _cb = await this._rpcManager.registerService(
      async (data: IInstanceCreationMsg) => {
        // Check if an instance exists or not.
        // if not => create an instance an store it.
        if (!_this._instances.has(data.identifier)) {
          const hashable = [data.identifier, data.params, data.type];
          const hash = generateHash(hashable);

          // It might happen, that an instance is requested multiple times.
          // therefore we have to make shure, we wont create them multiple times:
          // We will test it by using the "_internalInstances" set
          if (!_this._initializingInstance.has(data.identifier)) {
            // Mark the Instance as available.
            _this._initializingInstance.set(data.identifier, hash);

            try {
              // Create an Instance
              const _instance = await cb(_this._core, data.identifier);
              _instance.identifier = data.identifier;

              // Make shure the Data is expressed as Array.
              if (!Array.isArray(data.params)) {
                data.params = [data.params];
              }

              // Initialize the instance with the parameters.
              await _instance.init(...data.params);

              // A Function is registered, taking care of removing
              // an instances, if it isnt needed any more.
              await _this._rpcManager.registerService(
                async (_data: IDisposeInstanceMsg) => {
                  if (_this._instances.get(data.identifier)?.usedBy) {
                    // Get the Index of the dispatcher, which is using
                    // the element
                    const idx = _this._instances
                      .get(data.identifier)
                      .usedBy.indexOf(_data.dispatcherId);

                    if (idx > -1) {
                      _this._instances
                        .get(data.identifier)
                        .usedBy.splice(idx, 1);
                    }

                    if (
                      _this._instances.get(data.identifier).usedBy.length == 0
                    ) {
                      // Unmark as internal instance
                      _this._internalInstances.delete(data.identifier);

                      // Remove the Instance.
                      await _instance.dispose();

                      // Delete the Entry.
                      _this._instances.delete(data.identifier);

                      // Remove the Function itself
                      _this._rpcManager.unregisterService(
                        _this.getServiceName(data.identifier, "dispose")
                      );

                      // Emit the instances again
                      await _this._sendAvailableInstances();
                    }
                  }
                },
                {
                  id: _this.getServiceName(data.identifier, "dispose"),
                  schema: {
                    description: `Service, which will destructor for the instance "${data.identifier}". This function will be called internal only.`,
                    type: "function",
                  },
                }
              );

              // Store the Instance.
              _this._instances.set(data.identifier, {
                instance: _instance,
                usedBy: [data.dispatcherId],
              });

              _this._internalInstances.add(data.identifier);

              // Update the available instances:
              await _this._sendAvailableInstances();

              // Make shure, we remove this instance.hash
              _this._initializingInstance.delete(data.identifier);
            } catch (e) {
              // Make shure, we remove this instance.hash
              _this._initializingInstance.delete(data.identifier);

              // Rerise the error
              throw e;
            }
          } else if (_this._initializingInstance.get(data.identifier) != hash) {
            throw Error(
              "Providing different Parameters for the same Identifier"
            );
          } else {
            // Check if the Instance is ready.
            let firstHint = true;
            await waitFor(
              () => {
                if (firstHint) {
                  _this._logger.warn(
                    `Parallel request for the same Instance "${data.identifier}" => Waiting until the Instance has been initialized`
                  );
                  firstHint = false;
                }
                return _this._instances.has(data.identifier);
              },
              {
                testFirst: true,
                delay: 100,
              }
            );
          }
        } else {
          // If an Element exists => Add the Element.
          _this._instances.get(data.identifier).usedBy.push(data.dispatcherId);
        }

        // Define the Response.
        const response: IInstanceDescriptionMsg = {
          description: _this._instances
            .get(data.identifier)
            .instance.toDescription(),
          type: data.type,
        };

        // Send the Response
        return response;
      },
      {
        // We will add the Name to our service.
        id: this.getServiceName(identifier, "constructor"),
        // We dont want to add a prefix
        addNopeServiceIdPrefix: false,
        schema: {
          description: `Service, which will create an construtor for the type "${identifier}".`,
          type: "function",
        },
      }
    );

    // Store the Generator.
    this._registeredConstructors.set(identifier, _cb);
    // TODO: Send an update.
  }

  // See interface description
  public async unregisterConstructor(identifier: string): Promise<void> {
    if (this._registeredConstructors.has(identifier)) {
      if (this._logger?.enabledFor(DEBUG)) {
        this._logger.debug(
          'Removing instance generator for "' +
            identifier +
            '" from external Generators. Other Elements cant create instances of this type anymore.'
        );
      }

      // We will just unregister the service from our
      // system. Therefore we just use the rpcManager
      await this._rpcManager.unregisterService(
        this._registeredConstructors.get(identifier)
      );
      this._registeredConstructors.delete(identifier);
    }
  }

  // See interface description
  public registerInternalWrapperGenerator<I extends INopeModule>(
    identifier: string,
    cb: TGenerateWrapperCallback<I>
  ): void {
    if (this._logger?.enabledFor(DEBUG)) {
      this._logger.debug(
        'Adding instance generator for "' +
          identifier +
          '" as internal Generator. This Generator wont be used externally.'
      );
    }
    this._internalWrapperGenerators.set(identifier, cb);
  }

  // See interface description
  public unregisterInternalWrapperGenerator(identifier: string): void {
    if (this._logger?.enabledFor(DEBUG)) {
      this._logger.debug(
        'Rmoving instance generator for "' +
          identifier +
          '" from internal Generator. The sytem cant create elements of this type any more.'
      );
    }
    this._internalWrapperGenerators.delete(identifier);
  }

  // See interface description
  public instanceExists(identifier: string, externalOnly = true): boolean {
    if (!this.instances.simplified.has(identifier)) {
      return false;
    }

    if (externalOnly) {
      const manager = this.getManagerOfInstance(identifier);
      return manager.id !== this._id;
    }

    return true;
  }

  // See interface description
  public getManagerOfInstance(identifier: string): INopeStatusInfo | undefined {
    // First we will check if the instance is available internally.
    if (this._internalInstances.has(identifier)) {
      return this._connectivityManager.info;
    }

    // If that isnt the case, we will check all dispatchers and search the instance.
    for (const [
      dispatcher,
      msg,
    ] of this._mappingOfRemoteDispatchersAndInstances.entries()) {
      for (const instance of msg.instances) {
        if (instance.identifier == identifier) {
          return this._connectivityManager.getStatus(dispatcher);
        }
      }
    }

    return undefined;
  }

  // See interface description
  public getInstanceDescription(
    instanceIdentifier: string
  ): false | INopeModuleDescription {
    if (this._instances.has(instanceIdentifier)) {
      return this._instances.get(instanceIdentifier).instance.toDescription();
    }

    for (const {
      instances,
    } of this._mappingOfRemoteDispatchersAndInstances.values()) {
      for (const instance of instances) {
        if (instance.identifier === instanceIdentifier) {
          return instance;
        }
      }
    }

    return false;
  }

  // See interface description
  public constructorExists(typeIdentifier: string): boolean {
    return this.constructors.data.getContent().includes(typeIdentifier);
  }

  public async generateWrapper<I = IGenericNopeModule>(
    description: Partial<IInstanceCreationMsg>
  ): Promise<I & IGenericNopeModule> {
    // Define the Default Description
    // which will lead to an error.
    const _defDescription: IInstanceCreationMsg = {
      dispatcherId: this._id,
      identifier: "error",
      params: [],
      type: "unkown",
    };

    // Assign the provided Description
    const _description = Object.assign(_defDescription, description, {
      dispatcherId: this._id,
    }) as IInstanceCreationMsg;

    // Check if the description is complete
    if (
      _defDescription.type === "unkown" ||
      _description.identifier === "error"
    ) {
      throw Error(
        'Please Provide at least a "type" and "identifier" in the paremeters'
      );
    }

    // Use the varified Name (removes the invalid chars.)
    _defDescription.identifier = this.options.forceUsingValidVarNames
      ? varifyPath(_defDescription.identifier)
      : _defDescription.identifier;

    if (this._logger?.enabledFor(DEBUG)) {
      this._logger.debug(
        'Requesting an wrapper of type: "' +
          _defDescription.type +
          '" with the identifier: "' +
          _defDescription.identifier +
          '"'
      );
    }

    try {
      let _type = _description.type;

      if (!this._internalWrapperGenerators.has(_type)) {
        // No default type is present for a remote
        // => assing the default type which is "*""
        _type = "*";
      }

      if (this._internalWrapperGenerators.has(_type)) {
        if (this._logger?.enabledFor(DEBUG)) {
          this._logger.debug(
            'No instance with the identifiert: "' +
              _defDescription.identifier +
              '" found, but an internal generator is available. Using the internal one for creating the instance and requesting the "real" instance externally'
          );
        }

        // Now test if there is allready an instance with this name and type.
        // If so, we check if we have the correct type etc. Additionally we
        // try to extract its dispatcher-id and will use that as selector
        // to allow the function be called.
        const _instanceDetails = this._getInstanceInfo(_description.identifier);
        if (
          _instanceDetails !== undefined &&
          _instanceDetails?.description.type !== _description.type
        ) {
          throw Error(
            "There exists an Instance named: '" +
              _description.identifier +
              "' but it uses a different type. Requested type: '" +
              _description.type +
              "', given type: '" +
              _instanceDetails?.description.type +
              "'"
          );
        } else if (_instanceDetails === undefined) {
          throw Error(
            `No instance known with the idenfitier '${_description.identifier}'`
          );
        }

        const definedInstance = _instanceDetails.description;

        // Create the Wrapper for our instance.
        const wrapper = (await this._internalWrapperGenerators.get(_type)(
          this._core,
          definedInstance,
          {
            linkEvents: true,
            linkProperties: true,
          }
        )) as IGenericNopeModule;

        if (this._logger?.enabledFor(DEBUG)) {
          this._logger.debug(
            `Created a Wrapper for the instance "${definedInstance.identifier}"`
          );
        }

        // Make shure, that the wrapper is handled correctly.
        registerGarbageCallback(wrapper, wrapper.dispose.bind(wrapper));

        return wrapper as I & IGenericNopeModule;
      }

      throw Error("No internal generator Available!");
    } catch (e) {
      if (this._logger) {
        this._logger.error(
          "During creating an Instance, the following error Occurd"
        );
        this._logger.error(e);
      }
      throw e;
    }
  }

  // See interface description
  public async createInstance<I = IGenericNopeModule>(
    description: Partial<IInstanceCreationMsg>,
    options: {
      selector?: ValidSelectorFunction;
      assignmentValid?: TValidAsssignmentChecker;
      linkProperties?: boolean;
      linkEvents?: boolean;
    } = {}
  ): Promise<I & IGenericNopeModule> {
    const _this = this;

    // Define the Default Description
    // which will lead to an error.
    const _defDescription: IInstanceCreationMsg = {
      dispatcherId: this._id,
      identifier: "error",
      params: [],
      type: "unkown",
    };

    // Assign the provided Description
    const _description = Object.assign(_defDescription, description, {
      dispatcherId: this._id,
    }) as IInstanceCreationMsg;

    // Check if the description is complete
    if (
      _defDescription.type === "unkown" ||
      _description.identifier === "error"
    ) {
      throw Error(
        'Please Provide at least a "type" and "identifier" in the paremeters'
      );
    }

    // Use the varified Name (removes the invalid chars.)
    _defDescription.identifier = this.options.forceUsingValidVarNames
      ? varifyPath(_defDescription.identifier)
      : _defDescription.identifier;

    if (this._logger?.enabledFor(DEBUG)) {
      this._logger.debug(
        'Requesting an Instance of type: "' +
          _defDescription.type +
          '" with the identifier: "' +
          _defDescription.identifier +
          '"'
      );
    }

    try {
      let _type = _description.type;

      if (!this._internalWrapperGenerators.has(_type)) {
        // No default type is present for a remote
        // => assing the default type which is "*""
        _type = "*";
      }

      if (!this.constructorExists(_description.type)) {
        throw Error(
          'Generator "' + _description.type + '" isnt present in the network!'
        );
      }

      if (this._internalWrapperGenerators.has(_type)) {
        if (this._logger?.enabledFor(DEBUG)) {
          this._logger.debug(
            'No instance with the identifiert: "' +
              _defDescription.identifier +
              '" found, but an internal generator is available. Using the internal one for creating the instance and requesting the "real" instance externally'
          );
        }

        // Now test if there is allready an instance with this name and type.
        // If so, we check if we have the correct type etc. Additionally we
        // try to extract its dispatcher-id and will use that as selector
        // to allow the function be called.
        const _instanceDetails = this._getInstanceInfo(_description.identifier);
        if (
          _instanceDetails !== undefined &&
          _instanceDetails?.description.type !== _description.type
        ) {
          throw Error(
            "There exists an Instance named: '" +
              _description.identifier +
              "' but it uses a different type. Requested type: '" +
              _description.type +
              "', given type: '" +
              _instanceDetails?.description.type +
              "'"
          );
        }

        const usedDispatcher = _instanceDetails?.dispatcher.id;

        if (usedDispatcher && options.assignmentValid) {
          // If we have an dispatcher, which was been used to create the instance,
          // we have to check, the selected Dispatcher Matches our criteria.
          if (
            !(await options.assignmentValid(
              _instanceDetails.description,
              _instanceDetails.dispatcher
            ))
          ) {
            throw Error("Assignment is invalid.");
          }
        }

        const definedInstance =
          await this._rpcManager.performCall<IInstanceDescriptionMsg>(
            // Extract our Service Name:
            this.getServiceName(_description.type, "constructor"),
            // We will use our Description as Parameter.
            [_description],
            // Additionally we share the options:
            options
          );

        if (this._logger?.enabledFor(DEBUG)) {
          this._logger.debug(
            `Received a description for the instance "${definedInstance.description.identifier}"`
          );
        }

        // Create the Wrapper for our instance.
        const wrapper = (await this._internalWrapperGenerators.get(_type)(
          this._core,
          definedInstance.description,
          {
            linkEvents:
              typeof options.linkEvents === "boolean"
                ? options.linkEvents
                : true,
            linkProperties:
              typeof options.linkProperties === "boolean"
                ? options.linkProperties
                : true,
          }
        )) as IGenericNopeModule;

        if (this._logger?.enabledFor(DEBUG)) {
          this._logger.debug(
            `Created a Wrapper for the instance "${definedInstance.description.identifier}"`
          );
        }

        const originalDispose = wrapper.dispose;
        let called = false;

        wrapper.dispose = async () => {
          if (!called) {
            // Remember, that we have called the method.
            called = true;
            // Now lets delete the instance.
            await _this.deleteInstance(_description.identifier, false, false);
            // Apply the original Callback.
            await originalDispose.apply(wrapper);
          }
        };

        // Make shure, that the wrapper is handled correctly.
        registerGarbageCallback(wrapper, wrapper.dispose.bind(wrapper));

        return wrapper as I & IGenericNopeModule;
      }

      throw Error("No internal generator Available!");
    } catch (e) {
      if (this._logger) {
        this._logger.error(
          "During creating an Instance, the following error Occurd"
        );
        this._logger.error(e);
      }
      throw e;
    }
  }

  // See interface description
  public async registerInstance<I extends INopeModule>(
    instance: I
  ): Promise<I> {
    // Store the Instances.
    this._instances.set(instance.identifier, {
      instance,
      usedBy: [],
      manual: true,
    });

    this._internalInstances.add(instance.identifier);

    await this._sendAvailableInstances();

    return instance;
  }

  // See interface description
  public async deleteInstance<I extends INopeModule>(
    instance: I | string,
    preventSendingUpdate = false,
    callInstanceDispose = true
  ): Promise<boolean> {
    // Block to find the instance.
    // Based on the property (string or instance)
    // the corresponding instance object has to be select.
    let _instance: { instance: INopeModule; usedBy: Array<string> };
    let _identifier: string;
    if (typeof instance === "string") {
      _instance = this._instances.get(instance);
      _identifier = instance;
    } else {
      for (const data of this._instances.values()) {
        if (instance == data.instance) {
          _instance = data;
          _identifier = data.instance.identifier;
          break;
        }
      }
    }

    try {
      const params: IDisposeInstanceMsg = {
        dispatcherId: this._id,
        identifier: _identifier,
      };

      // Call the corresponding Dispose Function for the "real" instance
      // All other elements are just accessors.
      await this._rpcManager.performCall(
        // Extract our Service Name:
        this.getServiceName(_identifier, "dispose"),
        // We will use our Description as Parameter.
        [params]
      );
    } catch (e) {
      // Only if it is an internal
      // Instance, we do not want to
      // throw that error, otherwise
      // we want that error to be
      // present.
      if (_instance) {
      } else {
        throw e;
      }
    }

    // if the instance has been found => delete the instance.
    if (_instance) {
      _instance.usedBy.pop();

      if (_instance.usedBy.length === 0) {
        // Delete the Identifier
        this._instances.delete(_instance.instance.identifier);

        // Check if an update should be emitted or not.
        if (!preventSendingUpdate) {
          // Update the Instances provided by this module.
          await this._sendAvailableInstances();
        }

        if (callInstanceDispose) {
          // Dispose the Handler;
          await _instance.instance.dispose();
        }
      }

      return true;
    } else {
    }
    return false;
  }

  // See interface description
  public async getInstancesOfType<I extends INopeModule>(
    type: string
  ): Promise<I[]> {
    const indentifier = this.instances.data
      .getContent()
      .filter((item) => {
        return item.type == type;
      })
      .map((item) => {
        return item.identifier;
      });

    const promises: Promise<I>[] = [];

    for (const identifier of indentifier) {
      promises.push(
        this.createInstance({
          identifier,
          type,
          params: [],
        })
      );
    }

    // Wait to generate all Instances.
    const result = await Promise.all(promises);

    return result;
  }

  // See interface description
  public reset(): void {
    this._mappingOfRemoteDispatchersAndGenerators.clear();
    this._mappingOfRemoteDispatchersAndInstances.clear();

    this.constructors.update();
    this.instances.update();

    this._internalWrapperGenerators = new Map();
    this._registeredConstructors = new Map();

    // If Instances Exists => Delete them.
    if (this._instances) {
      const _this = this;

      // Dispose all Instances.
      for (const [name, instance] of this._instances.entries()) {
        // Remove the Instance.
        this.deleteInstance(name, true).catch((e) => {
          if (_this._logger) {
            _this._logger.error('Failed Removing Instance "' + name + '"');
            _this._logger.error(e);
          }
        });
      }
    }

    this._instances = new Map();
    this._externalInstances = new Map();
    this._internalInstances = new Set();
    this._initializingInstance = new Map();
    this._externalInstancesNames = new Set();

    // Reset the instances
    this.internalInstances.setContent([]);

    if (this._communicator.connected.getContent()) {
      const _this = this;

      // Update the Instances
      this._sendAvailableInstances().catch((e) => {
        if (_this._logger) {
          _this._logger.error("Failed to emit the available instance");
          _this._logger.error(e);
        }
      });
    }
  }

  /**
   * Describes the Data.
   * @returns
   */
  public toDescription() {
    const ret = {
      constructors: {
        all: this.constructors.data.getContent(),
        internal: Array.from(this._registeredConstructors.keys()),
      },
      instances: {
        all: this.instances.data.getContent(),
        internal: Array.from(this._internalInstances.keys()),
      },
    };
    return ret;
  }

  // See interface description
  public async dispose() {
    this.instances.dispose();
  }
}
