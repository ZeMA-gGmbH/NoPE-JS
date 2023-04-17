/**
 * @module connectivityManager
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 *
 * # NoPE - Connectivity Manager
 *
 * The following elements are exported:
 * - {@link INopeConnectivityManager},
 * - {@link INopeINopeConnectivityOptions},
 * - {@link INopeINopeConnectivityTimeOptions},
 * - {@link NopeConnectivityManager}
 *
 * The NoPE-Dispatcher uses one `ConnectivityManager`. The manager observes the connection and remotly connected dispatchers (and their `ConnectivityManager`).
 * The Manager detects newly connected dispatchers and disconnected dispatchers. Additionally, it sends a StatusMessage (in the form of `INopeStatusInfo`).
 * This status message is interpreted as heartbeat. The `ConnectivityManager` checks those heartbeats with a defined interval. If a specific amount of time is
 * ellapsed, the remote dispatcher is marked as `slow` -> `warning` -> `dead`. After an additional delay in the state `dead` the dispatcher is altough removed.
 *
 * ## Master
 *
 * Defaultly a `ConnectivityManager` is elected as `master`. The master is defined as the `ConnectivityManager` with the highest `upTime`.
 *
 * > Alternativly a master can be forced.
 *
 * ## Synchronizing time
 *
 * Because we asume, that **NoPE** is running on different computing nodes, we have to be able to synchronize the time between those elements. Therefore the
 * `ConnectivityManager` is able to sync the time (by providing a `timestamp` and an additional `delay` that was needed to get to the call (for instance `ping / 2`))
 *
 *
 *
 * ```javascript
 * // First lets install nope using npm
 * const nope = require("../dist-nodejs/index.nodejs")
 *
 * // Create a communicator:
 * // We will use the event layer (which just runs internally)
 * const communicator = nope.getLayer("event");
 *
 * // Lets create our dispatcher
 *
 * // 1. Dispatcher simulates our local system
 * const localDispatcher = nope.dispatcher.getDispatcher({
 *   communicator,
 *   id: "local"
 * }, {
 *   singleton: false,
 *   useBaseServices: false
 * });
 * ```
 *
 * > For Jupyter we need an extra async wrapper to wait for initalizing the dispatcher:
 *
 * see here for the details in Jupyter: https://n-riesco.github.io/ijavascript/doc/async.ipynb.html
 *
 *
 * ```javascript
 * $$.async();
 * // Lets wait for our element to be ready.
 * localDispatcher.ready.waitFor().then($$.done);
 * ```
 *
 * Now we want to listen to newly connected dispatchers. For this purpose, we create an observer, which will listen to changes.
 *
 *
 * ```javascript
 * // Subscribe to changes
 * const observer = localDispatcher.connectivityManager.dispatchers.onChange.subscribe(data => {
 *   // Log the changes
 *   console.log((new Date()).toISOString(),"onChange - listener");
 *   console.log("\tadded   =", data.added);
 *   console.log("\tremoved =", data.removed);
 * });
 * ```
 *
 * Additionally we want to show the currently connected dispatchers. In this data the own dispatcher will **allways** be included:
 *
 *
 * ```javascript
 * // Show our connected Dispatchers
 * let connectedDispatchers = localDispatcher.connectivityManager.dispatchers.data.getContent();
 * let localDispatcherIncluded = connectedDispatchers.includes(localDispatcher.id);
 *
 * // Now lets log our results.
 * console.log("connectedDispatchers    =", connectedDispatchers);
 * console.log("localDispatcherIncluded =", localDispatcherIncluded);
 * ```
 *
 * >```
 * >     connectedDispatchers    = [ 'local' ]
 * >     localDispatcherIncluded = true
 * >```
 *
 * Now that we have implemented our listeners and have seen the connected dispatchers (which is only the `"local"`-dispatchre), We will add an additional dispatcher. This should result in calling our `onChange`-listener. Additionally, we wait until our `remoteDispatcher` is initalized
 *
 *
 * ```javascript
 * // 2. Dispatcher simulates our remote system
 * const remoteDispatcher = nope.dispatcher.getDispatcher({
 *   communicator,
 *   id: "remote"
 * }, {
 *   singleton: false,
 *   useBaseServices: false
 * });
 *
 * ```
 *
 * >```
 * >     2022-01-20T11:39:55.766Z onChange - listener
 * >         added   = [ 'remote' ]
 * >         removed = []
 * >```
 *
 * Now we want to see, which system is the current master. This should be our `local`.
 *
 *
 * ```javascript
 * // We expect to be the master, because the localDispatcher has been created first.
 * console.log("master =", localDispatcher.connectivityManager.master.id);
 * ```
 *
 * >     `master = local`
 *
 *
 * We can now force the remote dispatcher to be our master, by setting the master. (For this purpose we can later use a base service ==> then we just have to call the service)
 *
 *
 * ```javascript
 * $$.async();
 *
 * remoteDispatcher.connectivityManager.isMaster = true;
 * localDispatcher.connectivityManager.isMaster = false;
 *
 * // Our messaging is async ==> we wait an amount of time
 * setTimeout(() => $$.done(),1000);
 * ```
 *
 *
 * ```javascript
 * // We expect the master to be the remote.
 * console.log("master =", localDispatcher.connectivityManager.master.id);
 * console.log("master-info =", localDispatcher.connectivityManager.master);
 * ```
 *
 * >```
 * >     master = remote
 * >     master-info = {
 * >       id: 'remote',
 * >       env: 'javascript',
 * >       version: '1.0.0',
 * >       isMaster: true,
 * >       host: {
 * >         cores: 8,
 * >         cpu: {
 * >           model: 'Intel(R) Core(TM) i7-8565U CPU',
 * >           speed: 1992,
 * >           usage: 0.0038778477944740875
 * >         },
 * >         os: 'win32',
 * >         ram: { usedPerc: 0.362681220626356, free: 20676, total: 32442 },
 * >         name: 'nz-078'
 * >       },
 * >       pid: 18068,
 * >       timestamp: 1642678798813,
 * >       upTime: 3049,
 * >       status: 0
 * >    }
 * >```
 *
 *
 * Now lets see what happens if we adapt the heartbeat intervall of our *local* instance. We want to receive every 50 ms a heartbeat:
 *
 *
 * ```javascript
 * $$.async()
 *
 * const renderStatus = () => {
 *   console.log((new Date()).toISOString(),"master-info =", localDispatcher.connectivityManager.master.status)
 * }
 *
 * setTimeout(renderStatus, 50);
 * setTimeout(renderStatus, 750);
 * setTimeout(renderStatus, 1500);
 * setTimeout(renderStatus, 2500);
 *
 *
 * localDispatcher.connectivityManager.setTimings({
 *   // our system will send every 50 ms an heartbeat.
 *   sendAliveInterval: 250,
 *   // we will check that after
 *   checkInterval: 125,
 *   // will mark dispatchers as slow after not receiving heartbeats for 50ms
 *   slow: 500,
 *   // we will mark  dispatchers with a warning flag after 50 ms
 *   warn: 1000,
 *   // we mark it as dead after 0.5 s
 *   dead: 2000,
 *   // We will remove the dispatcher after 1 s
 *   remove: 3000,
 * });
 *
 * remoteDispatcher.connectivityManager.setTimings({
 *   // our system will send every 50 ms an heartbeat.
 *   sendAliveInterval: 5000,
 * });
 *
 *
 *
 * // We reset the timeouts.
 * setTimeout(() => localDispatcher.connectivityManager.setTimings({}), 3000);
 * setTimeout(() => remoteDispatcher.connectivityManager.setTimings({}), 3000);
 * setTimeout(() => $$.done(), 5000);
 *
 * ```
 *
 * >```
 * >     2022-01-20T11:40:01.089Z master-info = 0
 * >     2022-01-20T11:40:01.789Z master-info = 1
 * >     2022-01-20T11:40:02.536Z master-info = 2
 * >     2022-01-20T11:40:03.543Z master-info = 3
 * >     2022-01-20T11:40:03.977Z onChange - listener
 * >       added   = []
 * >       removed = [ 'remote' ]
 * >     2022-01-20T11:40:04.547Z onChange - listener
 * >       added   = [ 'remote' ]
 * >       removed = []
 * >```
 *
 */

export {
  INopeConnectivityManager,
  INopeINopeConnectivityOptions,
  INopeINopeConnectivityTimeOptions,
} from "../../types/nope/nopeConnectivityManager.interface";
export { NopeConnectivityManager } from "./ConnectivityManager";
