/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { memoize } from "lodash";
import { NopeEventEmitter } from "../eventEmitter/nopeEventEmitter";
import { generateId } from "../helpers/idMethods";
import { MapBasedMergeData } from "../helpers/mergedData";
import {
  deepClone,
  flattenObject,
  rgetattr,
  rsetattr,
} from "../helpers/objectMethods";
import {
  comparePatternAndPath as _comparePatternAndPath,
  containsWildcards,
  TcomparePatternAndPathFunc,
} from "../helpers/pathMatchingMethods";
import {
  IEventCallback,
  IEventOptions,
  IIncrementalChange,
  INopeDescriptor,
  INopeEventEmitter,
  INopeObserver,
  INopeTopic,
  IPubSubEmitterOptions,
  IPubSubOptions,
  IPubSubSystem,
  ITopicSetContentOptions,
} from "../types/nope/index";
import { IMapBasedMergeData } from "../types/nope/nopeHelpers.interface";

type TMatchting<O extends INopeTopic = INopeTopic> = {
  // Contains subscriptions, that can get there data
  // by pulling.
  dataPull: Map<string, Set<O>>;

  // Contains subscriptions, which must be pulled
  dataQuery: Map<string, Set<O>>;
};

const DEFAULT_OBJ = { id: "default" };
const LAZY_UPDATE = true; // Way faster;

/**
 * Default implementation of a {@link IPubSubSystem}.
 *
 */
export class PubSubSystemBase<
  AD extends ITopicSetContentOptions & {
    pubSubUpdate?: boolean;
  } = ITopicSetContentOptions,
  I extends INopeEventEmitter<
    unknown,
    unknown,
    unknown,
    AD
  > = INopeEventEmitter<unknown, unknown, unknown, AD>,
  O extends INopeTopic = INopeTopic
