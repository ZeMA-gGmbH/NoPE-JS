/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2022-01-06 07:15:22
 * @modify date 2022-01-06 09:03:30
 * @desc [description]
 */

import { registerGarbageCallback } from "../../helpers/gc";
import { generateId } from "../../helpers/idMethods";
import { defineNopeLogger } from "../../logger/getLogger";
import { ILogger, INFO } from "../../logger/index.browser";
import { DataPubSubSystem, PubSubSystem } from "../../pubSub";
import {
  ICommunicationBridge,
  IDataPubSubSystem,
  INopeConnectivityManager,
  INopeCore,
  INopeDispatcherOptions,
  INopeEventEmitter,
  INopeInstanceManager,
  INopeObservable,
  INopeRpcManager,
  IPubSubSystem,
} from "../../types/nope";
import { NopeConnectivityManager } from "../ConnectivityManager";
import {
  generateAssignmentChecker,
  NopeInstanceManager,
} from "../InstanceManager";
import { generateSelector, NopeRpcManager } from "../RpcManager";

export class NopeCore implements INopeCore {
  protected _logger: ILogger;

  public ready: INopeObservable<boolean>;

  public readonly communicator: ICommunicationBridge;
  public readonly eventDistributor: IPubSubSystem;
  public readonly dataDistributor: IDataPubSubSystem;
  public readonly connectivityManager: INopeConnectivityManager;
  public readonly rpcManager: INopeRpcManager;
  public readonly instanceManager: INopeInstanceManager;

  constructor(
    public options: INopeDispatcherOptions,
    protected generateEmitter: <T>() => INopeEventEmitter<T>,
    protected generateObservable: <T>() => INopeObservable<T>,
    public readonly id: string = null
  ) {
    // Store the communicator:
    this.communicator = options.communicator;

    if (id == null) {
      if (options.id) {
        this.id = options.id;
      } else {
        this.id = generateId();
      }
    }
    this._logger = defineNopeLogger(options.logger, `core.rpc-manager`);

    if (this._logger?.enabledFor(INFO)) {
      this._logger.info("setting up sub-systems.");
    }

    this.eventDistributor = new PubSubSystem();
    this.dataDistributor = new DataPubSubSystem();

    const defaultSelector = generateSelector(
      options.defaultSelector || "first",
      this
    );

    // Creating the Connectivity Manager:
    this.connectivityManager = new NopeConnectivityManager(
      options,
      generateObservable,
      this.id
    );

    // Create our RPC-Manger.
    this.rpcManager = new NopeRpcManager(
      options,
      generateObservable,
      defaultSelector,
      this.id,
      this.connectivityManager
    );

    // Create our Instance Manager
    this.instanceManager = new NopeInstanceManager(
      options,
      generateEmitter,
      generateObservable,
      defaultSelector,
      this.id,
      this.connectivityManager,
      this.rpcManager,
      this
    );

    this.ready = generateObservable();
    this.ready.getter = () => {
      return (
        this.connectivityManager.ready.getContent() &&
        this.rpcManager.ready.getContent() &&
        this.instanceManager.ready.getContent()
      );
    };

    const rcvExternally = generateId();

    // 1. Subscribe to the events:
    this.communicator.on("event", (msg) => {
      if (msg.sender !== this.id) {
        // split the Message in segments
        const { path, data, ...options } = msg;
        // Now, we know, that we have updated the data
        // so, if there is an update, we will prevent this
        // by setting the sender to the external id
        options.sender = rcvExternally;
        // Push the Data.
        this.eventDistributor.emit(path, data, options);
      }
    });

    this.eventDistributor.onIncrementalDataChange.subscribe((item) => {
      if (item.sender !== rcvExternally) {
        this.communicator.emit("event", {
          ...item,
          sender: this.id,
        });
      }
    });

    // Link the Data-Distributor:
    // 1. Subscribe to the changes:
    this.communicator.on("dataChanged", (msg) => {
      if (msg.sender !== this.id) {
        // split the Message in segments
        const { path: name, data, ...options } = msg;

        // We will prevent to
        options.sender = rcvExternally;

        // Push the Data.
        this.dataDistributor.pushData(name, data, options);
      }
    });

    // 2. Enable emitting the updates
    this.dataDistributor.onIncrementalDataChange.subscribe((item) => {
      if (item.sender !== rcvExternally) {
        this.communicator.emit("dataChanged", {
          ...item,
          sender: this.id,
        });
      }
    });

    this.connectivityManager.ready.subscribe((_) => {
      this.ready.forcePublish();
    });

    this.rpcManager.ready.subscribe((_) => {
      this.ready.forcePublish();
    });

    this.instanceManager.ready.subscribe((_) => {
      this.ready.forcePublish();
    });

    this.disposing = false;

    registerGarbageCallback(this, this.dispose.bind(this));
  }

  // See interface description
  public async dispose() {
    this.disposing = true;

    await this.ready.dispose();
    await this.eventDistributor.dispose();
    await this.dataDistributor.dispose();
    await this.connectivityManager.dispose();
    await this.rpcManager.dispose();
    await this.instanceManager.dispose();
  }

  public disposing: boolean;

  public toDescription() {
    const ret = {
      ...this.connectivityManager.info,
      ready: this.ready.getContent(),
      bridge: this.options.communicator.toDescription(),
      eventDistributor: this.eventDistributor.toDescription(),
      dataDistributor: this.dataDistributor.toDescription(),
      connectivityManager: this.connectivityManager.toDescription(),
      rpcManager: this.rpcManager.toDescription(),
      instanceManager: this.instanceManager.toDescription(),
    };
    return ret;
  }
}
