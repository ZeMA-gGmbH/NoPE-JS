/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2022-01-04 12:44:25
 * @modify date 2022-01-04 12:44:25
 * @desc [description]
 */

import { ValidLoggerDefinition } from "../../logger/getLogger";
import { ICommunicationBridge } from "./nopeCommunication.interface";
import { IMapBasedMergeData } from "./nopeHelpers.interface";
import { IVersion } from "./nopeModule.interface";
import { INopeObservable } from "./nopeObservable.interface";

/**
 * The Dispatcher Status
 *
 * @author M.Karkowski
 * @export
 * @enum {number}
 */
export enum ENopeDispatcherStatus {
  HEALTHY = 0,
  SLOW = 1,
  WARNING = 2,
  DEAD = 3,
}

export interface IHost {
  /**
   * Number of Cores
   *
   * @author M.Karkowski
   * @type {number}
   */
  cores: number;
  /**
   * Some Details about the Model
   *
   * @author M.Karkowski
   */
  cpu: {
    model: string;
    // Speed of the CPU in MHz
    speed: number;
    // Usage of the CPU in %. If not present ==> -1
    usage: number;
  };
  os: string;
  ram: {
    // Amount of free RAM in MByte
    free: number;
    // Amount of free RAM in MByte
    total: number;
    // Used RAM in %
    usedPerc: number;
  };
  name: string;
}

export interface INopeStatusInfo {
  /**
   * Id of the Dispatcher
   *
   * @author M.Karkowski
   * @type {string}
   * @memberof IDispatcherInfo
   */
  id: string;
  /**
   * Timestamp of the Message
   *
   * @author M.Karkowski
   * @type {number}
   * @memberof IDispatcherInfo
   */
  timestamp: number;
  /**
   * The Amount of Time, the system is up.
   *
   * @author M.Karkowski
   * @type {number}
   * @memberof INopeStatusInfo
   */
  connectedSince: number;
  /**
   * The Status of the Dispatcher
   *
   * @author M.Karkowski
   * @type {ENopeDispatcherStatus}
   * @memberof IDispatcherInfo
   */
  status: ENopeDispatcherStatus;
  /**
   * Status, whether the system is regarded as master or not.
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof INopeStatusInfo
   */
  isMaster: boolean;
  /**
   * Status, whether master-status is forced or not.
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof INopeStatusInfo
   */
  isMasterForced: boolean;
  /**
   * The Environment, in which the Dispatcher is running
   * In nodejs it should be "nodejs".
   *
   * @author M.Karkowski
   * @type {string}
   * @memberof IDispatcherInfo
   */
  env: string;
  /**
   * Displays the current Version of the Implementation. This is espacially relevant
   * for the protocol
   *
   * @author M.Karkowski
   * @type {string}
   * @memberof IDispatcherInfo
   */
  version: string;
  /**
   * Some Information about the Host.
   *
   * @author M.Karkowski
   * @memberof IDispatcherInfo
   */
  host: IHost;
  /**
   * Process ID of the Dispatcher.
   */
  pid: number | string;
  /**
   * Field containing the Plugins
   */
  plugins: Array<string>;
}

export type INopeINopeConnectivityTimeOptions = {
  /**
   * Interval for the alive message given in [ms]. If "0" is provided,
   * no alive messages are provided
   *
   * @author M.Karkowski
   * @type {number}
   */
  sendAliveInterval: number;

  /**
   * Interval, to check the other dispatcher for being slow, dead, etc..
   * should be lager then the "sendAliveInterval". The value is given in [ms]
   * If "0" is provided, no alive messages are provided
   *
   * @author M.Karkowski
   * @type {number}
   */
  checkInterval: number;

  /**
   * Amount of Time, after which an external dispatcher is declared as slow.
   * The value is given in [ms]
   *
   * @author M.Karkowski
   * @type {number}
   */
  slow: number;

  /**
   * Time, after which an warning is given. The value is given in [ms]
   *
   * @author M.Karkowski
   * @type {number}
   */
  warn: number;

  /**
   * Amount of Time, after which an external dispatcher is declared as dead. The value is given in [ms]
   *
   * @author M.Karkowski
   * @type {number}
   */
  dead: number;

  /**
   * Amount of Time, after which an external dispatcher is removed.
   *
   * @author M.Karkowski
   * @type {number}
   */
  remove: number;
};

