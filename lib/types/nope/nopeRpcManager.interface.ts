/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-11-23 11:00:06
 * @modify date 2021-11-25 08:47:21
 * @desc [description]
 */

import {
  IServiceOptions,
  INopeEventEmitter,
  INopeObservable,
  INopeDispatcherOptions,
} from ".";
import {
  IAvailableServicesMsg,
  ICallOptions,
  IExtraData,
  IRequestRpcMsg,
  ITaskCancelationMsg,
} from "./nopeCommunication.interface";
import { IMapBasedMergeData } from "./nopeHelpers.interface";
import { INopePromise } from "./nopePromise.interface";

export type ValidDefaultSelectors =
  | "first"
  | "master"
  | "dispatcher"
  | "host"
  | "free-ram"
  | "cpu-usage";

export const ValidDefaultSelectors = [
  "master",
  "first",
  "dispatcher",
  "host",
  "free-ram",
  "cpu-usage",
];

export type ValidSelectorFunction = (options: {
  serviceName: string;
  rpcManager: INopeRpcManager;
}) => Promise<string>;

export type ValidCallOptions = Partial<ICallOptions> & {
  selector?: ValidSelectorFunction;
} & IExtraData;

export interface IRequestTaskWithCallback extends IRequestRpcMsg {
  /**
   * Callbacks, that are available in a Dispatcher.
   *
   * @author M.Karkowski
   * @type {(({
   *     functionId: string;
   *     idx: number;
   *     deleteAfterCalling: boolean;
   *   } & ICallOptions)[])}
   * @memberof IRequestTaskWithCallback
   */
  callbacks: ({
    functionId: string;
    idx: number;
    deleteAfterCalling: boolean;
  } & ICallOptions)[];
}

/**
 * The `rpcManager` is essentially a service registry.
 *
 * #### Service Registry
 *
 * A service registry is a tool used to store and manage information about available services in a distributed system. It is an important
 * component of microservices architectures, where applications are divided into smaller, independent services that communicate over the network.
 *
 * A service registry serves as a central repository for metadata about each service, including its address, port number, protocol, and API
 * version. When a service is started, it registers with the service registry, and when it is stopped, it is removed from it.
 *
 * Other services in the architecture can then query the Service Registry to find out which services are available and how they can
 * communicate. This reduces the complexity of managing distributed systems and improves scalability and flexibility
 *
 * #### Service Broker
 *
 * A broker in the services world refers to a software tool or mechanism that acts as an intermediary between different services or applications.
 * A broker is typically used in a service-oriented architecture (SOA) to facilitate and manage interaction and communication between different services.
 *
 * A broker provides various functions, such as message routing and transformation, monitoring, and security management. The broker can also
 * perform tasks such as caching messages and routing requests to the most appropriate service.
 *
 * In an SOA environment, applications or services may communicate using different protocols and transports, and the broker acts as an intermediary
 * to ensure that messages are exchanged correctly and reliably between the different systems. The broker can also help improve the scalability
 * and flexibility of services by providing centralized control and management of service interactions.
 *
 * #### Implementation of a service registry and broker in `NoPE` by the `rpcManager`.
 *
 * A service in `NoPE` is defined by an `id`. This usually corresponds to a name with which the service is to be addressed.
 *
 * In order to implement the required functionalities of a service registry, the `rpcManager` has the following methods and attributes:
 * - `registerService`: This can be used to register services. These are then made available to all participants of the NoPE network.
 * - `unregisterService`: This can be used to remove services from the network.
 * - The `services` property provides an overview of which services are available (including frequency and their parameters and description).
 * - The `serviceExists` method can be used to test whether the service is available.
 * - `performCall` execute a service. All relevant communications are mapped by the `rpcManager`. The user does not know which runtime provides the service.
 *    - The execution leads to a so called `task` which can be aborted by `cancelTask`. This leads to an exception at the calling unit.
 *    - If several service providers (NoPE-Runtime) are able to execute the service, the provider can be selected via a callback. For this purpose there are predefined `selectors`
 *        - `master` (see `connectivityManager`) the master must execute the process
 *        - `first`: any provider executes the serives (the first in the list)
 *        - `dispatcher`: a specific dispatcher must run the service (defined by its id)
 *        - `host`: a dispatcher on the defined host.
 *        - `cpu-usage`: the dispatcher with the least CPU usage
 *        - `free-ram`: The dispatcher with the lowest RAM usage
 *  - services with `callbacks` can also be hosted via a plugin
 *
 * @author M.Karkowski
 * @export
 * @interface INopeRpcManager
 */
