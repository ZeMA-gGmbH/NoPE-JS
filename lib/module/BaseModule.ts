/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { ILogger } from "js-logger";
import {
  getEmitterPath,
  getMethodPath,
  getPropertyPath,
  isEmitterPathCorrect,
  isMethodPathCorrect,
  isPropertyPathCorrect,
} from "../helpers/dispatcherPathes";
import { deepClone } from "../helpers/objectMethods";
import { getNopeLogger } from "../logger/getLogger";
import { INopeCore, INopeEventEmitter } from "../types/nope";
import {
  IAuthor,
  IEventOptions,
  IServiceOptions,
  INopeModule,
  INopeModuleDescription,
  IVersion,
} from "../types/nope/nopeModule.interface";
import { INopeObservable } from "../types/nope/nopeObservable.interface";

/**
 * Base Implementation of a Module.
 *
 * The Module is used to share information and data. Although it implements the
 * the Basic behavior to fullfill a given traget.
 *
 * @export
 * @class BaseModule
 * @implements {INopeModule}
 */
export class NopeBaseModule implements INopeModule {
  /**
   * Return the Class Identifier.
   */
  public get type(): string {
    return Object.getPrototypeOf(this).constructor.name;
  }

  /**
   * A Description of the Module. This is used to Describe roughly
   * what the module is capable of
   * doing.
   *
   * @type {string}
   * @memberof BaseModule
   */
  public description: string;

  /**
   * A Description of the Author. Use to Mail etc.
   *
   * @type {IAuthor}
   * @memberof BaseModule
   */
  public author: IAuthor;

  /**
   * Description of the provided Version of the Module.
   *
   * @type {IVersion}
   * @memberof BaseModule
   */
  public version: IVersion;

  protected _registeredMethods: Map<
    string,
    {
      method: (...args: any[]) => Promise<any>;
      options: IServiceOptions;
    }
  >;

  protected _registeredProperties: Map<
    string,
    {
      observable: INopeObservable<any>;
      options: IEventOptions;
    }
  >;

  protected _registeredEvents: Map<
    string,
    {
      emitter: INopeEventEmitter;
      options: IEventOptions;
    }
  >;

  /**
   * Public getter for the functions
   *
   * @readonly
   * @memberof BaseModule
   */
  public get methods() {
    const ret: { [index: string]: IServiceOptions } = {};

    for (const [name, funcs] of this._registeredMethods.entries()) {
      ret[name] = funcs.options;
    }

    return ret;
  }

  /**
   * Public get to receive a Description of the Properties
   *
   * @readonly
   * @memberof BaseModule
   */
  public get properties() {
    const ret: { [index: string]: IEventOptions } = {};

    for (const [name, funcs] of this._registeredProperties.entries()) {
      ret[name] = funcs.options;
    }

    return ret;
  }

  /**
   * Public get to receive a Description of the Properties
   *
   * @readonly
   * @memberof BaseModule
   */
  public get events() {
    const ret: { [index: string]: IEventOptions } = {};

    for (const [name, funcs] of this._registeredEvents.entries()) {
      ret[name] = funcs.options;
    }

    return ret;
  }

  /**
   * The Identifier of the Module.
   *
   * @type {string}
   * @memberof BaseModule
   */
  public identifier: string;

  public _markedElements: Array<{
    accessor: string;
    options: IEventOptions | IServiceOptions;
    type: "method" | "prop" | "event";
  }>;

  protected _logger: ILogger;

  /**
   * Creates an instance of BaseModule.
   * @memberof BaseModule
   */
  constructor(protected _core: INopeCore) {
    this.description = null;
    this.author = null;
    this.version = null;
    this.identifier = null;
    this._registeredMethods = new Map();
    this._registeredProperties = new Map();
    this._registeredEvents = new Map();
    this.uiLinks = [];
    this._logger = getNopeLogger("BaseModule");
  }

  public uiLinks: { name: string; description: string; link: string }[];

