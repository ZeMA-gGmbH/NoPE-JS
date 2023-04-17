/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2022-01-03 21:21:45
 * @modify date 2022-01-10 14:10:00
 * @desc [description]
 */

import { ILogger } from "js-logger";
import { avgOfArray, minOfArray } from "../../helpers/arrayMethods";
import { generateId } from "../../helpers/idMethods";
import { MapBasedMergeData } from "../../helpers/mergedData";
import { RUNNINGINNODE } from "../../helpers/runtimeMethods";
import { registerGarbageCallback } from "../../helpers/gc";
import { defineNopeLogger } from "../../logger/getLogger";
import { DEBUG, WARN } from "../../logger/index.browser";
import {
  ENopeDispatcherStatus,
  ICommunicationBridge,
  IMapBasedMergeData,
  INopeConnectivityManager,
  INopeINopeConnectivityOptions,
  INopeINopeConnectivityTimeOptions,
  INopeObservable,
  INopeStatusInfo,
} from "../../types/nope";

// Chached Moduls, which will be loaded in nodejs
let os = null;
let cpus = null;

// The Naviagtor for the Browser
declare const navigator;

/**
 * A Modul to manage the status of other statusmanagers.
 * Dispatcher should have a status manager, to ensure, the
 * system is online etc. Its a base implemetation of the
 * {@link INopeConnectivityManager}. Please checkout the interface
 * for more details or the corresponding jupyter notebook.
 *
 * @author M.Karkowski
 * @export
 * @class NopeConnectivityManager
 * @implements {INopeConnectivityManager}
 */
export class NopeConnectivityManager implements INopeConnectivityManager {
  protected _logger: ILogger;
  protected _deltaTime = 0;
  protected _connectedSince: number;

  /**
   * The used Communication interface
   *
   * @type {ICommunicationBridge}
   * @memberof NopeConnectivityManager
   */
  protected readonly _communicator: ICommunicationBridge;

  /**
   * A Map holding the current Status of external dispatchers.
   * Key = Dispatcher-ID
   * Value = Last Known status of the dispatcher
   *
   * @protected
   * @type {Map<string, INopeStatusInfo>}
   * @memberof NopeConnectivityManager
   */
  protected _externalDispatchers: Map<string, INopeStatusInfo>;

  /**
   * Timeout settings. This will define the Timers etc.
   *
   * @author M.Karkowski
   * @protected
   * @type {INopeINopeConnectivityTimeOptions}
   * @memberof NopeConnectivityManager
   */
  protected _timeouts: INopeINopeConnectivityTimeOptions;

  protected _checkInterval: any = null; // Timer to check the status
  protected _sendInterval: any = null; // Timer to send the status
  protected _cpuInterval: any = null; // Timer to update the CPU-Load

  /**
   * Internal var to hold the cpu-load
   *
   * @author M.Karkowski
   * @protected
   * @memberof NopeConnectivityManager
   */
  protected _cpuLoad = -1;

  public readonly ready: INopeObservable<boolean>;
  public readonly dispatchers: IMapBasedMergeData<
    string, // Dispatcher ID
    INopeStatusInfo, // Orginal Message
    string, // Dispatcher ID
    string // Dispatcher ID
  >;

  /**
   * see {@link INopeConnectivityManager.info}
   *
   * @author M.Karkowski
   * @readonly
   * @type {INopeStatusInfo}
   * @memberof NopeConnectivityManager
   */
  public get info() {
    return this._info();
  }