export interface INopeRpcManager<T extends IServiceOptions = IServiceOptions> {
  /**
   * Flag, to show, that the System is ready
   *
   * @author M.Karkowski
   * @memberof INopeRpcManager
   */
  ready: INopeObservable<boolean>;

  /**
   * A Proxy to the provided Methods (including the Options)
   *
   * @author M.Karkowski
   * @memberof INopeRpcManager
   */
  methodInterfaceWithOptions: {
    [index: string]: <T>(options: ICallOptions, ...args) => INopePromise<T>;
  };

  /**
   * A Proxy to the provided Methods (without the Options)
   *
   * @author M.Karkowski
   * @memberof INopeRpcManager
   */
  methodInterface: { [index: string]: <T>(...args) => INopePromise<T> };

  /**
   * Event, which is fired, if a task has been canceled.
   * this is called after a the method.
   *
   * @author M.Karkowski
   * @type {INopeEventEmitter<ITaskCancelationMsg>}
   * @memberof INopeRpcManager
   */
  onCancelTask: INopeEventEmitter<ITaskCancelationMsg>;

  /**
   * Element showing the available services.
   *
   * OriginalKey = Dispatcher ID (string);
   * OriginalValue = Original Message (IAvailableServicesMsg);
   * ExtractedKey = Function ID (string);
   * ExtractedValue = FunctionOptions (T);
   *
   * @author M.Karkowski
   * @type {IMapBasedMergeData<T>}
   * @memberof INopeRpcManager
   */
  services: IMapBasedMergeData<
    string, // Dispatcher ID
    IAvailableServicesMsg, // Original Message
    string, // Function ID
    T // Function Options
  >;

  /**
   * Function, that must be called if a dispatcher is is gone. This might be the
   * case on slow connections or an a triggered disconnect.
   *
   * @author M.Karkowski
   * @param {string} dispatcher
   * @memberof INopeRpcManager
   */
  removeDispatcher(dispatcher: string): void;

  /**
   * Function, that must be called, to update the available dispatchers.
   *
   * @author M.Karkowski
   * @param {string} dispatcher
   * @memberof INopeRpcManager
   */
  updateDispatcher(dispatcher: IAvailableServicesMsg): void;

  /**
   * Function to cancel the given Task
   *
   * @author M.Karkowski
   * @param {string} taskId The ID of the Task
   * @param {Error} reason The Reason to Cancel the Task
   * @param {void} quiet Disables Log or not.
   * @memberof INopeRpcManager
   */
  cancelTask(taskId: string, reason: Error, quiet?: boolean): Promise<boolean>;

  /**
   *
   *
   * @author M.Karkowski
   * @param {string} serviceName
   * @param {Error} reason
   * @memberof INopeRpcManager
   */
  cancelRunningTasksOfService(serviceName: string, reason: Error): void;

  /**
   * cancel all Tasks of the given dispatcher. If the Dispatcher isnt present,
   * an error is raised
   *
   * @author M.Karkowski
   * @param {string} dispatcher
   * @param {Error} reason
   * @memberof INopeRpcManager
   */
  cancelRunningTasksOfDispatcher(dispatcher: string, reason: Error): void;

