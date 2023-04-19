/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { INopeStatusInfo } from "./nopeConnectivityManager.interface";
import {
  IServiceOptions,
  INopeModuleDescription,
} from "./nopeModule.interface";
import { INopeObservable } from "./nopeObservable.interface";
import { IIncrementalChange } from "./nopePubSub.interface";

/**
 * Default Emitter, which will be used
 *
 * @export
 * @interface IEmitter
 */
export interface IEmitter {
  /**
   * Method to subscribe to events
   * @param event the event name
   * @param listener the callback
   */
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  /**
   * Method to unsubscribe to events
   * @param event the event name
   * @param listener the callback
   */
  off(event: string | symbol, listener: (...args: any[]) => void): this;
  /**
   * Function to emit an event
   * @param event the name of the event
   * @param args The content to emit
   */
  emit(event: string | symbol, ...args: any[]): boolean;
  /**
   * Sometimes the max amount of emitters is limited. This
   * function returns this amount
   * @returns
   */
  getMaxListeners?: () => number;
  /**
   * Sometimes the max amount of emitters is limited. This
   * function uüdates this amount.
   * @param n The amount to use.
   * @returns
   */
  setMaxListeners?: (n: number) => void;
}

export interface IExtraData {
  target?: string;
}

/**
 * A layer is an element that is used to establish a communication connection. This element implements the connection (e.g.  a MQTT layer).
 *
 * A layer is utilized by the {@link ICommunicationBridge}
 *
 * A layer has the following functionalities provided by its interface:
 * - The layer must implement the methods on, which are used to listen for various events that can be subscribed to by the nope systems.
 * - Messages are sent out using the emit method.
 * - The connection status of the layer is indicated in the connected observable. This value is allowed to be true only if there is a connection.
 * - Sometimes the layer receives its own messages (the implementation of an udp-broadcast based layer, while broadcasting we will receive our own messages). If this is the case, the receivesOwnMessages flag must be set to true to prevent messages from being received twice.
 * - If a layer is not used, we can destroy it with dispose.
 *
 * Currently there are 3 layers implemented:
 * - `MQTT` (see {@link communication.layers.MQTTLayer})
 * - `IO-Sockets`:
 *    - `io-client` (see {@link communication.layers.IoSocketClientLayer})
 *    - `io-server` (see {@link communication.layers.ioSocketServerLayer} runs as Standalone)
 * - `event`: an internal layer only. Is defaultly provided. (see {@link communication.layers.EventCommunicationInterface})
 *
 *
 * @export
 * @interface ICommunicationInterface
 */
export interface ICommunicationInterface {
  /**
   * used to emit some data.
   *
   * @author M.Karkowski
   * @template T
   * @param {T} eventname The Event name
   * @param {(data: EventnameToEventType[T]) => void} cb The Callback to use.
   * @return {Promise<void>}
   * @memberof ICommunicationInterface
   */
  on<T extends Eventname>(
    eventname: T,
    cb: (data: EventnameToEventType[T] & IExtraData) => void
  ): Promise<void>;

  /**
   * used to emit some data on the bride. It will distribute the event accors
   *
   * @author M.Karkowski
   * @template T
   * @param {T} eventname
   * @param {EventnameToEventType[T]} data
   * @return {Promise<void>}
   * @memberof ICommunicationInterface
   */
  emit<T extends Eventname>(
    eventname: T,
    data: EventnameToEventType[T] & IExtraData
  ): Promise<void>;

  /**
   * Flag, indication, whether the Layer is connected or not.
   */
  readonly connected: INopeObservable<boolean>;

  /**
   * Used to show, whether the the layer receives its own messages
   * @type {boolean}
   * @memberof ICommunicationInterface
   */
  readonly receivesOwnMessages: boolean;