  /**
   * Helper to extract the info of the dispatcher.
   * @returns
   */
  protected _info(): INopeStatusInfo {
    if (RUNNINGINNODE) {
      // If we are running our programm in node,
      // we will load the corresponding libs,
      // to calc the cpu load etc.

      if (os === null) {
        // eslint-disable-next-line
        os = require("os");
      }
      if (cpus === null) {
        // eslint-disable-next-line
        cpus = os.cpus();
      }

      // Now lets return our status message
      return {
        id: this.id,
        env: "javascript",
        version: "1.0.0",
        isMaster: this.isMaster,
        isMasterForced: typeof this.__isMaster === "boolean",
        host: {
          cores: cpus.length,
          cpu: {
            model: `${cpus[0].model}`.slice(
              0,
              (cpus[0].model as string).indexOf("@") - 1
            ),
            speed: avgOfArray(cpus, "speed"),
            usage: this._cpuLoad,
          },
          os: os.platform(),
          ram: {
            // Return the used Memory
            usedPerc: 1 - os.freemem() / os.totalmem(),
            // The Values are given in Byte but we want MByte
            free: Math.round(os.freemem() / 1048576),
            total: Math.round(os.totalmem() / 1048576),
          },
          name: os.hostname(),
        },
        pid: process.pid,
        timestamp: this.now,
        connectedSince: this.connectedSince,
        status: ENopeDispatcherStatus.HEALTHY,
        plugins: [],
      };
    }
    return {
      env: "javascript",
      version: "1.0.0",
      isMaster: this.isMaster,
      isMasterForced: typeof this.__isMaster === "boolean",
      host: {
        cores: -1,
        cpu: {
          model: "unkown",
          speed: -1,
          usage: -1,
        },
        name: navigator.appCodeName + " " + navigator.appName,
        os: navigator.platform,
        ram: {
          free: -1,
          usedPerc: -1,
          total: -1,
        },
      },
      id: this.id,
      pid: this.id,
      timestamp: this.now,
      connectedSince: this.connectedSince,
      status: ENopeDispatcherStatus.HEALTHY,
      plugins: [],
    };
  }

  /**
   * Creates an instance of NopeConnectivityManager.
   * @author M.Karkowski
   * @param {INopeINopeConnectivityOptions} options The Options, used by the Manager.
   * @param {<T>() => INopeObservable<T>} _generateObservable A Helper, to generate Observables.
   * @param {string} [id=null] specific id. Otherwise a ID is generated
   * @memberof NopeConnectivityManager
   */
  constructor(
    public options: INopeINopeConnectivityOptions,
    protected _generateObservable: <T>() => INopeObservable<T>,
    public readonly id: string = null
  ) {
    this._communicator = options.communicator;
    this._connectedSince = Date.now();

    this.__isMaster =
      typeof options.isMaster === "boolean" ? options.isMaster : null;

    if (id === null) {
      this.id = generateId();
    }

    this._logger = defineNopeLogger(
      options.logger,
      "core.connectivity-manager"
    );

    // Update the Timesettings
    this.setTimings(options.timeouts || {});

    // Flag to show if the system is ready or not.
    this.ready = this._generateObservable();
    this.ready.setContent(false);

    // Observable containing all Dispatcher Informations.
    this._externalDispatchers = new Map();
    this.dispatchers = new MapBasedMergeData(this._externalDispatchers, "id");

    if (this._logger) {
      this._logger.info("core.connectivity-manager", this.id, "is ready");
    }

    this.reset();
    const _this = this;
    this._init().catch((error) => {
      if (_this._logger) {
        _this._logger.error("Failed to intialize status manager");
        _this._logger.error(error);

        // Now we should exit the program (if we are running in nodejs)
        if (RUNNINGINNODE) {
          process.exit(1);
        }
      }
    });

    registerGarbageCallback(this, this.dispose.bind(this));
  }

  /**
   * see {@link INopeConnectivityManager.upTime}
   *
   * @author M.Karkowski
   * @readonly
   * @type {number}
   * @memberof NopeConnectivityManager
   */
  public get upTime(): number {
    return Date.now() - this._connectedSince;
  }

  /**
   * see {@link INopeConnectivityManager.connectedSince}
   *
   * @author M.Karkowski
   * @readonly
   * @type {number}
   * @memberof NopeConnectivityManager
   */
  public get connectedSince(): number {
    return this._connectedSince + this._deltaTime;
  }

  /**
   * Internal value to store the Master.
   *
   * @author M.Karkowski
   * @protected
   * @type {boolean}
   * @memberof NopeConnectivityManager
   */
  protected __isMaster: boolean;