  /**
   * Helper Function to register an Observable (a Property.)
   *
   * @template T Type of the Property
   * @template S Setter Type of the Property
   * @template G Getter Type of the Property
   * @param {string} name Name, which should be used to register the element. The Name will ALLWAYS (automatically) be assembled using the modules identifier an then the name.
   * @param {INopeObservable<T, S, G>} observable The Observable representing the Property
   * @param {IEventOptions<K>} options The Options used to define the registration.
   * @return {Promise<void>}
   * @memberof NopeBaseModule
   */
  public async registerProperty<T, S = T, G = T>(
    name: string,
    observable: INopeObservable<T, S, G>,
    options: IEventOptions
  ): Promise<void> {
    // Unregister the Function
    await this.unregisterProperty(name);

    // Adapt the Topics
    if (
      typeof options.topic === "string" &&
      !isPropertyPathCorrect(this.identifier, options.topic as string)
    ) {
      options.topic = getPropertyPath(this.identifier, options.topic);
    } else if (typeof options.topic === "object") {
      if (
        options.topic.subscribe &&
        !isPropertyPathCorrect(this.identifier, options.topic.subscribe)
      ) {
        options.topic.subscribe = getPropertyPath(
          this.identifier,
          options.topic.subscribe
        );
      }
      if (
        options.topic.publish &&
        !isPropertyPathCorrect(this.identifier, options.topic.publish)
      ) {
        options.topic.publish = getPropertyPath(
          this.identifier,
          options.topic.publish
        );
      }
    } else {
      throw Error("Topic must be provided in the options");
    }

    const _observable = await this._core.dataDistributor.register(
      observable,
      options
    );

    // Register the new Property.
    this._registeredProperties.set(name, {
      observable: _observable,
      options,
    });
  }

  /**
   * Helper Function to register an Event(Emitter) (a Property.)
   *
   * @template T Type of the Event(Emitter)
   * @template S Setter Type of the Event(Emitter)
   * @template G Getter Type of the Event(Emitter)
   * @param {string} name Name, which should be used to register the element. The Name will ALLWAYS (automatically) be assembled using the modules identifier an then the name.
   * @param {INopeObservable<T, S, G>} emitter The Event(Emitter) representing the Property
   * @param {IEventOptions<K>} options The Options used to define the registration.
   * @return {Promise<void>}
   * @memberof NopeBaseModule
   */
  public async registerEvent<T, S = T, G = T>(
    name: string,
    emitter: INopeObservable<T, S, G>,
    options: IEventOptions
  ): Promise<void> {
    // Unregister the Function
    await this.unregisterEvent(name);

    // Adapt the Topics
    if (
      typeof options.topic === "string" &&
      !isEmitterPathCorrect(this.identifier, options.topic as string)
    ) {
      options.topic = getEmitterPath(this.identifier, options.topic);
    } else if (typeof options.topic === "object") {
      if (
        options.topic.subscribe &&
        !isEmitterPathCorrect(this.identifier, options.topic.subscribe)
      ) {
        options.topic.subscribe = getEmitterPath(
          this.identifier,
          options.topic.subscribe
        );
      }
      if (
        options.topic.publish &&
        !isEmitterPathCorrect(this.identifier, options.topic.publish)
      ) {
        options.topic.publish = getEmitterPath(
          this.identifier,
          options.topic.publish
        );
      }
    }
    const _emitter = await this._core.eventDistributor.register(
      emitter,
      options
    );

    // Register the new Property.
    this._registeredEvents.set(name, {
      emitter: _emitter,
      options,
    });
  }

  /**
   * Function used to register a Method. This Method will be available in the shared network.
   *
   * @param {string} name Name of the Method, which is used during registration at the dispatcher
   * @param {(...args: any[]) => Promise<any>} method The function itself. It must be async.
   * @param {IServiceOptions} options The Options, used for registering.
   * @return {Promise<void>}
   * @memberof NopeBaseModule
   */
  public async registerMethod(
    name: string,
    method: (...args: any[]) => Promise<any>,
    options: IServiceOptions
  ): Promise<void> {
    // Unregister the Function
    await this.unregisterFunction(name);

    // Adapt the Method ID
    if (options.id) {
      if (!isMethodPathCorrect(this.identifier, options.id)) {
        options.id = getMethodPath(this.identifier, options.id);
      }
    } else {
      options.id = getMethodPath(this.identifier, name);
    }

    const _method = await this._core.rpcManager.registerService(
      method,
      options
    );

    // Register the new Function.
    this._registeredMethods.set(name, {
      method: _method,
      options,
    });
  }

