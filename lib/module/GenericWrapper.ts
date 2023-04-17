/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { deepClone } from "../helpers/objectMethods";
import { getNopeLogger } from "../logger/getLogger";
import { ICallOptions, INopeCore, INopeEventEmitter } from "../types";
import {
  IEventOptions,
  IServiceOptions,
  INopeModuleDescription,
} from "../types/nope/nopeModule.interface";
import { INopeObservable } from "../types/nope/nopeObservable.interface";
import { INopePromise } from "../types/nope/nopePromise.interface";
import { NopeBaseModule } from "./BaseModule";

function _invertMode(options: IEventOptions) {
  const _ret = deepClone(options);

  if (Array.isArray(_ret.mode)) {
    if (_ret.mode.includes("subscribe")) {
      _ret.mode = ["publish", "subscribe"];
    } else {
      _ret.mode = ["subscribe"];
    }
  } else if (_ret.mode === "subscribe") {
    _ret.mode = ["publish", "subscribe"];
  } else {
    _ret.mode = ["subscribe"];
  }

  return _ret;
}

/**
 * A Generic Wrapper
 *
 * @author M.Karkowski
 * @export
 * @class NopeGenericModule
 * @extends {NopeBaseModule}
 */
export class NopeGenericWrapper extends NopeBaseModule {
  private _type = "";

  /**
   *
   * Return the Class Identifier.
   */
  public get type(): string {
    return this._type;
  }

  /**
   * Return the Class Identifier.
   */
  public set type(value: string) {
    this._type = value;
  }

  public dynamicInstanceMethods: {
    [index: string]: <T>(...args) => INopePromise<T>;
  } = {};
  public dynamicInstanceProperties: {
    [index: string]: INopeObservable<any>;
  } = {};
  public dynamicInstanceEvents: {
    [index: string]: INopeEventEmitter<any>;
  } = {};

  public dynamicInstanceMethodsWithOptions: {
    [index: string]: <T>(
      options: Partial<ICallOptions>,
      ...args
    ) => INopePromise<T>;
  } = {};

  protected _description: INopeModuleDescription;

  /**
   * Function, used to add the Attributes based on the Description.
   *
   * @param {INopeModuleDescription} description
   * @param {('overwrite' | 'add')} [mode='overwrite']
   * @memberof NopeGenericModule
   */
  public async fromDescription(
    description: INopeModuleDescription,
    mode: "overwrite" | "add" = "overwrite"
  ): Promise<void> {
    const _this = this;

    if (mode === "overwrite") {
      await this.dispose();

      this.author = description.author;
      this.description = description.description;
      this.type = description.type;
      this.identifier = description.identifier;
    }

    if (this.author == null) {
      this.author = description.author;
    }

    if (this.description == null) {
      this.description = description.description;
    }

    if (this.version == null) {
      this.version = description.version;
    }

    if (this.identifier == null) {
      this.identifier = description.identifier;
      this._logger = getNopeLogger(
        "generic-wrapper-" + this.identifier,
        "debug"
      );
    }

    for (const name in description.methods) {
      this._logger.debug('Create function interface for "' + name + '"');

      const options = description.methods[name];
      const func = (...args) => {
        return _this._core.rpcManager.performCall(options.id, args, options);
      };
      const funcWithCustomOptions = (
        _options: Partial<ICallOptions>,
        ...args
      ) => {
        return _this._core.rpcManager.performCall(
          options.id,
          args,
          Object.assign({}, options, _options)
        );
      };

      if (this.dynamicInstanceMethods[name]) {
        throw Error("Name alread used. Not able to use the name twice");
      }
      (this.dynamicInstanceMethods as any)[name] = func;
      if (this.dynamicInstanceMethodsWithOptions[name]) {
        throw Error("Name alread used. Not able to use the name twice");
      }
      (this.dynamicInstanceMethodsWithOptions as any)[name] =
        funcWithCustomOptions;
      // If the Function isnt dynamic, register it on the Object itself.
      if (!options.isDynamic) {
        if (this[name]) {
          throw Error("Name alread used. Not able to use the name twice");
        }
        this[name] = func;
      }
      this._registeredMethods.set(name, {
        method: func,
        options,
      });
    }

    if (this._linkProperties) {
      for (const name in description.properties) {
        this._logger.debug('Create property interface for "' + name + '"');

        const options = description.properties[name];

        // Add only elements, that are subscribed.
        // Properties, which are only publishing
        // should throw an error, if data is published
        // in a remote. This is done to maintain
        // consistency.
        // let mode = prop.mode;

        if (this.dynamicInstanceProperties[name]) {
          throw Error("Name alread used. Not able to use the name twice");
        }

        // Make shure it isnt published.
        // options.preventSendingToRegistery = true;

        // Register the Observable:
        this.dynamicInstanceProperties[name] =
          this._core.dataDistributor.register(
            // Assign a new Observable.
            this._observableFactory(),
            // Use the provided Properties:
            _invertMode(options)
          );

        if (!options.isDynamic) {
          if (this[name]) {
            throw Error("Name alread used. Not able to use the name twice");
          }
          // Use the Same Element.
          this[name] = this.dynamicInstanceProperties[name];
        }

        this._logger.debug('Register Property "' + name + '"', options);
        this._registeredProperties.set(name, {
          observable: this.dynamicInstanceProperties[name],
          options,
        });
      }
    }

    if (this._linkEvents) {
      for (const name in description.events) {
        this._logger.debug('Create property interface for "' + name + '"');

        const options = description.events[name];

        // Add only elements, that are subscribed.
        // Properties, which are only publishing
        // should throw an error, if data is published
        // in a remote. This is done to maintain
        // consistency.
        // let mode = prop.mode;

        if (this.dynamicInstanceEvents[name]) {
          throw Error("Name alread used. Not able to use the name twice");
        }

        // Make shure it isnt published.
        // options.preventSendingToRegistery = true;

        // Register the Observable:
        this.dynamicInstanceEvents[name] = this._core.eventDistributor.register(
          // Assign a new Observable.
          this._emitterFactory(),
          // Use the provided Properties:
          _invertMode(options)
        );

        if (!options.isDynamic) {
          if (this[name]) {
            throw Error("Name alread used. Not able to use the name twice");
          }
          // Use the Same Element.
          this[name] = this.dynamicInstanceEvents[name];
        }

        this._logger.debug('Register Property "' + name + '"', options);
        this._registeredEvents.set(name, {
          emitter: this.dynamicInstanceEvents[name],
          options,
        });
      }
    }
  }

