/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-10-12 18:31:11
 * @modify date 2021-11-13 14:09:15
 * @desc [description]
 */
import { IServiceOptions } from ".";
import {
  IHost,
  INopeINopeConnectivityOptions,
  INopeStatusInfo,
} from "./nopeConnectivityManager.interface";
import { INopeCore } from "./nopeCore.interface";
import { INopeDescriptor } from "./nopeDescriptor.interface";
import {
  IEventAdditionalData,
  IEventCallback,
  INopeEventEmitter,
  INopeObserver,
} from "./nopeEventEmitter.interface";
import { INopeModule, INopeModuleDescription } from "./nopeModule.interface";
import { INopeObservable } from "./nopeObservable.interface";
import { INopePromise } from "./nopePromise.interface";
import { ValidDefaultSelectors } from "./nopeRpcManager.interface";

export type IGenerateInstanceCallback<I extends INopeModule> = () => Promise<I>;
export type IGenerateRemoteInstanceCallback<I extends INopeModule> = (
  dispatcher: INopeDispatcher,
  description: INopeModuleDescription,
  ...args
) => Promise<I>;
export type IGenerateRemoteInstanceForOtherDispatcherCallback<
  I extends INopeModule
> = (dispatcher: INopeDispatcher, identifier: string, ...args) => Promise<I>;

export type IValidPromise<T> = Promise<T> | INopePromise<T>;

export type INopeDispatcherOptions = {
  /**
   * The Id of the Dispatcher
   *
   * @author M.Karkowski
   * @type {string}
   */
  id?: string;

  /**
   * The default-selector to select the service providers
   *
   * @author M.Karkowski
   * @type {ValidDefaultSelectors}
   */
  defaultSelector?: ValidDefaultSelectors;

  /**
   * Flag to force using the service provider selector
   * functionalities.
   *
   * @author M.Karkowski
   * @type {boolean}
   */
  forceUsingSelectors?: boolean;

  /**
   * Flag to ensure, that every path used is corrcet and could be
   * used as variable in another system.
   *
   * @author M.Karkowski
   * @type {boolean}
   */
  forceUsingValidVarNames?: boolean;

  /**
   * Flag to indicate, whether methodes with the call {@link nope.exportAsNopeService} are
   * provided by the instance or not.
   */
  useExportedServices?: boolean;
} & INopeINopeConnectivityOptions;

export interface IHostOverview extends IHost {
  dispatchers: {
    id: string;
    pid: number | string;
  }[];
  instances: INopeModuleDescription[];
  services: {
    name: string;
    schema: INopeDescriptor;
  }[];
}

export interface IDispatcherConstructor {
  new (
    options: INopeDispatcherOptions,
    _generateEmitter: <T>() => INopeEventEmitter<T>,
    _generateObservable: <T>() => INopeObservable<T>
  ): INopeDispatcher;
}

/**
 * # NoPE - Dispatcher
 *
 * The NoPE-Dispatcher is designed as Layer between the different Modules / Dispatchers. They allow distributed computing or just a simple ***Service oriented Architecture*** (*SOA*). A dispatcher is used to link the modules, share data and events and provide a remote procedure call (rpc) interface.
 *
 * ## Building Blocks of a Dispatcher:
 *
 * | element | description |
 * |-|-|
 * | `connectivityManager` | establishes a connection to other dispatchers and manages the status of the remotely connected dispatchers. It checks their health and removes dead dispatchers. |
 * | `eventDistributor` | shares events accross the network (or internally). You can use this element to listen for specific events. The subscription to those events allows `mqtt`-patterns. Additionaly, you are allowed to emit event on specific topics, or pattern based topics |
 * | `dataDistributor` | shares data accross the network (or internally). In comperisson to events, data is persistent and is available all the time. You can use this sub-module to listen for specific data-changes (install data-hooks), pull specific data or push data. You can pull / push data using a `mqtt`-pattern based path. |
 * | `rpcManager` | Used to perform `remote procedure calls` (see [here](https://de.wikipedia.org/wiki/Remote_Procedure_Call)). The manager keeps track of the available services. You must use the sub-module to register/unregister (new) services. |
 * | `instanceManager` | Used to create/dispose (remote) instances. The manager keeps track of the available instances in the network, allows to create `wrappers` for those instances. You must use the sub-module to register/unregister (new) instances. To allow the system to provide a service for creating instances of as specific type, you can provide a generator and provide it as `service`. |
 * @export
 * @interface INopeDispatcher
 */
export interface INopeDispatcher extends INopeCore {
  readonly options: INopeDispatcherOptions;

  /**
   * Pushs the desired data into the system.
   * @param path The path to the Data.
   * @param content The Content to Push
   * @param options The Options during pushing
   */
  pushData<T = unknown>(
    path: string,
    content: T,
    options: IEventAdditionalData
  ): void;

  /**
   * Helper to pull some data from the system.
   * @param path The path to the Data.
   * @param _default The value to use if no data has been found. If not provided an error is thrown. Defaults to None.
   */
  pullData<T = unknown, D = null>(path: string, _default?: D): T;

  /**
   * Helper to subscribe to specific events.
   * @param event Name of the relevant event
   * @param subscription the Callback to use.
   */
  subscribeToEvent<T = unknown>(
    event: string,
    subscription: IEventCallback<T>
  ): INopeObserver;

  /**
   * Emits an event with the given name. All
   * event-subscriber, where the topic matches
   * will receive this notification.
   * @param eventName
   * @param data
   */
  emitEvent(eventName: string, data: any);

  /**
   * Receive the "instances" | "services" | "properties" | "events"
   * which matches with the given pattern. Therefore the user provides
   * the pattern and tyle.
   *
   * @author M.Karkowski
   * @param {string} pattern Pattern to query the provided type.
   * @param {("instances" | "services" | "properties" | "events")} type Type which should be querried
   * @return {string[]} List of the matching items.
   * @memberof INopeDispatcher
   */
  query(
    pattern: string,
    type: "instances" | "services" | "properties" | "events"
  ): string[];

  /**
   * Function used to dispose the Dispatcher. This will
   * dispose all instances an remove the them. They wont
   * be available in the NoPE-Network.
   *
   * @author M.Karkowski
   * @return {*}  {Promise<void>}
   * @memberof INopeDispatcher
   */
  dispose(): Promise<void>;
}