  /**
   * Unregister a Function
   *
   * @param {string} name Name of the function used during registering.
   * @return {Promise<void>}
   * @memberof NopeBaseModule
   */
  public async unregisterFunction(name: string): Promise<void> {
    // Test if the Method is already registerd,
    // If so => unregister it first.
    if (this._registeredMethods.has(name)) {
      this._core.rpcManager.unregisterService(
        this._registeredMethods.get(name).method
      );
    }
  }

  /**
   * Helper Function to unregister an Eventbased Property
   *
   * @param {string} name Name of the Property, that has been used to register.
   * @return {Promise<void>}
   * @memberof NopeBaseModule
   */
  public async unregisterEvent(name: string): Promise<void> {
    // Test if the Property is already registerd,
    // If so => unregister it first.
    if (this._registeredEvents.has(name)) {
      this._core.eventDistributor.unregister(
        this._registeredEvents.get(name).emitter
      );
    }
  }

  /**
   * Helper Function to unregister an Observable (a Property.)
   *
   * @param {string} name Name of the Property, that has been used to register.
   * @return {Promise<void>}
   * @memberof NopeBaseModule
   */
  public async unregisterProperty(name: string): Promise<void> {
    // Test if the Property is already registerd,
    // If so => unregister it first.
    if (this._registeredProperties.has(name)) {
      this._core.dataDistributor.unregister(
        this._registeredProperties.get(name).observable
      );
    }
  }

  /**
   * Function to return all available Methods.   *
   * @memberof NopeBaseModule
   */
  public async listMethods() {
    return Array.from(this._registeredMethods.values());
  }

  /**
   * Function used to list all available Properties.
   * @memberof NopeBaseModule
   */
  public async listProperties(): Promise<
    Array<{ observable: INopeObservable<any>; options: IEventOptions }>
  > {
    return Array.from(this._registeredProperties.values());
  }

  /**
   * Function used to list all available Properties.
   *
   * @return {Promise<Array<{ observable: INopeObservable<any>, options: IPropertyOptions }>>}
   * @memberof NopeBaseModule
   */
  public async listEvents(): Promise<
    Array<{ emitter: INopeEventEmitter<any>; options: IEventOptions }>
  > {
    return Array.from(this._registeredEvents.values());
  }

  /**
   * An init Function. Used to initialize the Element.
   *
   * @return {Promise<void>}
   * @memberof NopeBaseModule
   */
  public async init(...args): Promise<void> {
    // In this base Implementation, check if every requried property is set
    // correctly. If not => raise an error.

    if (this.type === null) {
      throw Error("Please Provide a Name for the Module before initializing");
    }

    if (this.description === null) {
      throw Error(
        "Please Provide a Description for the Module before initializing"
      );
    }

    if (this.author === null) {
      throw Error(
        "Please Provide an Author for the Module before initializing"
      );
    }

    if (this.version === null) {
      throw Error(
        "Please Provide a Version for the Module before initializing"
      );
    }

    if (this.identifier === null) {
      throw Error(
        "Please Provide an Identifier for the Module before initializing"
      );
    }

    if (this._markedElements) {
      const _this = this;
      for (const entry of deepClone(this._markedElements)) {
        switch (entry.type) {
          case "method":
            await this.registerMethod(
              entry.accessor,
              (...args) => {
                return _this[entry.accessor](...args);
              },
              entry.options as IServiceOptions
            );
            break;
          case "prop":
            await this.registerProperty(
              entry.accessor,
              _this[entry.accessor],
              entry.options as IEventOptions
            );
            break;
          case "event":
            await this.registerEvent(
              entry.accessor,
              _this[entry.accessor],
              entry.options as IEventOptions
            );
            break;
        }
      }
    }
  }

