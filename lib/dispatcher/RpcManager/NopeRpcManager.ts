/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-01-03 11:52:00
 * @modify date 2022-01-05 17:51:09
 * @desc [description]
 */

import { ILogger } from "js-logger";
import { NopeEventEmitter } from "../../eventEmitter/index";
import { isAsyncFunction } from "../../helpers/async";
import { generateId } from "../../helpers/idMethods";
import { MapBasedMergeData } from "../../helpers/mergedData";
import { SPLITCHAR } from "../../helpers/objectMethods";
import { varifyPath } from "../../helpers/path";
import { registerGarbageCallback } from "../../helpers/gc";
import { defineNopeLogger } from "../../logger/getLogger";
import { DEBUG } from "../../logger/index.browser";
import { NopePromise } from "../../promise/nopePromise";
import {
  IAvailableServicesMsg,
  ICallOptions,
  ICommunicationBridge,
  IExtraData,
  IServiceOptions,
  IMapBasedMergeData,
  INopeDispatcherOptions,
  INopeEventEmitter,
  INopeObservable,
  INopePromise,
  INopeRpcManager,
  IRequestRpcMsg,
  IRpcResponseMsg,
  ITaskCancelationMsg,
  ValidCallOptions,
  ValidSelectorFunction,
} from "../../types/nope/index";
import {
  INopeConnectivityManager,
  NopeConnectivityManager,
} from "../ConnectivityManager/index";

/**
 * A Dispatcher to perform a function on a Remote
 * Dispatcher. Therefore a Task is created and forwarded
 * to the remote.
 *
 * For a detailled description please checkout {@link INopeRpcManager}
 *
 * @export
 * @class nopeDispatcher
 */
