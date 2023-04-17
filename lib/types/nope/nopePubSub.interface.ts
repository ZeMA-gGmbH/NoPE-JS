/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { INopeDescriptor } from "./nopeDescriptor.interface";
import {
  IEventAdditionalData,
  IEventCallback,
  INopeEventEmitter,
  INopeObserver,
} from "./nopeEventEmitter.interface";
import { IMapBasedMergeData } from "./nopeHelpers.interface";
import { IEventOptions } from "./nopeModule.interface";
import { INopeObservable } from "./nopeObservable.interface";

export interface ITopicSetContentOptions extends IEventAdditionalData {
  topicOfSubscription: string;
  topicOfContent: string;
  topicOfChange: string;
}

/**
 * The Topic Type.
 */
export type INopeTopic<T = any, S = T, G = T> = INopeEventEmitter<
  T,
  S,
  G,
  ITopicSetContentOptions
>;

export type INopeTopicWithDirectAccess<T = any, S = T, G = T> = INopeObservable<
  T,
  S,
  G,
  ITopicSetContentOptions
>;

export interface IPubSubSystemConstructor {
  new (_generateObservable: <T>() => INopeEventEmitter<T>): IPubSubSystem;
}

/**
 * Options to define the behavior of a {@link IPubSubSystem}
 *
 * The **Default** settings are.
 *
 * ```typescript
 * {
 *   mqttPatternBasedSubscriptions: true,
 *   forwardChildData: true,
 *   forwardParentData: true,
 *   matchTopicsWithoutWildcards: true,
 * }
 * ```
 */
export interface IPubSubOptions {
  /**
   * If set to true, subscriptions with patterns will be handled
   * like on mqtt. Otherwise, we will distribute the content more
   * or lesss like on pattern less topic. ('#' and '+' in a topic
   * will cause an exception)
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof TPubSubOptions
   */
  mqttPatternBasedSubscriptions?: boolean;
  /**
   * Flag to enable propagation of child data.
   * Defaults to true. This will forward data changes, if
   * a subscriber is listening to `'a/b'` and data on `'a/b/c'` is
   * changed. The subscriber will receive an object like { ... , c: ... }
   * 
   * If set to false, these changes arent forwarded.
   
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof TPubSubOptions
   */
  forwardChildData?: boolean;
  /**
   * Flag to enable the propagation of parent
   * changed data. Defaults to true. This will forward data changes, if
   * a subscriber is listening to `'a/b/c'` and data on `'a/b'` is
   * changed. The subscriber will get the property `c` of the published object
   * on `'a/b'` (if it exists, otherwise it will receive null)
   *
   * If set to false, these changes arent forwarded.
   *
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof TPubSubOptions
   */
  forwardParentData?: boolean;

  /**
   * If enabled, the topics match without wildcards. (must be enabled for
   * the defined behavior in `forwardChildData` and `forwardParentData`)
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof TPubSubOptions
   */
  matchTopicsWithoutWildcards?: boolean;
}

/**
 *  Element, showing the changes, of data. This contains the path and the updated data.
 */
export interface IIncrementalChange extends IEventAdditionalData {
  path: string;
  data: unknown;
}

/***
 * Only used interanlly.
 */
export interface IPubSubEmitterOptions<
  AD extends ITopicSetContentOptions & {
    pubSubUpdate?: boolean;
  } = ITopicSetContentOptions
> {
  /**
   * The options for a event.
   */
  options: IEventOptions;
  /**
   * The Topic, to subscribe to. If set to `false` no update will be received via the system.
   */
  subTopic: string | false;
  /**
   * The Topic to publish the content to. If set to `false` no update will be emitted.
   */
  pubTopic: string | false;
  /**
   * For internal use only. A Callback to call if there is an update.
   */
  callback?: IEventCallback<unknown, AD>;
  /**
   * For internal use only.
   */
  observer?: INopeObserver;
}