  /**
   * Helper to detail the listeners of the "event", "rpc", "data" or "responses"
   * @param {"event" | "rpc" | "data" | "response"} type valid type to detail the name
   * @param {string[]} listeners the currently used listeners.
   */
  detailListeners?(
    type: "event" | "rpc" | "data" | "response",
    listeners: string[]
  );

  /**
   * ID of the Layer.
   *
   * @author M.Karkowski
   * @type {string}
   * @memberof ICommunicationInterface
   */
  readonly id: string;

  /**
   * Disconnect the Layer.
   *
   * @return {Promise<void>}
   * @memberof ICommunicationInterface
   */
  dispose(): Promise<void>;
}

/**
 * A `ICommunicationBridge` is used to establish different connections (a bridge can establish several connections with different layers).
 *
 * The `ICommunicationBridge` is the core interface with which all Nope core elements interact. Its main task is to add and remove multiple
 * layers (like 'mqtt' or 'io-sockets'; see {@link ICommunicationInterface})
 *
 * To the outside, the bridge behaves like a {@link ICommunicationInterface}. I.e. the methods on and emit are also implemented.
 * However, the bridge ensures that each of the {@link ICommunicationInterface} added, are able to receive and send the messages.
 * Furthermore the status connected indicates whether all layers are connected or not.
 *
 * If different layers are only optional, e.g. all connections are covered by io-sockets, but all messages are to be mirrored
 * to MQTT because they are to be picked up there, then this can be taken into account in the add method. These connections
 * are then not taken into account in the connected status.
 *
 * @export
 * @interface ICommunicationBridge
 * @extends {ICommunicationInterface}
 */
export interface ICommunicationBridge extends ICommunicationInterface {
  /**
   * Function, to add an Layer to the Bridge
   *
   * @param {ICommunicationInterface} layer The Layer to Add.
   * @param {boolean} forward Flag, that enables forwarding the Information to other Layers.
   * @param {boolean} considerConnection Flag, that enables considering this flag in the {@link ICommunicationInterface.connected} flag.
   * @memberof ICommunicationBridge
   */
  addCommunicationLayer(
    layer: ICommunicationInterface,
    forwardData?: boolean,
    considerConnection?: boolean
  ): Promise<void>;

  /**
   * Function, to remove the Layer again.
   * Data wont be forwarded any more.
   *
   * @param {ICommunicationInterface} layer The Layer to Remove
   * @memberof ICommunicationBridge
   */
  removeCommunicationLayer(layer: ICommunicationInterface): Promise<void>;

  /**
   * Readable status of the Connection.
   *
   * @return {*} The Statsus
   * @memberof ICommunicationBridge
   */
  toDescription(): {
    // Element showing, whether the bridge is connected or not.
    connected: boolean;
    // The used Layers
    layers: {
      forwardData: boolean;
      receivesOwnMessages: boolean;
      id: string;
      considerConnection: boolean;
    }[];
  };
}

/**
 * A Mapping, mapping the event name to the Type and Message.
 */
export type EventnameToEventType = {
  aurevoir: IAurevoirMsg;
  bonjour: IBonjourMsg;
  instancesChanged: IAvailableInstancesMsg;
  dataChanged: IDataChangedMsg;
  servicesChanged: IAvailableServicesMsg;
  statusChanged: INopeStatusInfo;
  taskCancelation: ITaskCancelationMsg;
  event: IExternalEventMsg;
  rpcRequest: IRequestRpcMsg;
  rpcResponse: IRpcResponseMsg;
  rpcUnregister: IRpcUnregisterMsg;
  tasks;
};

/**
 * Valid names of the events.
 */
export type Eventname = keyof EventnameToEventType;

/**
 * List containing all valid Eventnames.
 */
export const Eventnames: Array<Eventname> = [
  // Default emitters
  "aurevoir",
  "bonjour",
  "instancesChanged",
  "dataChanged",
  "servicesChanged",
  "statusChanged",
  "taskCancelation",
  "event",
  "rpcRequest",
  "rpcResponse",
  "rpcUnregister",
  "tasks",
];

