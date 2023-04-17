/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2022-01-05 17:39:13
 * @modify date 2022-01-05 18:15:19
 * @desc [description]
 */

import { ICommunicationBridge } from "./nopeCommunication.interface";
import {
  INopeConnectivityManager,
  INopeStatusInfo,
} from "./nopeConnectivityManager.interface";
import { INopeInstanceManager } from "./nopeInstanceManager.interface";
import { INopeObservable } from "./nopeObservable.interface";
import { IDataPubSubSystem, IPubSubSystem } from "./nopePubSub.interface";
import { INopeRpcManager } from "./nopeRpcManager.interface";

/**
 * The Core Of NoPE
 *
 * @author M.Karkowski
 * @export
 * @interface INopeCore
 */
export interface INopeCore {
  /**
   * Flag showing, that the system is ready.
   *
   * @author M.Karkowski
   * @type {INopeObservable<boolean>}
   * @memberof INopeCore
   */
  readonly ready: INopeObservable<boolean>;

  /**
   * ID of the Dispatcher
   *
   * @type {string}
   * @memberof INopeCore
   */
  readonly id: string;

  /**
   * The Communicator which is used
   *
   * @author M.Karkowski
   * @type {ICommunicationBridge}
   * @memberof INopeCore
   */
  readonly communicator: ICommunicationBridge;

  /**
   * Pub-Sub-System to share the events across the system.
   * Events wont retain after they have been fired. You can
   * just subscribe to events.
   *
   * @author M.Karkowski
   * @type {IPubSubSystem}
   * @memberof INopeCore
   */
  readonly eventDistributor: IPubSubSystem;

  /**
   * Pub-Sub-System to share the properties and their sub
   * properties acorss the entire network.
   *
   * @author M.Karkowski
   * @type {IDataPubSubSystem}
   * @memberof INopeCore
   */
  readonly dataDistributor: IDataPubSubSystem;

  /**
   * System to manage the connectitivy of other dispatchers.
   *
   * @author M.Karkowski
   * @type {INopeConnectivityManager}
   * @memberof INopeCore
   */
  readonly connectivityManager: INopeConnectivityManager;

  /**
   * Manager to execute and perform different
   *
   * @author M.Karkowski
   * @type {INopeRpcManager}
   * @memberof INopeCore
   */
  readonly rpcManager: INopeRpcManager;

  /**
   * A Manager, which is capable of creating instance on different Managers in the Network.
   *
   * @author M.Karkowski
   * @type {INopeInstanceManager}
   * @memberof INopeCore
   */
  readonly instanceManager: INopeInstanceManager;

  /**
   * A Flag, that indicates, that the core is disposing.
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof INopeCore
   */
  disposing: boolean;

  toDescription(): {
    ready: boolean;
    eventDistributor: ReturnType<IPubSubSystem["toDescription"]>;
    bridge: ReturnType<ICommunicationBridge["toDescription"]>;
    dataDistributor: ReturnType<IDataPubSubSystem["toDescription"]>;
    connectivityManager: ReturnType<INopeConnectivityManager["toDescription"]>;
    rpcManager: ReturnType<INopeRpcManager["toDescription"]>;
    instanceManager: ReturnType<INopeInstanceManager["toDescription"]>;
  } & INopeStatusInfo;
}