  /**
   * Function, which is used to unregister the element.
   *
   * @memberof NopeBaseModule
   */
  public async dispose() {
    // Unregister all Methods and Functions
    for (const name of this._registeredMethods.keys()) {
      await this.unregisterFunction(name);
    }

    // Remove all known Functions
    this._registeredMethods.clear();

    // Unregister all Properties.
    for (const name of this._registeredProperties.keys()) {
      await this.unregisterProperty(name);
    }

    // Remove all known Properties.
    this._registeredProperties.clear();

    // Unregister all Properties.
    for (const name of this._registeredEvents.keys()) {
      await this.unregisterEvent(name);
    }

    // Remove all known Properties.
    this._registeredEvents.clear();
  }

  /**
   * Helper Function to extract the used identifiert of Property
   *
   * @param {(((...args) => Promise<any>) | INopeObservable<any>)} prop_event_or_func The Property or the Function to receive the Name.
   * @return {*}  {string}
   * @memberof NopeBaseModule
   */
  public getIdentifierOf(
    prop_event_or_func: ((...args) => Promise<any>) | INopeObservable<any>,
    type: "topicToPublish" | "topicToSubscribe" = null
  ): string {
    // To Extract the name of the Property or the Function, we will iterate over
    // the registered properties and the regiestered functions. If the prop or the
    // function matches ==> return the name otherwise we throw an error.

    for (const [name, item] of this._registeredProperties.entries()) {
      const { observable, options } = item;

      if (observable == prop_event_or_func) {
        const _subTopic =
          typeof options.topic === "string"
            ? options.topic
            : options.topic.subscribe || null;
        const _pubTopic =
          typeof options.topic === "string"
            ? options.topic
            : options.topic.publish || null;

        switch (type) {
          case "topicToPublish":
            if (_pubTopic === null) {
              throw Error("No topic for publishing is defined.");
            }
            return _pubTopic;
          case "topicToSubscribe":
            if (_subTopic === null) {
              throw Error("No topic for subscribing is defined.");
            }
            return _subTopic;
          default:
            if (typeof options.topic === "string") {
              return options.topic;
            }
            throw Error(
              "Prop uses different name for subscribing and publishing. Please specify using the 'type' identier to select"
            );
        }
      }
    }
    for (const [name, item] of this._registeredEvents.entries()) {
      const { emitter, options } = item;

      if (emitter == prop_event_or_func) {
        const _subTopic =
          typeof options.topic === "string"
            ? options.topic
            : options.topic.subscribe || null;
        const _pubTopic =
          typeof options.topic === "string"
            ? options.topic
            : options.topic.publish || null;

        switch (type) {
          case "topicToPublish":
            if (_pubTopic === null) {
              throw Error("No topic for publishing is defined.");
            }
            return _pubTopic;
          case "topicToSubscribe":
            if (_subTopic === null) {
              throw Error("No topic for subscribing is defined.");
            }
            return _subTopic;
          default:
            if (typeof options.topic === "string") {
              return options.topic;
            }
            throw Error(
              "Prop uses different name for subscribing and publishing. Please specify using the 'type' identier to select"
            );
        }
      }
    }
    for (const [name, item] of this._registeredMethods.entries()) {
      const { method: func, options } = item;
      if (func == prop_event_or_func) {
        return options.id;
      }
    }

    throw Error("Element not found or registered");
  }

  /**
   * Helper function to extract an description of the Module.
   *
   * @return {INopeModuleDescription} a parsed description
   * @memberof NopeBaseModule
   */
  public toDescription(): INopeModuleDescription {
    const ret: INopeModuleDescription = {
      author: this.author,
      description: this.description,
      methods: this.methods,
      events: this.events,
      identifier: this.identifier,
      properties: this.properties,
      type: this.type,
      version: this.version,
      uiLinks: this.uiLinks,
    };

    return ret;
  }
}
