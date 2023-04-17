// /**
//  * @author Martin Karkowski
//  * @email m.karkowski@zema.de
//  * @create date 2021-10-19 00:10:54
//  * @modify date 2021-10-19 00:10:54
//  * @desc [description]
//  */

// import { runNopeBackend } from "../cli/runNopeBackend";
// import { EventCommunicationInterface } from "../communication/layers/EventCommunicationInterface";
// import { LoggerLevel } from "../logger/nopeLogger";
// import { NopeObservable } from "../observables/nopeObservable";
// import { INopeDispatcher } from "../types/nope/nopeDispatcher.interface";
// import { IEventOptions } from "../types/nope/nopeModule.interface";
// import { INopeObservable } from "../types/nope/nopeObservable.interface";
// import { INopePackageLoader } from "../types/nope/nopePackageLoader.interface";

// /**
//  * Helper to generate multiple loaders, which are connected using an event-mirror.
//  *
//  * @author M.Karkowski
//  * @export
//  * @param {number} [amount=2]
//  * @return {*}  {Promise<INopePackageLoader[]>}
//  */
// export async function generateConnectedLoaders(
//   options: {
//     amount?: number;
//     useAlive?: boolean;
//     logLevel?: LoggerLevel;
//   } = {}
// ): Promise<INopePackageLoader[]> {
//   const opts = Object.assign(
//     {
//       amount: 2,
//       useAlive: false,
//       logLevel: "debug",
//     },
//     options
//   );

//   // Make shure we define at least 1 Loader.
//   opts.amount = Math.max(opts.amount, 1);

//   const loaders: INopePackageLoader[] = [];
//   const mirror = new EventCommunicationInterface();

//   // Now iterate over the elements.
//   for (let i = 0; i < opts.amount; i++) {
//     // Create the loader
//     const loader = await runNopeBackend({
//       skipLoadingConfig: true,
//       log: opts.logLevel,
//       channel: "event",
//       singleton: false,
//       dispatcherLogLevel: opts.logLevel,
//       communicationLogLevel: opts.logLevel,
//       timings: opts.useAlive
//         ? {}
//         : {
//             checkInterval: 0,
//             sendAliveInterval: 0,
//           },
//     });

//     // Add the Mirror
//     await loader.dispatcher.communicator.addMirror(mirror);

//     // Store the loader
//     loaders.push(loader);
//   }

//   // Wait for all dispatchers to be ready
//   await Promise.all(loaders.map((loader) => loader.dispatcher.ready.waitFor()));

//   return loaders;
// }

// /**
//  * Helper to create an Observable and register it at the given dispatcher.
//  *
//  * @author M.Karkowski
//  * @export
//  * @template T
//  * @param {INopeDispatcher} dispatcher The Dispatcher where the observable should be added
//  * @param {IPropertyOptions} options Options for the register-function
//  * @param {T} [data] initial data to set.
//  * @return {*}  {Promise<INopeObservable<T>>}
//  */
// export async function addObervableToDispatcher<T>(
//   dispatcher: INopeDispatcher,
//   options: IPropertyOptions,
//   data?: T
// ): Promise<INopeObservable<T>> {
//   // Create the observable
//   const observable = new NopeObservable<T>();

//   // Add the data if defined
//   if (data !== undefined) observable.setContent(data);

//   // Register the data.
//   await dispatcher.registerObservable(observable, options);

//   // Return the observable
//   return observable;
// }