/**
 * The default Publish and Subscribe System.
 *
 * The System contains of `publishers` and `subscribers` which are linked using `topics` (based on `strings`).
 * - To add new `publishers` or `subscribers` use the function: `register` and provide the required options (see {@link IPubSubSystem.register})
 * - To add new `subscriber` you can use the function : `registerSubscription` which will receive a topic and a `callback` (see {@link IPubSubSystem.registerSubscription})
 * - After adding `publishers` or `subscribers` you can change the behavior using `updateOptions` (see {@link IPubSubSystem.updateOptions})
 * - To remove `publishers` or `subscribers` use `unregister` (see {@link IPubSubSystem.unregister})
 * - to `emit` data use `emit`  (see {@link IPubSubSystem.emit})
 * - internally, if a subscriber / publisher is added, its options are changed or its removed, the pub sub system updates an matching structure. In the case you want to perform this manually execute {@link IPubSubSystem.updateMatching}
 * - to check which `publishers` and `subscribers` are present, checkout the corresponding properties.
 * - You can subscribe to incremental changes using the eventEmitter {@link IPubSubSystem.onIncrementalDataChange}
 * - If the pub-sub-system isnt needed any more `dispose` it!
 *
 * The publisher might be `observabes` or `eventEmitters`.
 *
 * The `IPubSubSystem` is implemented by the `PubSubSystemBase`-**Class**
 *
 * The Behavior may differ based on the settings. Your are not able to change these options, after the instance has been created. (see {@link IPubSubOptions} for details)
 * The **Default** of these options are settings are.
 *
 * ```typescript
 * {
 *   mqttPatternBasedSubscriptions: true,
 *   forwardChildData: true,
 *   forwardParentData: true,
 *   matchTopicsWithoutWildcards: true,
 * }
 * ```
 *
 *
 * # Example 1
 *
 * ```typescript
 * // Describe the required Test:
 * let pubSubSystem = new PubSubSystemBase({
 *   generateEmitterType: function () {
 *     return new NopeEventEmitter() as INopeEventEmitter;
 *   },
 * });
 *
 *
 * // Create a Publisher for the system:
 * let publisher: INopeEventEmitter = new NopeEventEmitter();
 *
 * pubSubSystem.register(publisher, {
 *   mode: "publish",
 *   schema: {},
 *   topic: "this/is/a/test",
 * });
 *
 * // Create a Subscriber
 * let subscriber: INopeEventEmitter = new NopeEventEmitter();
 *
 * subscriber = pubSubSystem.register(subscriber, {
 *   mode: "subscribe",
 *   schema: {},
 *   topic: "this/#",
 * });
 *
 * subscriber.subscribe(console.log);
 * publisher.emit("Hello World!"); // Logs the following => "Hello World!", {...}
 * ```
 *
 *
 * @author M.Karkowski
 * @export
 * @class PubSubSystem
 */
export interface IPubSubSystem<
  AD extends ITopicSetContentOptions = ITopicSetContentOptions,
  I extends INopeEventEmitter<
    unknown,
    unknown,
    unknown,
    AD
  > = INopeEventEmitter<unknown, unknown, unknown, AD>,
  O extends INopeTopic = INopeTopic
> {
  /**
   * Options which describe the Behavior
   *
   * @author M.Karkowski
   * @type {IPubSubOptions}
   * @memberof IPubSubSystem
   */
  readonly options: IPubSubOptions;

  /**
   * List all known Emitters in the System.
   */
  readonly emitters: {
    publishers: { name: string; schema: INopeDescriptor }[];
    subscribers: { name: string; schema: INopeDescriptor }[];
  };

  /**
   * Function to register an Observable. Please define the Options, to decide
   * whether the data of the observable should be published or subscribed.
   *
   * @author M.Karkowski
   * @param {I} emitter The Emitter to consider
   * @param {IEventOptions} options
   * @return {*}  {O}
   * @memberof IPubSubSystem
   */
  register(emitter: I, options: IEventOptions): O;

  /**
   * Function to update the options and there by the topics of an observable.
   *
   * @author M.Karkowski
   * @param {I} emitter The Emitter to consider
   * @param {IEventOptions} options The modified options
   * @memberof IPubSubSystem
   */
  updateOptions(emitter: I, options: IEventOptions): void;

  /**
   * Removes an observable of the Pub-Sub-System.
   *
   * @author M.Karkowski
   * @param {I} observable
   * @return {*}  {boolean}
   * @memberof IPubSubSystem
   */
  unregister(emitter: I): boolean;

  /**
   * A Helper, that allows the user to subscribe to changes. Therfore he must transmit
   *
   * @author M.Karkowski
   * @template T Expected Type of the content
   * @param {string} path The
   * @param {IEventCallback<T>} subscription
   * @return {*}  {INopeObserver}
   * @memberof IPubSubSystem
   */
  registerSubscription<T = unknown>(
    path: string,
    subscription: IEventCallback<T, AD>
  ): INopeObserver;

  /**
   * Emits an Events and all subscribes, where the pattern matches
   * will be informed
   *
   * @author M.Karkowski
   * @param {string} path The Topic.
   * @param {*} data The Data of the Event.
   * @param {AD} options
   * @memberof IPubSubSystem
   */
  emit(path: string, data: any, options?: Partial<AD>): void;

  /**
   * Helper to manually Trigger an update of the Matching. This will update subscribers and publishers and link them. Normally this is not necessary.
   *
   * This will build an internal linking (based on the settings) between publishers and subscribers.
   *
   * @author M.Karkowski
   * @memberof IPubSubSystem
   */
  updateMatching(): void;

  /**
   * An observable which holds the incremental data change.
   * this will be triggered, if the an emitter (publisher) changes its data.
   * Contains only the last emitted data and the topic
   *
   * ```typescript
   * // Describe the required Test:
   * let pubSubSystem = new PubSubSystemBase({
   *   generateEmitterType: function () {
   *     return new NopeEventEmitter() as INopeEventEmitter;
   *   },
   * });
   *
   *
   * // Create a Publisher for the system:
   * let publisher: INopeEventEmitter = new NopeEventEmitter();
   *
   * pubSubSystem.register(publisher, {
   *   mode: "publish",
   *   schema: {},
   *   topic: "this/is/a/test",
   * });
   *
   *
   * pubSubSystem.onIncrementalDataChange.subscribe(console.log);
   * publisher.emit("Hello World!"); // Logs the following => {path: "this/is/a/test", data: "Hello World!"}
   * ```
   *
   * @author M.Karkowski
   * @type {INopeObservable<{
   *     path: string,
   *     data: unknown
   *   }>}
   * @memberof IPubSubSystem
   */
  readonly onIncrementalDataChange: INopeEventEmitter<IIncrementalChange>;

  /**
   * List, containing all subscribers.
   *
   * @author M.Karkowski
   * @type {IMapBasedMergeData<string>}
   * @memberof IPubSubSystem
   */
  readonly subscriptions: IMapBasedMergeData<
    O,
    IPubSubEmitterOptions<AD>,
    O,
    string
  >;

  /**
   * List containing all publishers.
   *
   * @author M.Karkowski
   * @type {IMapBasedMergeData<string>}
   * @memberof IPubSubSystem
   */
  readonly publishers: IMapBasedMergeData<
    O,
    IPubSubEmitterOptions<AD>,
    O,
    string
  >;

  /**
   * Disposes the Pub-Sub-System.
   *
   * @author M.Karkowski
   * @memberof IPubSubSystem
   */
  dispose(): void;

  /**
   * Lists all publishers and subscribers of the system.
   */
  toDescription(): {
    publishers: { name: string; schema: INopeDescriptor }[];
    subscribers: { name: string; schema: INopeDescriptor }[];
  };
}