export type INopeINopeConnectivityOptions = {
  /**
   * The Communicator to use.
   *
   * @author M.Karkowski
   * @type {ICommunicationBridge}
   */
  communicator: ICommunicationBridge;

  /**
   * A Specific logger which should be used.
   *
   * @author M.Karkowski
   * @type {ILogger}
   */
  logger?: ValidLoggerDefinition;

  /**
   * Timeout Definitions. These are relevant, to determine
   * alive, slow, dead, ... dispatchers.
   *
   * @author M.Karkowski
   * @type {INopeINopeConnectivityTimeOptions}
   */
  timeouts?: Partial<INopeINopeConnectivityTimeOptions>;

  /**
   * Flag to force the Master. If set to null "default" -> the auto selection will be used.
   */
  isMaster?: boolean;
};

/**
 * A `connectivityManager` observes the connection to various dispatchers. This element displays all found dispatchers
 * in the network (if there are no others only itself) in the `dispatchers` property. It manages the status (`dead`,
 * `slow`, `warn`, `alive`) of the other dispatchers.
 *
 * The manager uses a `bridge` {@link ICommunicationBridge} to search for new dispatchers. When a link layer connection
 * is established via the bridge, a so-called `bonjour` message is sent. With this message all `dispatchers` in a network
 * register themselves. If such a message is sent, all other dispatchers report their current status. Thus all dispatchers
 * are known to each other.
 *
 * The `connectivityManager` checks their status time-based. To do this, all ConnectivityManagers` send each other a `live`
 * message (a `heartbeat`) defined time interval. This can be used to monitor when a dispatcher last checked in. If this
 * exceeds a certain time interval, that dispatcher is first classified as 'slow' and then as 'dead'. If the dispatcher
 * does not check in after a defined time interval, it is removed.
 *
 * The described changes can be observed using the `dispatchers` property.
 *
 * In addition, the `connectivityManager` allows synchronization of timestamps with other systems (usually other dispatchers).
 * This is useful when different systems store sensor data, for example. The timestamp is calculated with a delay, which can
 * be determined during pings.
 *
 *  - You can get a sync timestamp using the `now` property.
 *
 * The `connectivityManager` provides properties that simplify the collection of some information:
 *  - `getStatus` to get the status of a particular dispatcher.
 *  - `getAllHosts`: to get all hosts on the network. (It is possible that several nope runtimes are running on the same host)
 *  - `upTime`: since when the Connectivity Manager is running.
 *
 * Sometimes it is useful to define a `master` in the network with nope runtime, (e.g. time synchronization). For this
 * the flag `master` can be set to `true` or `false`. This sets the master mode of the `connectivityManager` manually. If
 * it is set to `null`, the master is determined automatically and the `connectivityManager` could be a master. The selection
 * of the master is based on the operation time and the connection time.
 *
 * > For better understanding please read the `13-ConnectivityManager` Jupyter notebook in the `wiki`-section! *
 */
export interface INopeConnectivityManager {
  /**
   * Flag, to show, that the System is ready
   *
   * @author M.Karkowski
   * @type {INopeObservable<boolean>}
   * @memberof INopeStatusManager
   */
  ready: INopeObservable<boolean>;