export interface IAurevoirMsg {
  dispatcherId: string;
}

export interface IBonjourMsg {
  dispatcherId: string;
}

export interface IExecutingTaskMsg {
  dispatcherId: string;
  tasks: { [index: string]: string };
}

export type IAvailableInstancesMsg = {
  /**
   * The Id of the Dispatcher
   *
   * @type {string}
   */
  dispatcher: string;

  /**
   * The List of available Instance Creators.
   *
   * @type {string[]}
   */
  instances: INopeModuleDescription[];
};

export interface IDataChangedMsg extends IIncrementalChange {}

export interface IAvailableServicesMsg {
  /**
   * The Id of the Dispatcher
   *
   * @type {string}
   */
  dispatcher: string;
  /**
   * The List of registered Service.
   *
   * @type {string[]}
   */
  services: IServiceOptions[];
}

export type ITaskCancelationMsg = {
  /**
   * The Id of the Dispatcher
   *
   * @type {string}
   */
  dispatcher: string;

  /**
   * ID of the canceled Task
   *
   * @type {string}
   */
  taskId: string;

  /**
   * Reason, why the Task has been canceled.
   *
   * @type {*}
   */
  reason: any;

  /**
   * Flag to indicate, that this task should be canceled quiet.
   *
   * @author M.Karkowski
   * @type {boolean}
   */
  quiet?: boolean;
};

export interface IExternalEventMsg extends IIncrementalChange {
  /**
   * The Topic, on which it was hosted
   *
   * @type {string}
   */
  path: string;
}

export interface IRequestRpcMsg {
  /**
   * UUID of a Task
   *
   * @type {string}
   */
  taskId: string;

  /**
   * ID of the Function, on which it is available.
   *
   * @type {string}
   */
  functionId: string;

  /**
   * The Parameters
   *
   * @type {{
   *     idx: number,
   *     data: any
   *   }[]}
   */
  params: {
    /**
     * Index of the Parameter
     *
     * @type {number}
     */
    idx: number;
    data: any;
  }[];

  /**
   * Element, allowing to describe where the result should be hosted.
   *
   * @type {string}
   */
  resultSink: string;

  /**
   * Contains the Requester
   *
   * @author M.Karkowski
   * @type {string}
   */
  requestedBy: string;
}

export interface IRpcResponseMsg {
  /**
   * ID of the Task.
   *
   * @type {string}
   */
  taskId: string;
  /**
   * Sink for the data (the modules provide them.)
   *
   * @author M.Karkowski
   * @type {string}
   * @memberof IRpcResponseMsg
   */
  sink?: string;
  /**
   * Property containing the result. Is
   * only present, if no error exists.
   *
   * @type {*}
   */
  result?: any;
  /**
   * Property containing the error, if
   * it occourd.
   *
   * @type {*}
   */
  error?: {
    error: any;
    msg: string;
  };
}

export interface IRpcUnregisterMsg {
  identifier: string;
  dispatcherId: string;
}

export interface IInstanceDescriptionMsg {
  type: string;
  description: INopeModuleDescription;
}

export interface IInstanceCreationMsg {
  type: string;
  identifier: string;
  params: any;
  dispatcherId: string;
  selector?: {
    functionId: string;
  } & ICallOptions;
}

export interface IDisposeInstanceMsg {
  identifier: string;
  dispatcherId: string;
}

export interface ICallOptions {
  /**
   * Desired result sink. If implemented,
   * the result will be published on this
   * topic as well.
   *
   * @author M.Karkowski
   * @type {string}
   * @memberof ICallOptions
   */
  resultSink?: string;

  /**
   * A User Provided Timeout of the call. After the timeout has been
   * ellapsed, the task is cancelled with a timeout error.
   * The Time is given in **ms**
   *
   * @type {number}
   */
  timeout?: number;
}