  /**
   * Creates an instance of NopeGenericModule.
   * @param {INopeDispatcher} _core
   * @param {() => INopeObservable<any>} _observableFactory
   * @memberof NopeGenericModule
   */
  constructor(
    _core: INopeCore,
    protected _emitterFactory: () => INopeEventEmitter<any>,
    protected _observableFactory: () => INopeObservable<any>,
    protected _linkProperties: boolean = true,
    protected _linkEvents: boolean = true
  ) {
    super(_core);
  }

  public async listMethods() {
    const _this = this;
    return Object.getOwnPropertyNames(this.dynamicInstanceMethods).map(
      (name) => {
        return {
          method: _this.dynamicInstanceMethods[name],
          options: null,
        };
      }
    );
  }

  public async registerProperty<T, S = T, G = T>(
    name: string,
    observable: INopeObservable<T, S, G>,
    options: IEventOptions
  ): Promise<void> {
    throw Error("Function Should not be called on remote!");
  }

  public async registerMethod(
    name: string,
    func: (...args: any[]) => Promise<any>,
    options: IServiceOptions
  ): Promise<void> {
    throw Error("Function Should not be called on remote!");
  }

  public async unregisterFunction(name: string): Promise<void> {
    throw Error("Function Should not be called on remote!");
  }

  public async unregisterProperty(name: string): Promise<void> {
    throw Error("Function Should not be called on remote!");
  }

  public async init(): Promise<void> {
    try {
      await super.init();
    } catch (e) {
      throw Error("Call fromDescription before using");
    }
  }

  public async dispose(): Promise<void> {
    for (const name in this.dynamicInstanceProperties) {
      this.dynamicInstanceProperties[name].dispose();
      // Remove Reference
      delete this[name];
    }

    for (const name in this.dynamicInstanceEvents) {
      this.dynamicInstanceEvents[name].dispose();
      // Remove Reference
      delete this[name];
    }

    this.dynamicInstanceProperties = {};

    for (const name in this.dynamicInstanceMethods) {
      delete this[name];
      delete this.dynamicInstanceMethods[name];
    }

    this._registeredProperties.clear();
    this._registeredEvents.clear();
    this._registeredMethods.clear();
  }
}