  /**
   * Mapping for the External Dispatchers.
   * You can use the Event, onChange, to
   * get the latest changes. Use the "data"
   * field, to subscribe for the latest data.
   *
   * - `OriginalKey` = Dispatcher ID`
   * - `OriginalValue` = `INopeStatusInfo`
   * - `ExtractedKey` = Dispatcher ID
   * - `ExtractedValue` = Dispatcher ID
   *
   * @author M.Karkowski
   * @memberof INopeStatusManager
   */
  dispatchers: IMapBasedMergeData<
    string, // Dispatcher ID
    INopeStatusInfo, // Orginal Message
    string, // Dispatcher ID
    string // Dispatcher ID
  >;

  /**
   * Options of the StatusManager.
   *
   * @author M.Karkowski
   * @type {INopeINopeConnectivityOptions}
   * @memberof INopeStatusManager
   */
  options: INopeINopeConnectivityOptions;

  /**
   * The utilized ID, which will be used
   * for the Status Messages etc.
   *
   * @author M.Karkowski
   * @type {string}
   * @memberof INopeStatusManager
   */
  readonly id: string;

  /**
   * The current info of this connectivity-manager.
   *
   * @author M.Karkowski
   * @type {INopeStatusInfo}
   * @memberof INopeConnectivityManager
   */
  readonly info: INopeStatusInfo;

  /**
   * Helper function, which will synchronize the Timestamp.
   * Timestamp must be provided in UTC (https://www.timeanddate.de/stadt/info/zeitzone/utc)
   *
   * @author M.Karkowski
   * @param {number} timestamp The UTC-Timestamp
   * @param {number} [delay=0] The Delay, since the Timestamp has been generated
   * @memberof INopeStatusManager
   */
  syncTime(timestamp: number, delay?: number): void;

  /**
   * Adapts the Timing Options and resets the internally used
   * Timers etc.
   *
   * @author M.Karkowski
   * @param {INopeINopeConnectivityTimeOptions} options
   * @memberof INopeStatusManager
   */
  setTimings(options: Partial<INopeINopeConnectivityTimeOptions>): void;

  /**
   * Emitts a Bonjour Message.
   *
   * @author M.Karkowski
   * @return {Promise<void>}
   * @memberof INopeStatusManager
   */
  emitBonjour(): Promise<void>;

  /**
   * Resets the System
   *
   * @author M.Karkowski
   * @memberof INopeStatusManager
   */
  reset(): void;

  /**
   * Disposes the StatusManager and thereby,
   *
   * @author M.Karkowski
   * @param {boolean} [quiet=false]
   * @return {Promise<void>}
   * @memberof INopeStatusManager
   */
  dispose(quiet?: boolean): Promise<void>;

  /**
   * Returns the Status of an other Manager.
   *
   * @author M.Karkowski
   * @param {string} id
   * @return {*}  {INopeStatusInfo}
   * @memberof INopeStatusManager
   */
  getStatus(id: string): INopeStatusInfo;

  /**
   * Returns all connected Hosts.
   *
   * @author M.Karkowski
   * @return {*}  {string[]}
   * @memberof INopeConnectivityManager
   */
  getAllHosts(): string[];

  /**
   * Function to describe the System.
   */
  toDescription(): {
    dispatchers: string[];
  };

  /**
   * Flag, showing, that we
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof INopeDispatcher
   */
  isMaster: boolean;

  /**
   * Returns the current timestamp.
   *
   * @author M.Karkowski
   * @type {number}
   * @memberof INopeConnectivityManager
   */
  readonly now: number;

  /**
   * The time since the systeme is connected.
   *
   * @author M.Karkowski
   * @type {number}
   * @memberof INopeConnectivityManager
   */
  readonly upTime: number;

  /**
   * Timestamp of the connection since it has been established.
   *
   * @author M.Karkowski
   * @type {number}
   * @memberof INopeConnectivityManager
   */
  readonly connectedSince: number;

  /**
   * Returns the Status of the Master.
   *
   * @author M.Karkowski
   * @type {INopeStatusInfo}
   * @memberof INopeConnectivityManager
   */
  readonly master: INopeStatusInfo;
}