> implements IPubSubSystem<AD, I, O>
{
  public _options: IPubSubOptions = {
    mqttPatternBasedSubscriptions: true,
    forwardChildData: true,
    forwardParentData: true,
  };

  // See interface description
  public get options(): IPubSubOptions {
    return deepClone(this._options) as any;
  }

  // See interface description
  readonly onIncrementalDataChange: INopeEventEmitter<IIncrementalChange>;

  // See interface description
  readonly subscriptions: IMapBasedMergeData<
    O,
    IPubSubEmitterOptions<AD>,
    O,
    string
  >;

  // See interface description
  readonly publishers: IMapBasedMergeData<
    O,
    IPubSubEmitterOptions<AD>,
    O,
    string
  >;

  protected _comparePatternAndPath: TcomparePatternAndPathFunc;

  /**
   * The internal used object to store the data.
   *
   * @author M.Karkowski
   * @type {unknown}
   * @memberof PubSubSystemBase
   */
  protected _data: unknown = {};

  protected _sendCurrentDataOnSubscription = false;

  protected _id = generateId();

  /**
   * List of all Properties. For every property, we store the
   * PropertyOptions. Then, we know, what elements should be
   * subscribed and which not.
   *
   * @author M.Karkowski
   * @protected
   * @memberof PubSubSystemBase
   */
  protected _emitters = new Map<
    O,
    {
      options: IEventOptions;
      subTopic: string | false;
      pubTopic: string | false;
      callback?: IEventCallback<unknown, AD>;
      observer?: INopeObserver;
    }
  >();

  protected _emittersToObservers = new Map<O, INopeObserver>();

  protected _matched = new Map<string, TMatchting>();
  protected _generateEmitterType: () => I;
  protected _disposing: boolean;

  public constructor(
    options: Partial<IPubSubOptions> & {
      generateEmitterType?: () => I;
    } = {}
  ) {
    this._options = Object.assign(
      {
        mqttPatternBasedSubscriptions: true,
        forwardChildData: true,
        forwardParentData: true,
        matchTopicsWithoutWildcards: true,
      } as IPubSubOptions,
      options
    );

    // Flag to stop forwarding data, if disposing is enabled.
    this._disposing = false;

    this._generateEmitterType =
      options.generateEmitterType ||
      (() => {
        return new NopeEventEmitter() as any as I;
      });

    // Create a memoized function for the pattern matching (its way faster)
    this._comparePatternAndPath = memoize(
      (pattern: string, path: string) => {
        return _comparePatternAndPath(pattern, path, {
          matchTopicsWithoutWildcards: options.matchTopicsWithoutWildcards,
        });
      },
      (pattern: string, path: string) => {
        return `${pattern}-${path}`;
      }
    );

    this.subscriptions = new MapBasedMergeData(this._emitters, "subTopic");
    this.publishers = new MapBasedMergeData(this._emitters, "pubTopic");

    this.onIncrementalDataChange = new NopeEventEmitter();
  }

  // See interface description
  public register(emitter: I, options: IEventOptions): O {
    if (!this._emitters.has(emitter as unknown as O)) {
      if (
        typeof options.topic !== "string" &&
        typeof options.topic !== "object"
      ) {
        throw Error("A Topic must be provided in the options.");
      }

      let pubTopic: string | false =
        typeof options.topic === "string"
          ? options.topic
          : options.topic.publish || null;

      let subTopic: string | false =
        typeof options.topic === "string"
          ? options.topic
          : options.topic.subscribe || null;

      if (
        !(
          options.mode == "publish" ||
          (Array.isArray(options.mode) && options.mode.includes("publish"))
        )
      ) {
        pubTopic = false;
      }
      if (
        !(
          options.mode == "subscribe" ||
          (Array.isArray(options.mode) && options.mode.includes("subscribe"))
        )
      ) {
        subTopic = false;
      }

      // Define a callback, which will be used to forward
      // the data into the system:
      let observer: INopeObserver = undefined;
      let callback: IEventCallback<unknown, AD> = undefined;

      if (pubTopic) {
        const _this = this;
        callback = (content, opts) => {
          // Internal Data-Update of the pub-sub-system
          // we wont push the data again. Otherwise, we
          // risk an recursive endloop.
          if (opts.pubSubUpdate) {
            return;
          }

          // We use this callback to forward the data into the system:
          _this._pushData(
            pubTopic as string,
            pubTopic as string,
            content,
            opts as AD,
            false,
            emitter as unknown as O
          );
        };
      }

      // Register the emitter. This will be used during topic matching.
      this._emitters.set(emitter as unknown as O, {
        options,
        pubTopic,
        subTopic,
        callback,
        observer,
      });

      // Update the Matching Rules.
      if (LAZY_UPDATE) {
        this._updatePartialMatching("add", emitter, pubTopic, subTopic);
      } else {
        this.updateMatching();
      }

      if (callback) {
        // If necessary. Add the Callback.
        observer = emitter.subscribe(callback, {
          skipCurrent: !this._sendCurrentDataOnSubscription,
        });

        // Now lets store our binding.
        this._emittersToObservers.set(emitter as unknown as O, observer);
      }

      // Now, if required, add the Data to the emitter.
      if (subTopic && this._sendCurrentDataOnSubscription) {
        if (containsWildcards(subTopic)) {
          // This is more Complex.
          this._patternbasedPullData(subTopic, null).map((item) => {
            // We check if the content is null
            if (item.data !== null) {
              (emitter as unknown as O).emit(item.data, {
                sender: this._id,
                topicOfContent: item.path,
                topicOfChange: item.path,
                topicOfSubscription: subTopic as string,
              });
            }
          });
        } else {
          const currentContent = this._pullData(subTopic, null);
          if (currentContent !== null) {
            (emitter as unknown as O).emit(currentContent, {
              sender: this._id,
              topicOfContent: subTopic as string,
              topicOfChange: subTopic as string,
              topicOfSubscription: subTopic as string,
            });
          }
        }
      }
    } else {
      throw Error("Already registered Emitter!");
    }
    return emitter as unknown as O;
  }

  // See interface description
  public updateOptions(emitter: I, options: IEventOptions): void {
    if (this._emitters.has(emitter as unknown as O)) {
      const pubTopic =
        typeof options.topic === "string"
          ? options.topic
          : options.topic.publish || null;

      const subTopic =
        typeof options.topic === "string"
          ? options.topic
          : options.topic.subscribe || null;

      const data = this._emitters.get(emitter as unknown as O);

      if (LAZY_UPDATE) {
        this._updatePartialMatching(
          "remove",
          emitter,
          data.pubTopic,
          data.subTopic
        );
      }

      data.options = options;
      data.subTopic = subTopic;
      data.pubTopic = pubTopic;

      this._emitters.set(emitter as unknown as O, data);

      if (LAZY_UPDATE) {
        // Update the Matching Rules.
        this._updatePartialMatching("add", emitter, pubTopic, subTopic);
      } else {
        // Update the Matching Rules.
        this.updateMatching();
      }
    } else {
      throw Error("Already registered Emitter!");
    }
  }

  // See interface description
  public unregister(emitter: I): boolean {
    if (this._emitters.has(emitter as unknown as O)) {
      const { pubTopic, subTopic } = this._emitters.get(
        emitter as unknown as O
      );

      this._emitters.delete(emitter as unknown as O);

      if (LAZY_UPDATE) {
        // Update the Matching Rules.
        this._updatePartialMatching("remove", emitter, pubTopic, subTopic);
      } else {
        // Update the Matching Rules.
        this.updateMatching();
      }

      return true;
    }
    return false;
  }

  // See interface description
  public registerSubscription<T = unknown>(
    topic: string,
    subscription: IEventCallback<T, AD>
  ): INopeObserver {
    // Create the Emitter
    const emitter = this._generateEmitterType();

    // Create the Observer
    const observer = (emitter as INopeEventEmitter<T>).subscribe(subscription);

    // Register the Emitter. Thereby the ELement
    // will be linked to the Pub-Sub-System.
    this.register(emitter, {
      mode: "subscribe",
      schema: {},
      topic: topic,
    });

    // Return the Emitter
    return observer;
  }

  // See interface description
  public get emitters(): {
    publishers: { name: string; schema: INopeDescriptor }[];
    subscribers: { name: string; schema: INopeDescriptor }[];
  } {
    return {
      publishers: Array.from(this._emitters.values())
        .filter((item) => {
          return item.pubTopic;
        })
        .map((item) => {
          return {
            schema: item.options.schema as INopeDescriptor,
            name: item.pubTopic as string,
          };
        }),
      subscribers: Array.from(this._emitters.values())
        .filter((item) => {
          return item.subTopic;
        })
        .map((item) => {
          return {
            schema: item.options.schema as INopeDescriptor,
            name: item.subTopic as string,
          };
        }),
    };
  }

  /**
   * Internal Match-Making Algorithm. This allowes to Create a predefined
   * List between Publishers and Subscribers. Thereby the Process is speed
   * up, by utilizing this Look-Up-Table
   *
   * @author M.Karkowski
   * @memberof PubSubSystemBase
   */
  public updateMatching(): void {
    // Clears all defined Matches
    this._matched.clear();
    // Iterate through all Publishers and
    for (const { pubTopic } of this._emitters.values()) {
      // Now, lets Update the Matching for the specific Topics.
      if (pubTopic !== false) this._updateMatchingForTopic(pubTopic);
    }

    this.publishers.update();
    this.subscriptions.update();
  }

  private __deleteMatchingEntry(
    _pubTopic: string,
    _subTopic: string,
    _emitter: I
  ) {
    if (this._matched.has(_pubTopic)) {
      const data = this._matched.get(_pubTopic);

      if (data.dataPull.has(_subTopic)) {
        data.dataPull.get(_subTopic).delete(_emitter);
      }

      if (data.dataQuery.has(_subTopic)) {
        data.dataQuery.get(_subTopic).delete(_emitter);
      }
    }
  }

  private __addMatchingEntryIfRequired(pubTopic, subTopic, emitter) {
    // Now lets determine the Path
    const result = this._comparePatternAndPath(subTopic, pubTopic);

    if (result.affected) {
      // We skip content related to the settings.
      // If no wildcard and no forwardChildData or forwardParentData
      // is allowed ==> we make shure, that we skip the topic.
      if (
        !result.containsWildcards &&
        ((result.affectedByChild && !this._options.forwardChildData) ||
          (result.affectedByParent && !this._options.forwardParentData))
      ) {
        return;
      }

      // We now have match the topic as following described:
      // 1) subscription contains a pattern
      //    - dircet change (same-level) => content
      //    - parent based change => content
      //    - child based change => content
      // 2) subscription doesnt contains a pattern:
      //    We more or less want the data on the path.
      //    - direct change (topic = path) => content
      //    - parent based change => a super change
      if (result.containsWildcards) {
        if (this._options.mqttPatternBasedSubscriptions) {
          if (result.patternToExtractData) {
            this.__addToMatchingStructure(
              "dataQuery",
              pubTopic,
              result.patternToExtractData,
              emitter
            );
          } else if (typeof result.pathToExtractData === "string") {
            this.__addToMatchingStructure(
              "dataPull",
              pubTopic,
              result.pathToExtractData,
              emitter
            );
          } else {
            throw Error(
              "Implementation Error. Either the patternToExtractData or the pathToExtractData must be provided"
            );
          }
        } else {
          this.__addToMatchingStructure(
            "dataQuery",
            pubTopic,
            pubTopic,
            emitter
          );
        }
      } else {
        // We skip content related to the settings.
        // If no wildcard and no forwardChildData or forwardParentData
        // is allowed ==> we make shure, that we skip the topic.
        if (
          (result.affectedByChild && !this._options.forwardChildData) ||
          (result.affectedByParent && !this._options.forwardParentData)
        ) {
          return;
        }

        if (typeof result.pathToExtractData === "string") {
          this.__addToMatchingStructure(
            "dataPull",
            pubTopic,
            result.pathToExtractData,
            emitter
          );
        } else {
          throw Error(
            "Implementation Error. The 'pathToExtractData' must be provided"
          );
        }
      }
    }
  }

  /**
   * Helper, to update the Matching. But, we are just considering
   * @param mode
   * @param _emitter
   * @param _pubTopic
   * @param _subTopic
   */
  protected _updatePartialMatching(
    mode: "add" | "remove",
    _emitter: I,
    _pubTopic: string | false,
    _subTopic: string | false
  ): void {
    const consideredPublishedTopics = new Set<string>();

    if (_subTopic !== false) {
      // Iterate through all Publishers and
      for (const item of this._emitters.values()) {
        // Extract the Pub-Topic
        const pubTopicOfOtherEmitter = item.pubTopic;

        if (
          pubTopicOfOtherEmitter !== false &&
          !consideredPublishedTopics.has(pubTopicOfOtherEmitter)
        ) {
          // Now, lets Update the Matching for the specific Topics.
          if (mode === "remove") {
            this.__deleteMatchingEntry(
              pubTopicOfOtherEmitter,
              _subTopic,
              _emitter
            );
          } else if (mode === "add") {
            this.__addMatchingEntryIfRequired(
              pubTopicOfOtherEmitter,
              _subTopic,
              _emitter
            );
          }
          // Add this topic to the topics,
          // that have already been checked.
          consideredPublishedTopics.add(pubTopicOfOtherEmitter);
        }
      }

      // Additionally, we test for the allready published events:
      for (const topic of this._matched.keys()) {
        // we only test already published topics:
        if (
          !consideredPublishedTopics.has(topic) &&
          !containsWildcards(topic)
        ) {
          if (mode === "remove") {
            this.__deleteMatchingEntry(topic, _subTopic, _emitter);
          } else if (mode === "add") {
            this.__addMatchingEntryIfRequired(topic, _subTopic, _emitter);
          }
          consideredPublishedTopics.add(topic);
        }
      }
    }

    if (mode === "add") {
      if (_pubTopic !== false) {
        this._updateMatchingForTopic(_pubTopic);
      }
      if (_subTopic !== false && !containsWildcards(_subTopic)) {
        this.__addMatchingEntryIfRequired(_subTopic, _subTopic, _emitter);
      }
    } else if (mode === "remove") {
      if (_subTopic !== false) {
        this.__deleteMatchingEntry(_subTopic, _subTopic, _emitter);
      }
    }

    this.publishers.update();
    this.subscriptions.update();
  }

  public emit(eventName: string, data: any, options?: AD) {
    return this._pushData(eventName, eventName, data, options);
  }

  /**
   * Unregisters all Emitters and removes all subscriptions of the
   * "onIncrementalDataChange", "publishers" and "subscriptions"
   *
   * @author M.Karkowski
   * @memberof PubSubSystemBase
   */
  public dispose(): void {
    this._disposing = true;
    const emitters = Array.from(this._emitters.keys());
    emitters.map((emitter) => {
      this.unregister(emitter as unknown as I);
    });

    this.onIncrementalDataChange.dispose();
    this.publishers.dispose();
    this.subscriptions.dispose();
  }

  /**
   * Internal Helper to lazy update the Matching.
   * @param entry
   * @param topicOfChange
   * @param pathOrPattern
   * @param emitter
   */
  protected __addToMatchingStructure(
    entry: keyof TMatchting,
    topicOfChange: string,
    pathOrPattern: string,
    emitter: O
  ): void {
    // Test if the changing topic is present,
    // if not, ensure we are omitting it.
    if (!this._matched.has(topicOfChange)) {
      this._matched.set(topicOfChange, {
        dataPull: new Map(),
        dataQuery: new Map(),
      });
    }

    // We make otherwise shure, that our [pathOrPattern] entry
    // is defined
    if (!this._matched.get(topicOfChange)[entry].has(pathOrPattern)) {
      this._matched.get(topicOfChange)[entry].set(pathOrPattern, new Set());
    }

    this._matched.get(topicOfChange)[entry].get(pathOrPattern).add(emitter);
  }

  /** Function to Interanlly add a new Match
   *
   * @export
   * @param {string} topicOfChange
   */
  protected _updateMatchingForTopic(topicOfChange: string): void {
    if (!this._matched.has(topicOfChange)) {
      this._matched.set(topicOfChange, {
        dataPull: new Map(),
        dataQuery: new Map(),
      });
    }

    // Find all Matches
    for (const [emitter, item] of this._emitters.entries()) {
      if (typeof item.subTopic == "string") {
        // Now lets determine the Path
        this.__addMatchingEntryIfRequired(
          topicOfChange,
          item.subTopic,
          emitter
        );
      }
    }
  }

  /**
   * Internal Function to notify Asynchronous all Subscriptions
   *
   * @author M.Karkowski
   * @private
   * @param {string} topicOfContent
   *  @param {string} topicOfChange
   * @param {*} content
   * @memberof PubSubSystemBase
   */
  protected _notify(
    topicOfContent: string,
    topicOfChange: string,
    options: Partial<AD>,
    emitter: O = null
  ): void {
    if (this._disposing) {
      return;
    }

    // Check whether a Matching exists for this
    // Topic, if not add it.
    if (!this._matched.has(topicOfContent)) {
      this._updateMatchingForTopic(topicOfContent);
    }

    const referenceToMatch = this._matched.get(topicOfContent);

    // Performe the direct Matches
    for (const [
      _pathToPull,
      _emitters,
    ] of referenceToMatch.dataPull.entries()) {
      for (const _emitter of _emitters) {
        // Get a new copy for every emitter.
        const data = this._pullData(_pathToPull, null);

        // Only if we want to notify an exclusive emitter we
        // have to continue, if our emitter isnt matched.
        if (emitter !== null && emitter === _emitter) {
          continue;
        }
        // Iterate through all Subscribers
        _emitter.emit(data, {
          ...options,
          topicOfChange: topicOfChange,
          topicOfContent: topicOfContent,
          topicOfSubscription: this._emitters.get(_emitter as unknown as O)
            .subTopic as string,
        });
      }
    }

    // Performe the direct Matches
    for (const [_pattern, _emitters] of referenceToMatch.dataQuery.entries()) {
      // Fix: Speeding things up.
      // Get a new copy for every element.
      const data = this._patternbasedPullData(_pattern, null).filter((item) => {
        return this._comparePatternAndPath(topicOfChange, item.path).affected;
      });

      if (data.length > 0) {
        for (const _emitter of _emitters) {
          // prevent this case!
          if (_emitter !== null && _emitter !== _emitter) {
            continue;
          }

          // Iterate through all Subscribers
          _emitter.emit(data, {
            ...options,
            mode: "direct",
            topicOfChange: topicOfChange,
            topicOfContent: topicOfContent,
            topicOfSubscription: this._emitters.get(_emitter as unknown as O)
              .subTopic as string,
          });
        }
      }
    }
  }

  protected _updateOptions(options: Partial<AD>): AD {
    if (!options.timestamp) {
      options.timestamp = Date.now();
    }
    if (typeof options.forced !== "boolean") {
      options.forced = false;
    }
    if (!Array.isArray(options.args)) {
      options.args = [];
    }
    if (!options.sender) {
      options.sender = this._id;
    }

    return options as AD;
  }

  /**
   * Internal helper to push data to the data property. This
   * results in informing the subscribers.
   *
   * @param path Path, that is used for pushing the data.
   * @param data The data to push
   * @param options Options used during pushing
   */
  protected _pushData<T = unknown>(
    pathOfContent: string,
    pathOfChange: string,
    data: T,
    options: Partial<AD> = {},
    quiet: boolean = false,
    emitter: O = null
  ): void {
    const _options = this._updateOptions(options);

    // Force the Update to be true.
    _options.pubSubUpdate = true;

    if (containsWildcards(pathOfContent)) {
      throw 'The Path contains wildcards. Please use the method "patternbasedPullData" instead';
    } else if (pathOfContent === "") {
      this._data = deepClone(data);
      this._notify(pathOfContent, pathOfChange, _options, emitter);
    } else {
      rsetattr(this._data, pathOfContent, deepClone(data));
      this._notify(pathOfContent, pathOfChange, _options, emitter);
    }

    if (!quiet) {
      // Emit the data change.
      this.onIncrementalDataChange.emit({
        path: pathOfContent,
        data,
        ..._options,
      });
    }
  }

  // Function to pull the Last Data of the Topic
  protected _pullData<T = unknown, D = null>(
    topic: string,
    _default: D = null
  ): T {
    if (containsWildcards(topic)) {
      throw 'The Path contains wildcards. Please use the method "patternbasedPullData" instead';
    }
    return deepClone(rgetattr<T>(this._data, topic, _default));
  }

  /**
   * Helper, which enable to perform a pattern based pull.
   * The code receives a pattern, and matches the existing
   * content (by using there path attributes) and return the
   * corresponding data.
   * @param pattern The Patterin
   * @param _default The Default Value.
   * @returns
   */
  protected _patternbasedPullData<T = unknown, D = null>(
    pattern: string,
    _default: D = undefined
  ): { path: string; data: T }[] {
    // To extract the data based on a Pattern,
    // we firstly, we check if the given pattern
    // is a pattern.
    if (!containsWildcards(pattern)) {
      // Its not a pattern so we will speed up
      // things.

      const data: T = this._pullData(pattern, DEFAULT_OBJ as any as T);

      if (data !== (DEFAULT_OBJ as any)) {
        return [
          {
            path: pattern,
            data,
          },
        ];
      } else if (_default !== undefined) {
        return [
          {
            path: pattern,
            data: _default as any as T,
          },
        ];
      }

      return [];
    }

    // Now we know, we have to work with the query,
    // for that purpose, we will adapt the data object
    // to the following form:
    // {path: value}

    const flattenData = flattenObject(this._data);
    const ret: { path: string; data: T }[] = [];

    // We will use our alternative representation of the
    // object to compare the pattern with the path item.
    // only if there is a direct match => we will extract it.
    // That corresponds to a direct level extraction and
    // prevents to grap multiple items.
    for (const [path, data] of flattenData.entries()) {
      const result = this._comparePatternAndPath(pattern, path);
      if (result.affectedOnSameLevel || result.affectedByChild) {
        ret.push({
          path,
          data,
        });
      }
    }

    // Now we just return our created element.
    return ret;
  }

  /**
   * Describes the Data.
   * @returns
   */
  public toDescription() {
    const emitters = this.emitters;
    return emitters;
  }
}