  /**
   * see {@link INopeConnectivityManager.isMaster}
   *
   * @author M.Karkowski
   * @memberof NopeConnectivityManager
   */
  public set isMaster(value: boolean | null) {
    this.__isMaster = value;
    // We want to forward our new status.
    this._sendStatus();
  }

  /**
   * see {@link INopeConnectivityManager.isMaster}
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof NopeConnectivityManager
   */
  public get isMaster(): boolean {
    if (typeof this.__isMaster !== "boolean") {
      try {
        return this.id == this.master.id;
      } catch (e) {
        return false;
      }
    }
    return this.__isMaster;
  }

  /**
   * Helper, to extract the possible-masters
   * @returns
   */
  protected _getPossibleMasterCandidates() {
    const possibleMasters: INopeStatusInfo[] = [];

    for (const info of this.dispatchers.originalData.values()) {
      if (info.isMasterForced && !info.isMaster) {
        continue;
      }

      possibleMasters.push(info);
    }

    return possibleMasters;
  }

  /**
   * see {@link INopeConnectivityManager.master}
   *
   * @author M.Karkowski
   * @readonly
   * @type {INopeStatusInfo}
   * @memberof NopeConnectivityManager
   */
  public get master(): INopeStatusInfo {
    const candidates = this._getPossibleMasterCandidates();
    const masters = candidates.filter((item) => {
      return item.isMaster && item.isMasterForced;
    });

    if (masters.length === 0) {
      const idx = minOfArray(candidates, "connectedSince").index;
      if (idx !== -1) {
        return candidates[idx];
      }

      throw Error("No Master has been found !");
    } else if (masters.length > 1) {
      throw Error(
        "Multiple Masters has been found!" +
          JSON.stringify(masters, undefined, 4)
      );
    }

    return masters[0];
  }

  /**
   * see {@link INopeConnectivityManager.now}
   *
   * @author M.Karkowski
   * @readonly
   * @type {number}
   * @memberof NopeConnectivityManager
   */
  public get now(): number {
    return Date.now() + this._deltaTime;
  }

  /**
   * Internal Function, used to initialize the Dispatcher.
   * It subscribes to the "Messages" of the communicator.
   *
   * @protected
   * @memberof NopeConnectivityManager
   */
  protected async _init(): Promise<void> {
    const _this = this;

    this.ready.setContent(false);

    // Now lets wait until we are ready.
    // Everytime, we reconnect, we will adapt
    this._communicator.connected.subscribe((connected) => {
      if (connected) {
        // Now we are up.
        this._connectedSince = Date.now();
        this._sendStatus(true).catch((e) =>
          this._logger.error("Failed to send status!", e)
        );
        this.emitBonjour().catch((e) =>
          this._logger.error("Failed to send status!", e)
        );
      }
    });

    // Wait until the Element is connected.
    await this._communicator.connected.waitFor();

    await this._communicator.on("statusChanged", (info) => {
      _this._externalDispatchers.set(info.id, info);

      // If there is an update, we have to make shure, that our information
      // is propageted correctly.
      if (info.id !== _this.id) {
        _this._externalDispatchers.set(_this.id, _this.info);
      }

      _this.dispatchers.update();
    });

    await this._communicator.on("bonjour", (opts) => {
      if (_this.id !== opts.dispatcherId) {
        if (_this._logger?.enabledFor(DEBUG)) {
          // If there is a Logger:
          _this._logger.debug(
            'Remote Dispatcher "' + opts.dispatcherId + '" went online'
          );
        }

        // Say Hello by sending the Status
        _this._sendStatus(true);
      }
    });

    await this._communicator.on("aurevoir", (msg) => {
      // Remove the Dispatcher.
      _this._externalDispatchers.delete(msg.dispatcherId);
      _this.dispatchers.update();
    });

    if (this._logger) {
      this._logger.info("core.connectivity-manager", this.id, "initialized");
    }

    this.ready.setContent(true);

    await this.emitBonjour();
    await this._sendStatus(true);
  }