/**
 * A data-based Publish and Subscribe system.
 * Extends {@link IPubSubSystem} by providing the the methods and properties:
 * - `pushData` to push data into the system.
 * - `pullData` to pull data from the system. Will allways return the current data or the default value if no data is present at the given path.
 * - `patternbasedPullData` to pull data with a given pattern. See the example for details.
 * - `patternBasedPush` to push data with a given pattern into the system.
 *
 * @author M.Karkowski
 * @export
 * @class PubSubSystem
 */
export interface IDataPubSubSystem<
  AD extends ITopicSetContentOptions = ITopicSetContentOptions,
  I extends INopeObservable<unknown, unknown, unknown, AD> = INopeObservable<
    unknown,
    unknown,
    unknown,
    AD
  >,
  O extends INopeTopicWithDirectAccess = INopeTopicWithDirectAccess
> extends IPubSubSystem<AD, I, O> {
  /**
   * A Getter to return a COPY of the item. Outside of the system,
   * you'll never receive the original object.
   *
   * @author M.Karkowski
   * @readonly
   * @type {unknown}
   * @memberof IPubSubSystem
   */
  data: unknown;

  /**
   * Function, to push data. Every subscriber will be informed, if pushing the data on the
   * given path will affect the subscribers.
   *
   * @author M.Karkowski
   * @template T Type which is pushed
   * @param {string} path The Path, on which the data should be changed
   * @param {T} content The content to store in the given path.
   * @param {Partial<IEventAdditionalData>} options The Options, that will be forwarded to subscribers.
   * @memberof IPubSubSystem
   */
  pushData<T = unknown>(
    path: string,
    content: T,
    options?: Partial<IEventAdditionalData>
  ): void;

  /**
   * Pull some Data of System. You will allways receive a just a copy. This method prevents you
   * to use a pattern like path. If you want to use patterns please use the "patternbasedPullData"
   *
   * @author M.Karkowski
   * @template T Expected Type of the return. Defaults to unkown
   * @template D Default Value.
   * @param {string} path
   * @param {D} _default If no data is found => return the default data.
   * @return {T} The Expected Type
   * @memberof IPubSubSystem
   */
  pullData<T = unknown, D = null>(path: string, _default: D): T;

  /**
   * A Pattern based Pull. You can provide a mqtt based pattern and receive an array which contains
   * all the data which matches the topic.
   *
   * @author M.Karkowski
   * @template T
   * @template D
   * @param {string} pattern The pattern to pull the data from
   * @param {D} _default a default value, o
   * @return {*}  {{ path: string, data: T }[]}
   * @memberof IPubSubSystem
   */
  patternbasedPullData<T = unknown, D = null>(
    pattern: string,
    _default: D
  ): { path: string; data: T }[];

  /**
   * Pushes data to the elements, where the pattern matches.
   *
   * @author M.Karkowski
   * @template T
   * @param {string} pattern The pattern, which should be used to forward the data. For valid patterns see {@link pattern}
   * @param {T} content The content to store in the given path.
   * @param {Partial<IEventAdditionalData>} options
   * @memberof IDataPubSubSystem
   */
  patternBasedPush<T = unknown>(
    pattern: string,
    content: T,
    options: Partial<IEventAdditionalData>
  ): void;

  /**
   * Lists all publishers and subscribers of the system.
   */
  toDescription(): {
    publishers: { name: string; schema: INopeDescriptor }[];
    subscribers: { name: string; schema: INopeDescriptor }[];
    data: any;
  };
}