  /**
   * Simple helper to find the existing Services
   *
   * @author M.Karkowski
   * @param {string} id The id of the service, which is used during registration
   * @return {boolean} The result
   * @memberof INopeRpcManager
   */
  serviceExists(id: string): boolean;

  /**
   * Simple checker, to test, if this rpc-mananger is providing a service with the given id.
   *
   * @param id The id of the service, which is used during registration
   * @return {boolean} The result
   */
  isProviding(id: string): boolean;

  /**
   * Registers a function
   *
   * @author M.Karkowski
   * @template T
   * @param {(...args) => Promise<T>} func
   * @param {{
   *     // Flag to enable unregistering the function after calling.
   *     deleteAfterCalling?: boolean;
   *     // Instead of generating a uuid an id could be provided
   *     id?: string;
   *     // Flag to enable / disable sending to registery
   *     preventSendingToRegistery?: boolean;
   *   }} options
   * @return {*}  {(...args) => Promise<T>}
   * @memberof INopeRpcManager
   */
  registerService<T>(
    func: (...args) => Promise<T>,
    options: {
      addNopeServiceIdPrefix?: boolean;
    } & IServiceOptions
  ): (...args) => Promise<T>;

  /**
   * Helper to unregister an callback.
   *
   * @author M.Karkowski
   * @param {(string | ((...args) => any))} func
   * @return {Promise<boolean>} Success of the Operation
   * @memberof INopeRpcManager
   */
  unregisterService(func: string | ((...args) => any)): Promise<boolean>;

  /**
   * `performCall` execute a service. All relevant communications are mapped by the `rpcManager`. The user does not know which runtime provides the service.
   *    - The execution leads to a so called `task` which can be aborted by `cancelTask`. This leads to an exception at the calling unit.
   *    - If several service providers (NoPE-Runtime) are able to execute the service, the provider can be selected via a callback. For this purpose there are predefined `selectors`
   *        - `master` (see `connectivityManager`) the master must execute the process
   *        - `first`: any provider executes the serives (the first in the list)
   *        - `dispatcher`: a specific dispatcher must run the service (defined by its id)
   *        - `host`: a dispatcher on the defined host.
   *        - `cpu-usage`: the dispatcher with the least CPU usage
   *        - `free-ram`: The dispatcher with the lowest RAM usage
   *
   * @author M.Karkowski
   * @param {string | string[]} serviceName The name of the service. If a list is provided, all services will be called at the same time using the same parameters
   * @param {unknown[]} params Parameters
   * @param {(Partial<ICallOptions> & {
   *     selector?: ValidSelectorFunction;
   *     quiet?: boolean;
   *     preventSelector?: boolean;
   *   })} options
   * @return {*}  {INopePromise<T>}
   * @memberof INopeRpcManager
   */
  performCall<T>(
    serviceName: string | string[],
    params: unknown[],
    options?: ValidCallOptions | ValidCallOptions[]
  ): INopePromise<T>;

  /**
   * Clear all Tasks.
   *
   * @author M.Karkowski
   * @memberof INopeRpcManager
   */
  clearTasks(): void;

  /**
   * Unregisters all registered Callbacks
   *
   * @author M.Karkowski
   * @memberof INopeRpcManager
   */
  unregisterAll(): void;

  /**
   * Resets the RPC Manager. This clears all running tasks and unregisters all callbacks
   *
   * @author M.Karkowski
   * @memberof INopeRpcManager
   */
  reset(): void;

  /**
   * Disposes the StatusManager and thereby,
   *
   * @author M.Karkowski
   * @param {boolean} [quiet=false]
   * @return {Promise<void>}
   * @memberof INopeRpcManager
   */
  dispose(): Promise<void>;

  /**
   * Description of a RPC-Manager
   */
  toDescription(): {
    services: {
      all: T[];
      internal: {
        options: T;
        func: (...args: any[]) => Promise<any>;
      }[];
    };
    task: {
      executing: string[];
      requested: {
        id: string;
        service: string;
        target: string;
        timeout: any;
      }[];
    };
  };
}