export class NopeRpcManager<T extends IServiceOptions = IServiceOptions>
  implements INopeRpcManager
{
  protected _logger: ILogger;

  /**
   * Internal Element to store the registered Functions
   *
   * @protected
   * @memberof nopeDispatcher
   */
  protected _registeredServices: Map<
    string,
    {
      options: T;
      func: (...args) => Promise<any>;
    }
  >;

  /**
   * A Mapping of the Services a dispatcher is hosting.
   * Key = Dispatcher-ID
   * Value = Available Services
   *
   * @protected
   * @type {Map<
   *     string,
   *     IAvailableServicesMsg
   *   >}
   * @memberof nopeDispatcher
   */
  protected _mappingOfDispatchersAndServices: Map<
    string,
    IAvailableServicesMsg
  >;

  /**
   * Proxy for accessing the Methods. This proxy provides additional
   * options, which can be used to detail the calls.
   *
   * @author M.Karkowski
   * @memberof NopeRpcManager
   */
  public methodInterfaceWithOptions: {
    [index: string]: <T>(
      options: Partial<ICallOptions>,
      ...args
    ) => INopePromise<T>;
  };

  /**
   * Proxy for accessing the Methods. This proxy provides additional
   * options, which can be used to detail the calls.
   *
   * @author M.Karkowski
   * @memberof NopeRpcManager
   */
  public methodInterface: { [index: string]: <T>(...args) => INopePromise<T> };

  /**
   * Element showing the available services.
   * Its more or less a map, that maps the
   * services with their dispatchers.
   *
   * OriginalKey = Dispatcher ID (string);
   * OriginalValue = Original Message (IAvailableServicesMsg);
   * ExtractedKey = Function ID (string);
   * ExtractedValue = FunctionOptions (T);
   *
   * @author M.Karkowski
   * @type {IMapBasedMergeData<string>}
   * @memberof INopeRpcManager
   */
  public readonly services: IMapBasedMergeData<
    string, // Dispatcher ID
    IAvailableServicesMsg, // Original Message
    string, // Function ID
    T // Function Options
  >;

  /**
   * An event Emitter, which will be called when a task is getting
   * canceled.
   *
   * @author M.Karkowski
   * @type {INopeEventEmitter<ITaskCancelationMsg>}
   * @memberof NopeRpcManager
   */
  public readonly onCancelTask: INopeEventEmitter<ITaskCancelationMsg>;

  /**
   * Internal Element to store the running tasks.
   *
   * @protected
   * @memberof nopeDispatcher
   */
  protected _runningInternalRequestedTasks: Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: any) => void;
      clear: () => void;
      serviceName: string;
      timeout?: any;
      target: string;
    }
  >;

  /**
   * List, with external tasks, that are running.
   * key = task-id
   * value = id of the requester
   */
  protected _runningExternalRequestedTasks: Map<string, string>;

  /**
   * Flag to show an inital warning
   */
  protected __warned: boolean;

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
   * @memberof NopeRpcManager
   */
  public readonly ready: INopeObservable<boolean>;

  /**
   * Creates an instance of nopeDispatcher.
   * @param {nopeRpcDispatcherOptions} options The Options, used by the Dispatcher.
   * @param {() => INopeObservable<IExternalEventMsg>} _generateObservable A Helper, to generate Observables.
   * @memberof nopeDispatcher
   */
  /**
   * Creates an instance of NopeRpcManager.
   * @param {INopeDispatcherOptions} options The Options, used by the rpc-manager.
   * @param {<T>() => INopeObservable<T>} _generateObservable helper to generate an nope observable. might be used to replace the default observable.
   * @param {ValidSelectorFunction} _defaultSelector Default selector see {@link INopeRpcManager.performCall}
   * @param {string} [_id=null] A Provided a for the rpc-manager
   * @param {INopeConnectivityManager} [_connectivityManager=null] A {@link INopeConnectivityManager} used to listen for new and dead dispatchers
   * @memberof performCall
   */
  constructor(
    public options: INopeDispatcherOptions,
    protected _generateObservable: <T>() => INopeObservable<T>,
    protected _defaultSelector: ValidSelectorFunction,
    protected readonly _id: string = null,
    protected _connectivityManager: INopeConnectivityManager = null
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

    this._logger = defineNopeLogger(options.logger, `core.rpc-manager`);

    // Flag to show if the system is ready or not.
    this.ready = this._generateObservable();
    this.ready.setContent(false);

    this.__warned = false;

    // Define A Proxy for accessing methods easier.
    const _this = this;
    const _handlerWithOptions = {
      get(target, name) {
        return (options: ICallOptions, ...args) => {
          return _this.performCall(name, args, options);
        };
      },
    };
    // Define the Proxy without the Options
    const _handlerWithoutOptions = {
      get(target, name) {
        return (...args) => {
          return _this.performCall(name, args);
        };
      },
    };
    this.methodInterfaceWithOptions = new Proxy({}, _handlerWithOptions);
    this.methodInterface = new Proxy({}, _handlerWithoutOptions);

    this.services = new MapBasedMergeData(
      this._mappingOfDispatchersAndServices,
      "services/+",
      "services/+/id"
    );

    this.onCancelTask = new NopeEventEmitter();

    if (this._logger) {
      this._logger.info("manager created id=", this._id);
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
   * Function, which will be called, if an dispatcher is updated.
   * This may leads to service that has been removed or added.
   * This change emitted on see {@link INopeRpcManager.services}
   *
   * @author M.Karkowski
   * @param {IAvailableServicesMsg} msg The Update Message see {@link IAvailableServicesMsg}
   * @memberof NopeRpcManager
   */
  public updateDispatcher(msg: IAvailableServicesMsg): void {
    this._mappingOfDispatchersAndServices.set(msg.dispatcher, msg);
    this.services.update();
  }

  /**
   * Internal Method to handle the rpcs requests.
   *
   * @protected
   * @param {IRequestRpcMsg} data The provided data of the request
   * @param {(...args) => Promise<any>} [_function]
   * @return {*}  {Promise<void>}
   * @memberof NopeRpcManager
   */
  protected async _handleExternalRequest(
    data: IRequestRpcMsg & { target?: string },
    _function: (...args) => Promise<any> = null
  ): Promise<void> {
    try {
      // Try to get the function if not provided:
      if (typeof _function !== "function") {
        _function = this._registeredServices.get(data.functionId)?.func;
      }

      if (this._logger?.enabledFor(DEBUG)) {
        // If there is a Logger:
        this._logger.debug(
          `Dispatcher "${this._id}" received request: "${data.functionId}" -> task: "${data.taskId}"`
        );
      }

      const _this = this;

      if (typeof _function === "function") {
        // Now we check, if we have to perform test, whether
        // we are allowed to execute the task:
        if (data.target && data.target !== this._id) {
          return;
        }

        // Callbacks
        const cbs: Array<(reason) => void> = [];

        const observer = _this.onCancelTask.subscribe((cancelEvent) => {
          if (cancelEvent.taskId == data.taskId) {
            // Call Every Callback.
            cbs.map((cb) => {
              return cb(cancelEvent.reason);
            });

            // Although we are allowed to Cancel the Subscription
            observer.unsubscribe();
          }
        });

        // Only if the Function is present extract the arguments etc.
        const args = [];

        // First extract the basic arguments
        data.params.map((item) => {
          args[item.idx] = item.data;
        });

        // Perform the Task it self.
        const _resultPromise = _function(...args);

        if (
          typeof (_resultPromise as INopePromise<any>)?.cancel === "function"
        ) {
          // Push the Callback to the Result.
          cbs.push((reason) => {
            return (_resultPromise as INopePromise<any>).cancel(reason);
          });
        }

        // Store, who has requested the task.
        _this._runningExternalRequestedTasks.set(data.taskId, data.requestedBy);

        let _result: any = null;

        try {
          // Wait for the Result to finish.
          _result = await _resultPromise;
          // Unsubscribe from Task-Cancelation
          observer.unsubscribe();
        } catch (error) {
          // Unsubscribe from Task-Cancelation
          observer.unsubscribe();

          // Now throw the Error again.
          throw error;
        }

        // Define the Result message
        const result: IRpcResponseMsg = {
          result: typeof _result !== "undefined" ? _result : null,
          taskId: data.taskId,
          sink: data.resultSink,
        };

        // Use the communicator to publish the result.
        await this._communicator.emit("rpcResponse", result);
      }
    } catch (error) {
      if (this._logger) {
        // If there is a Logger:
        this._logger.error(
          `Dispatcher "${this._id}" failed with request: "${data.taskId}"`
        );
        this._logger.error(error);
      }

      // Remove the requested task.
      this._runningExternalRequestedTasks.delete(data.taskId);

      // An Error occourd => Forward the Error.
      const result: IRpcResponseMsg = {
        error: {
          error,
          msg: error.toString(),
        },
        taskId: data.taskId,
      };

      // Send the Error via the communicator to the remote.
      await this._communicator.emit("rpcResponse", result);
    }
  }

  /**
   * Internal Function to handle responses. In Generale,
   * the dispatcher checks if there is an open task with
   * the provided id. If so => finish the promise.
   *
   * @protected
   * @param {IRpcResponseMsg} data The Data provided to handle the Response.
   * @return {boolean} Returns a boolean, indicating whether a corresponding task was found or not.
   * @memberof nopeDispatcher
   */
  protected _handleExternalResponse(data: IRpcResponseMsg): boolean {
    try {
      // Extract the Task
      const task = this._runningInternalRequestedTasks.get(data.taskId);

      // Delete the Task:
      this._runningInternalRequestedTasks.delete(data.taskId);

      // Based on the Result of the Remote => proceed.
      // Either throw an error or forward the result
      if (task && data.error) {
        if (this._logger) {
          this._logger.error(`Failed with task ${data.taskId}`);
          this._logger.error(`Reason: ${data.error.msg}`);
          this._logger.error(data.error);
        }

        task.reject(data.error);

        // Clearout the Timer
        if (task.timeout) {
          clearTimeout(task.timeout);
        }

        return true;
      }
      if (task) {
        task.resolve(data.result);

        // Clearout the Timer
        if (task.timeout) {
          clearTimeout(task.timeout);
        }

        return true;
      }
    } catch (e) {
      this._logger.error("Error during handling an external response");
      this._logger.error(e);
    }

    return false;
  }

  /**
   * Function used to update the Available Services.
   *
   * @protected
   * @memberof nopeDispatcher
   */
  protected async _sendAvailableServices(): Promise<void> {
    // Define the Message
    const message: IAvailableServicesMsg = {
      dispatcher: this._id,
      services: Array.from(this._registeredServices.values()).map((item) => {
        return item.options;
      }),
    };

    if (this._logger?.enabledFor(DEBUG)) {
      this._logger.debug("sending available services");
    }

    // Send the Message.
    await this._communicator.emit("servicesChanged", message);
  }

  /**
   * Internal Function, used to initialize the Dispatcher.
   * It subscribes to the "Messages" of the communicator.
   *
   * @protected
   * @memberof nopeDispatcher
   */
  protected async _init(): Promise<void> {
    const _this = this;
    this.ready.setContent(false);

    // Wait until the Element is connected.
    await this._communicator.connected.waitFor();
    await this._connectivityManager.ready.waitFor();

    // Subscribe to the availableServices of Remotes.
    // If there is a new Service => udpate the External Services
    await this._communicator.on("servicesChanged", (data) => {
      try {
        _this.updateDispatcher(data);
      } catch (e) {
        this._logger.error("Error during handling an ServicesChanged");
        this._logger.error(e);
      }
    });

    await this._communicator.on("rpcRequest", (data) => {
      _this._handleExternalRequest(data);
    });
    await this._communicator.on("rpcResponse", (data) => {
      _this._handleExternalResponse(data);
    });

    // We will listen on Cancelations.
    await this._communicator.on("taskCancelation", (event) => {
      if (event.dispatcher === _this._id) {
        _this.onCancelTask.emit(event);
      }
    });

    // Now we listen to unregisteredServices
    await this._communicator.on("rpcUnregister", (msg) => {
      if (_this._registeredServices.has(msg.identifier)) {
        _this.unregisterService(msg.identifier);
      }
    });

    // We will use our connecitity-manager to listen to changes.
    this._connectivityManager.dispatchers.onChange.subscribe((changes) => {
      if (changes.added.length) {
        // If there are dispatchers online,
        // We will emit our available services.
        _this._sendAvailableServices();
      }
      if (changes.removed.length) {
        // Remove the dispatchers.
        changes.removed.map((item) => {
          return _this.removeDispatcher(item);
        });
      }
    });

    if (this._logger) {
      this._logger.info("core.rpc-manager", this._id, "initialized");
    }

    this.ready.setContent(true);
  }

  /**
   * Helper to remove a dispatcher. This leads to
   * closing all open task related to this dispatcher ->
   * Exceptions should be thrown. Additional, internal
   * task, requested by the dispatcher will be canceled.
   *
   * @author M.Karkowski
   * @param {string} dispatcher
   * @memberof NopeRpcManager
   */
  public removeDispatcher(dispatcher: string): void {
    // Delete the Generators of the Instances.
    this._mappingOfDispatchersAndServices.delete(dispatcher);
    this.services.update();

    // Now we need to cancel every Task of the dispatcher,
    // which isnt present any more.
    this.cancelRunningTasksOfDispatcher(
      dispatcher,
      new Error(
        "Dispatcher has been removed! Tasks cannot be executed any more."
      )
    );

    // Stop executing the requested Tasks.
    this.cancelRequestedTasksOfDispatcher(
      dispatcher,
      new Error("Dispatcher has been removed! Tasks are not required any more.")
    );
  }

  /**
   * Function to cancel an indivual Task. This might be the case, if a
   * connection to a specific dispatcher is lost or might have a user-based reason.
   *
   * @param {string} taskId The Id of the Task. Which should be canceled.
   * @param {Error} reason The Reason, why the Task should be canceled (In general shoudl be something meaning full)
   * @return {*} Flag, that indicates, whether cancelation was sucessfull or not.
   * @memberof nopeDispatcher
   */
  public async cancelTask(
    taskId: string,
    reason: Error,
    quiet = false
  ): Promise<boolean> {
    if (this._runningInternalRequestedTasks.has(taskId)) {
      const task = this._runningInternalRequestedTasks.get(taskId);

      // Delete the task
      this._runningInternalRequestedTasks.delete(taskId);

      // Propagate the Cancellation (internally):
      task.reject(reason);

      // Propagate the Cancellation externally.
      // Therefore use the desired Mode.
      await this._communicator.emit("taskCancelation", {
        dispatcher: this._id,
        reason,
        taskId,
        quiet,
      });

      // Indicate a successful cancelation.
      return true;
    }

    // Task hasnt been found => Cancel the Task.
    return false;
  }

  protected async _cancelHelper(toCancel: Set<string>, reason: Error) {
    if (toCancel.size) {
      const promises: Promise<any>[] = [];
      for (const taskId of toCancel) {
        promises.push(this.cancelTask(taskId, reason));
      }

      await Promise.all(promises);
    }
  }

  /**
   * Helper Function, used to close all tasks with a specific service.
   *
   * @protected
   * @param {string} serviceName The Name of the Service.
   * @param {Error} reason The provided Reason, why cancelation is reuqired.
   * @memberof nopeDispatcher
   */
  public async cancelRunningTasksOfService(serviceName: string, reason: Error) {
    // Provide a List containing all Tasks, that has to be canceled
    const toCancel = new Set<string>();

    // Filter all Tasks that shoud be canceled.
    for (const [id, task] of this._runningInternalRequestedTasks.entries()) {
      // Therefore compare the reuqired Service by the Task
      if (task.serviceName === serviceName) {
        // if the service matches, put it to our list.
        toCancel.add(id);
      }
    }

    return await this._cancelHelper(toCancel, reason);
  }

  /**
   * Helper to cancel all Tasks which have been requested by a Dispatcher.
   *
   * @author M.Karkowski
   * @param {string} dispatcher
   * @param {Error} reason
   * @memberof NopeRpcManager
   */
  public async cancelRequestedTasksOfDispatcher(
    dispatcher: string,
    reason: Error
  ) {
    const toCancel = new Set<string>();

    for (const [
      taskId,
      requestedBy,
    ] of this._runningExternalRequestedTasks.entries()) {
      if (requestedBy == dispatcher) {
        toCancel.add(taskId);
      }
    }

    return await this._cancelHelper(toCancel, reason);
  }

  /**
   * Cancels all Tasks of the given Dispatcher.
   * see {@link NopeRpcManager.cancelTask}
   *
   * @author M.Karkowski
   * @param {string} dispatcher
   * @param {Error} reason
   * @memberof NopeRpcManager
   */
  public async cancelRunningTasksOfDispatcher(
    dispatcher: string,
    reason: Error
  ): Promise<void> {
    // Provide a List containing all Tasks, that has to be canceled
    const toCancel = new Set<string>();
    // Filter all Tasks that shoud be canceled.
    for (const [id, task] of this._runningInternalRequestedTasks.entries()) {
      // Therefore compare the reuqired Service by the Task
      if (task.target === dispatcher) {
        // if the service matches, put it to our list.
        toCancel.add(id);
      }
    }

    return await this._cancelHelper(toCancel, reason);
  }

  /**
   * Function to test if a specific Service exists.
   *
   * @param {string} id The Id of the Serivce
   * @return {boolean} The result of the Test. True if either local or remotly a service is known.
   * @memberof nopeDispatcher
   */
  public serviceExists(id: string): boolean {
    return this.services.amountOf.has(id);
  }

  /**
   * Simple checker, to test, if this rpc-mananger is providing a service with the given id.
   *
   * @param id The id of the service, which is used during registration
   * @return {boolean} The result
   */
  public isProviding(id: string): boolean {
    return this._registeredServices.has(id);
  }

  /**
   * Function to adapt a Request name.
   * Only used internally
   *
   * @protected
   * @param {string} id the original ID
   * @return {string}  the adapted ID.
   * @memberof nopeDispatcher
   */
  protected _getServiceName(id: string, type: "request" | "response"): string {
    return id.startsWith(`${type}/`) ? id : `${type}/${id}`;
  }

  /**
   * Function to unregister a Function from the Dispatcher
   * @param {(((...args) => void) | string | number)} func The Function to unregister
   * @return {*} {boolean} Flag, whether the element was removed (only if found) or not.
   * @memberof nopeDispatcher
   */
  public async unregisterService(
    func: ((...args) => void) | string
  ): Promise<boolean> {
    const _id =
      typeof func === "string"
        ? this.options.forceUsingValidVarNames
          ? varifyPath(func)
          : func
        : ((func as any).id as string) || "0";

    const res = this._registeredServices.delete(_id);
    if (this._logger?.enabledFor(DEBUG)) {
      // If there is a Logger:
      this._logger.debug(`Dispatcher "${this._id}" unregistered: "${_id}"`);
    }
    // Publish the Available Services.
    await this._sendAvailableServices();

    return res;
  }

  public adaptServiceId(name: string) {
    if (name.startsWith(`nope${SPLITCHAR}service${SPLITCHAR}`)) {
      return name;
    }
    return `nope${SPLITCHAR}service${SPLITCHAR}${name}`;
  }

  /**
   * Function to register a Function in the Dispatcher
   *
   * @param {(...args) => Promise<any>} func The function which should be called if a request is mapped to the Function.
   * @param {{
   *     // Flag to enable unregistering the function after calling.
   *     deleteAfterCalling?: boolean,
   *     // Instead of generating a uuid an id could be provided
   *     id?: string;
   *   }} [options={}] Options to enhance the registered ID and enabling unregistering the Element after calling it.
   * @return {*} {(...args) => Promise<any>} The registered Function
   * @memberof nopeDispatcher
   */
  public registerService(
    func: (...args) => Promise<any>,
    options: {
      // We dont want to add a prefix
      addNopeServiceIdPrefix?: boolean;
    } & T
  ): (...args) => Promise<any> {
    const _this = this;
    // Define / Use the ID of the Function.
    let _id = options.id || generateId();
    _id = options.addNopeServiceIdPrefix ? this.adaptServiceId(_id) : _id;
    _id = this.options.forceUsingValidVarNames ? varifyPath(_id) : _id;

    // Make shure we assign our id
    options.id = _id;

    if (
      this.isProviding(options.id) &&
      this._registeredServices.get(options.id).func != func
    ) {
      const err = Error(`The service "${_id}" is already declared!`);
      this._logger.error(`The service "${_id}" is already declared!`);
      this._logger.error(err);
      throw err;
    }

    let _func = func;

    if (!this.__warned && !isAsyncFunction(func)) {
      this._logger.warn(
        "!!! You have provided synchronous functions. They may break NoPE. Use them with care !!!"
      );
      this._logger.warn(`The service "${_id}" is synchronous!`);
      this.__warned = true;
    }

    // Define a ID for the Function
    (_func as any).id = _id;

    // Define the callback.
    (_func as any).unregister = () => {
      return _this.unregisterService(_id);
    };

    // Register the Function
    this._registeredServices.set((_func as any).id, {
      options: options as T,
      func: _func,
    });

    // Publish the Available Services.
    this._sendAvailableServices();

    if (this._logger?.enabledFor(DEBUG)) {
      // If there is a Logger:
      this._logger.debug(`Dispatcher "${this._id}" registered: "${_id}"`);
    }
    // Return the Function.
    return _func;
  }

  /**
   * Function which is used to perform a call on the remote.
   *
   * @author M.Karkowski
   * @template T
   * @param {string} serviceName serviceName The Name / ID of the Function
   * @param {any[]} params
   * @param {(Partial<ICallOptions> & {
   *       selector?: ValidSelectorFunction;
   *       quiet?: boolean;
   *     })} [options={}] Options for the Call. You can assign a different selector.
   * @return {*}  {INopePromise<T>} The result of the call
   * @memberof nopeDispatcher
   */
  protected _performCall<T>(
    serviceName: string,
    params: any[],
    options: ValidCallOptions = {}
  ): INopePromise<T> {
    // Get a Call Id
    const _taskId = generateId();
    const _this = this;

    const _options = {
      resultSink: this._getServiceName(serviceName, "response"),
      ...options,
    } as ICallOptions;

    const clear = () => {
      // Remove the task:
      if (_this._runningInternalRequestedTasks.has(_taskId)) {
        const task = _this._runningInternalRequestedTasks.get(_taskId);

        // Remove the Timeout.
        if (task.timeout) {
          clearTimeout(task.timeout);
        }

        // Remove the Task itself
        _this._runningInternalRequestedTasks.delete(_taskId);
      }
    };

    if (_this._logger?.enabledFor(DEBUG)) {
      _this._logger.debug(
        `Dispatcher "${this._id}" requesting externally Function "${serviceName}" with task: "${_taskId}"`
      );
    }

    // Define a Callback-Function, which will expect the Task.
    const ret = new NopePromise<T>(async (resolve, reject) => {
      try {
        const taskRequest: {
          resolve: (value: any) => void;
          reject: (error: any) => void;
          clear: () => void;
          serviceName: string;
          timeout?: any;
          target: string;
        } = {
          resolve,
          reject,
          clear,
          serviceName,
          timeout: null,
          target: null,
        };

        // Register the Handlers,
        _this._runningInternalRequestedTasks.set(_taskId, taskRequest);

        // Define a Task-Request
        const packet: IRequestRpcMsg & IExtraData = {
          functionId: serviceName,
          params: [],
          taskId: _taskId,
          resultSink: _options.resultSink,
          requestedBy: _this._id,
        };

        for (const [idx, contentOfParameter] of params.entries()) {
          packet.params.push({
            idx,
            data: contentOfParameter,
          });
        }

        if (!_this.serviceExists(serviceName)) {
          // Create an Error:
          const error = new Error(
            `No Service Provider known for "${serviceName}"`
          );

          if (_this._logger) {
            _this._logger.error(
              `No Service Provider known for "${serviceName}"`
            );
            _this._logger.error(error);
          }

          throw error;
        }

        if (
          _this.options.forceUsingSelectors ||
          this.services.amountOf.get(serviceName) > 1
        ) {
          if (typeof options.target !== "string") {
            taskRequest.target = options.target;
          } else if (typeof options?.selector === "function") {
            const dispatcherToUse = await options.selector({
              rpcManager: this,
              serviceName,
            });

            // Assign the Selector:
            taskRequest.target = dispatcherToUse;
          } else {
            const dispatcherToUse = await this._defaultSelector({
              rpcManager: this,
              serviceName,
            });

            // Assign the Selector:
            taskRequest.target = dispatcherToUse;
          }

          packet.target = taskRequest.target;
        } else {
          taskRequest.target = Array.from(
            this.services.keyMappingReverse.get(serviceName)
          )[0];
        }

        // Send the Message to the specific element:
        await _this._communicator.emit("rpcRequest", packet);

        if (_this._logger?.enabledFor(DEBUG)) {
          _this._logger.debug(
            `Dispatcher "${
              this._id
            }" putting task "${_taskId}" on: "${_this._getServiceName(
              packet.functionId,
              "request"
            )}"`
          );
        }

        // If there is a timeout =>
        if (options.timeout > 0) {
          taskRequest.timeout = setTimeout(() => {
            _this.cancelTask(
              _taskId,
              new Error(
                `TIMEOUT. The Service allowed execution time of ${options.timeout.toString()}[ms] has been excided`
              ),
              false
            );
          }, options.timeout);
        }
      } catch (e) {
        // Clear all Elements of the Function:
        clear();

        // Throw the error.
        reject(e);
      }
    });

    ret.taskId = _taskId;
    ret.cancel = (reason) => {
      _this.cancelTask(_taskId, reason);
    };

    return ret;
  }

  /**
   * Function which is used to perform a call on the remote.
   * Please see {@link INopeRpcManager.performCall} for more Info.
   */
  public performCall<T>(
    serviceName: string | string[],
    params: unknown[],
    options?: ValidCallOptions | ValidCallOptions[]
  ): INopePromise<T> {
    if (Array.isArray(serviceName)) {
      if (Array.isArray(options) && options.length !== serviceName.length) {
        throw Error("Array Length must match.");
      }
      const promises = serviceName.map((service, idx) => {
        return this._performCall(
          service,
          params,
          Array.isArray(options) ? options[idx] : options
        );
      });
      return Promise.all(promises) as unknown as INopePromise<T>;
    } else {
      if (Array.isArray(options)) {
        // Throw an error.
        throw Error("Expecting a single Value for the options");
      }

      return this._performCall(serviceName, params, options);
    }
  }

  /**
   * Function to clear all pending tasks
   *
   * @memberof nopeDispatcher
   */
  public clearTasks(): void {
    if (this._runningInternalRequestedTasks) {
      this._runningInternalRequestedTasks.clear();
    } else this._runningInternalRequestedTasks = new Map();
  }

  /**
   * Function to unregister all Functions of the Dispatcher.
   *
   * @memberof nopeDispatcher
   */
  public unregisterAll(): void {
    if (this._registeredServices) {
      const toUnregister = Array.from(this._registeredServices.keys());

      for (const id of toUnregister) {
        this.unregisterService(id);
      }
      this._registeredServices.clear();
    } else {
      this._registeredServices = new Map();
    }
  }

  /**
   * Function to reset the Dispatcher.
   *
   * @memberof nopeDispatcher
   */
  public reset(): void {
    this.clearTasks();
    this.unregisterAll();

    this._mappingOfDispatchersAndServices = new Map();
    this.services.update(this._mappingOfDispatchersAndServices);

    this._runningExternalRequestedTasks = new Map();
  }

  public async dispose(): Promise<void> {
    this.clearTasks();
    this.unregisterAll();
  }

  /**
   * Describes the Data.
   * @returns
   */
  public toDescription() {
    const ret = {
      services: {
        all: this.services.data.getContent(),
        internal: Array.from(this._registeredServices.values()),
      },
      task: {
        executing: Array.from(this._runningExternalRequestedTasks.values()),
        requested: Array.from(
          this._runningInternalRequestedTasks.entries()
        ).map((item) => {
          return {
            id: item[0],
            service: item[1].serviceName,
            target: item[1].target,
            timeout: item[1].timeout,
          };
        }),
      },
    };

    return ret;
  }
}