  /**
   * Function, which will be called to update the
   * Status to the Dispatchers
   *
   * @author M.Karkowski
   * @protected
   * @memberof NopeConnectivityManager
   */
  protected _checkDispatcherHealth(): void {
    // If no other Dispatcher is present,
    // This test is Obsolete
    if (this._externalDispatchers.size <= 1) {
      return;
    }

    const currentTime = this.now;
    let changes = false;

    for (const status of this._externalDispatchers.values()) {
      // determine the Difference
      const diff = currentTime - status.timestamp;

      // Based on the Difference Determine the Status
      if (diff > this._timeouts.remove) {
        // remove the Dispatcher. But be quiet.
        // Perhaps more dispatchers will be removed
        this._removeDispatcher(status.id, true);
        changes = true;
      } else if (
        diff > this._timeouts.dead &&
        status.status !== ENopeDispatcherStatus.DEAD
      ) {
        status.status = ENopeDispatcherStatus.DEAD;
        changes = true;
      } else if (
        diff > this._timeouts.warn &&
        diff <= this._timeouts.dead &&
        status.status !== ENopeDispatcherStatus.WARNING
      ) {
        status.status = ENopeDispatcherStatus.WARNING;
        changes = true;
      } else if (
        diff > this._timeouts.slow &&
        diff <= this._timeouts.warn &&
        status.status !== ENopeDispatcherStatus.SLOW
      ) {
        status.status = ENopeDispatcherStatus.SLOW;
        changes = true;
      } else if (
        diff <= this._timeouts.slow &&
        status.status !== ENopeDispatcherStatus.HEALTHY
      ) {
        status.status = ENopeDispatcherStatus.HEALTHY;
        changes = true;
      }
    }

    if (changes) {
      // Update the External Dispatchers
      this.dispatchers.update();
    }
  }

  /**
   * Removes a Dispatcher.
   *
   * @author M.Karkowski
   * @protected
   * @param {string} dispatcher The Id of the dispatcher
   * @param {boolean} [quiet=false] if set to quiet, the *dispatchers* attribute wont be udpated.
   * @memberof NopeConnectivityManager
   */
  protected _removeDispatcher(dispatcher: string, quiet = false): void {
    // Delete the Generators of the Instances.
    const dispatcherInfo = this._externalDispatchers.get(dispatcher);
    const deleted = this._externalDispatchers.delete(dispatcher);

    if (!quiet) {
      this.dispatchers.update();
    }

    if (deleted && this._logger?.enabledFor(WARN)) {
      // If there is a Logger:
      this._logger.warn(
        "a dispatcher on",
        dispatcherInfo?.host.name || "unkown",
        "went offline. ID of the Dispatcher: ",
        dispatcher
      );
    }
  }

  /**
   * Helper to send the current status to other statusmanagers.
   *
   * @author M.Karkowski
   * @protected
   * @memberof NopeConnectivityManager
   */
  protected async _sendStatus(forced = false): Promise<void> {
    // Test if we are connected
    if (this._communicator.connected.getContent()) {
      try {
        const info = this.info;
        this._externalDispatchers.set(this.id, info);

        // Only Send the Update if there are multiple Dispatchers.
        if (forced || this._externalDispatchers.size > 1) {
          await this._communicator.emit("statusChanged", info);
        }
      } catch (e) {
        this._logger.error("Failled to send the status");
      }
    }
  }

  /**
   * see {@link INopeConnectivityManager.syncTime}
   *
   * @author M.Karkowski
   * @param {number} timestamp
   * @param {number} [delay=0]
   * @memberof NopeConnectivityManager
   */
  public syncTime(timestamp: number, delay = 0) {
    const _internalTimestamp = Date.now();
    this._deltaTime = _internalTimestamp - timestamp - delay;
  }

  /**
   * see {@link INopeConnectivityManager.getStatus}
   *
   * @author M.Karkowski
   * @param {string} id
   * @return {*}
   * @memberof NopeConnectivityManager
   */
  public getStatus(id: string) {
    return this._externalDispatchers.get(id);
  }

  /**
   * see {@link INopeConnectivityManager.emitBonjour}
   *
   * @author M.Karkowski
   * @return {Promise<void>}
   * @memberof NopeConnectivityManager
   */
  public async emitBonjour(): Promise<void> {
    // Emit the Bonjour Message.
    this._communicator.emit("bonjour", { dispatcherId: this.id });
  }

  /**
   * see {@link INopeConnectivityManager.reset}
   *
   * @author M.Karkowski
   * @memberof NopeConnectivityManager
   */
  public reset(): void {
    this._externalDispatchers.clear();
    this.dispatchers.update(this._externalDispatchers);
  }

  /**
   * see {@link INopeConnectivityManager.setTimings}
   *
   * @author M.Karkowski
   * @param {Partial<INopeINopeConnectivityTimeOptions>} options
   * @memberof NopeConnectivityManager
   */
  public setTimings(options: Partial<INopeINopeConnectivityTimeOptions>): void {
    // Clear all Intervals etc.
    this.dispose(true);

    const _this = this;

    this._timeouts = {
      sendAliveInterval: 500,
      checkInterval: 250,
      slow: 1000,
      warn: 2000,
      dead: 5000,
      remove: 10000,
    };

    // Define the Timeouts.
    if (options) {
      this._timeouts = Object.assign(this._timeouts, options);
    }

    if (RUNNINGINNODE) {
      // eslint-disable-next-line
      const os = require("os");

      const getLoad = () => {
        const cpus = os.cpus();
        let totalTime = 0;
        let idleTime = 0;

        // Determine the current load:
        for (const cpu of cpus) {
          for (const name in cpu.times) {
            totalTime += cpu.times[name];
          }
          idleTime += cpu.times.idle;
        }

        return {
          totalTime,
          idleTime,
        };
      };

      // Initally store the load
      let oldTimes = getLoad();
      this._cpuInterval = setInterval(() => {
        // Get the current CPU Times.
        const currentTimes = getLoad();
        // Determine the difference between the old Times an the current Times.
        _this._cpuLoad =
          1 -
          (currentTimes.idleTime - oldTimes.idleTime) /
            (currentTimes.totalTime - oldTimes.totalTime);
        // Store the current CPU-Times
        oldTimes = currentTimes;
      }, this._timeouts.sendAliveInterval);
    }

    // Setup Test Intervals:
    if (this._timeouts.checkInterval > 0) {
      // Define a Checker, which will test the status
      // of the external Dispatchers.
      this._checkInterval = setInterval(() => {
        _this._checkDispatcherHealth();
      }, this._timeouts.checkInterval);
    }

    if (this._timeouts.sendAliveInterval > 0) {
      // Define a Timer, which will emit Status updates with
      // the disered delay.
      this._sendInterval = setInterval(() => {
        _this._sendStatus();
      }, this._timeouts.sendAliveInterval);
    }
  }

  /**
   * see {@link INopeConnectivityManager.getAllHosts}
   *
   * @author M.Karkowski
   * @return {*}  {string[]}
   * @memberof NopeConnectivityManager
   */
  public getAllHosts(): string[] {
    const hosts = new Set<string>();
    for (const info of this.dispatchers.originalData.values()) {
      hosts.add(info.host.name);
    }

    return Array.from(hosts);
  }

  /**
   * Will dispose the Dispatcher. Must be called on exit for a clean exit. Otherwise it is defined as dirty exits
   */
  public async dispose(quiet = false): Promise<void> {
    if (this._sendInterval) {
      clearInterval(this._sendInterval);
    }
    if (this._checkInterval) {
      clearInterval(this._checkInterval);
    }
    if (this._cpuInterval) {
      clearInterval(this._cpuInterval);
    }

    // Emits the aurevoir Message.
    if (!quiet) {
      this._communicator.emit("aurevoir", { dispatcherId: this.id });
    }
  }

  /**
   * Describes the Data.
   * @returns
   */
  public toDescription() {
    const ret = {
      dispatchers: this.dispatchers.data.getContent(),
    };
    return ret;
  }
}
