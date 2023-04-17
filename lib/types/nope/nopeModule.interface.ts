/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc Defintion of a generic Module.
 */

import { IJsonSchema } from "../IJSONSchema";
import {
  TGetPorts,
  TRenderConfigureServicePage,
  TServiceGetPortsReturn,
} from "../ui";
import { ICallOptions } from "./nopeCommunication.interface";
import { INopeDescriptor } from "./nopeDescriptor.interface";
import { INopeObservable } from "./nopeObservable.interface";
import { INopePromise } from "./nopePromise.interface";

/**
 * Description of an Author
 *
 * @export
 * @interface IAuthor
 */
export interface IAuthor {
  surename: string;
  forename: string;
  mail: string;
}

/**
 * Description of a Version
 *
 * @export
 * @interface IVersion
 */
export interface IVersion {
  version: number;
  date: Date;
}

export interface INopeModuleDescription {
  /**
   * Name of the Module. The name of the module must be written in lowercase.
   *
   * @type {string}
   * @memberof INopeModuleDescription
   */
  identifier: string;

  /**
   * Type of the Module
   *
   * @type {string}
   * @memberof INopeModuleDescription
   */
  readonly type: string;

  /**
   * A Description of the Module. This is used to describe roughly
   * what the module is capable of doing. Consider this as Module
   * a kind of Documentation. Based on the fact, that the module
   * will be offered in the Network, provide a meaning full documentation
   *
   * @type {string}
   * @memberof INopeModuleDescription
   */
  description: string;

  /**
   * The Author of the Module
   *
   * @type {IAuthor}
   * @memberof INopeModuleDescription
   */
  author: IAuthor;

  /**
   * Description of the provided Version of the Module.
   *
   * @type {IVersion}
   * @memberof INopeModuleDescription
   */
  version: IVersion;

  /**
   * Contains the provided functions.
   *
   * > **key** = `id` of the function
   *
   * @type {{ [index: string]: IServiceOptions }}
   * @memberof INopeModuleDescription
   */
  readonly methods: { [index: string]: IServiceOptions };

  readonly events: { [index: string]: IEventOptions };

  readonly properties: { [index: string]: IEventOptions };

  readonly uiLinks: Array<{ name: string; description: string; link: string }>;
}

export interface INopeModule extends INopeModuleDescription {
  /**
   * Helper Function, to extract the Name of the Property or the Identifier.
   *
   * @param {(((...args) => Promise<any>) | INopeObservable<any>)} propOrArg
   * @return {*}  {string}
   * @memberof INopeModule
   */
  getIdentifierOf(
    propOrFunc: ((...args) => Promise<any>) | INopeObservable<any>
  ): string;

  /**
   * Function used to register a Function
   *
   * @param {string} name Name of the Function
   * @param {(...args) => Promise<any>} method The Function
   * @param {IServiceOptions} options The Options used during subscription
   * @return {*}  {Promise<void>}
   * @memberof IBaseModule
   */
  registerMethod(
    name: string,
    method: (...args) => Promise<any>,
    options: IServiceOptions
  ): Promise<void>;

  /**
   * Function used to unregister a Function
   *
   * @param {string} name Name of the Function.
   * @return {*}  {Promise<void>}
   * @memberof IBaseModule
   */
  unregisterFunction(name: string): Promise<void>;

  /**
   * Function to Register a Property. If called for an existing Property, the Data will be
   * updated.
   *
   * @template T Internal Type
   * @template S Setter Type
   * @template G Getter Type
   * @param {string} name Name of the Property.
   * @param {INopeObservable<T, S, G>} observable The Observable.
   * @param {IEventOptions} options The Options which are used during registering the Observable.
   * @return {*}  {Promise<void>}
   * @memberof IBaseModule
   */
  registerProperty<T, S = T, G = T>(
    name: string,
    observable: INopeObservable<T, S, G>,
    options: IEventOptions
  ): Promise<void>;

  /**
   * Function used to unregister a Property
   *
   * @param {string} name Name of the Property.
   * @return {Promise<void>}
   * @memberof IBaseModule
   */
  unregisterProperty(name: string): Promise<void>;

  /**
   * Function to list the available Functions of the module. This will hold all available functions
   * (dynamic and static functions).
   *
   * @return {Promise<Array<{ name: string, schema: IDescriptor, options: IServiceOptions }>>}
   * @memberof IBaseModule
   */
  listMethods(): Promise<
    Array<{ method: (...args) => Promise<any>; options: IServiceOptions }>
  >;

  /**
   * Function used to get an List of all registered Properties.
   *
   * @return {Promise<Array<{ name: string, schema: IDescriptor, options: IEventOptions }>>}
   * @memberof IBaseModule
   */
  listProperties(): Promise<
    Array<{ observable: INopeObservable<any>; options: IEventOptions }>
  >;

  /**
   * Function used to initialze the Module.
   *
   * @return {Promise<void>}
   * @memberof IBaseModule
   */
  init(...args): Promise<void>;

  /**
   * Function used to Dispose the Module.
   *
   * @return {Promise<void>}
   * @memberof IBaseModule
   */
  dispose(): Promise<void>;

  /**
   * Function used to derive a parsable Description of the Module.
   *
   * @return {INopeModuleDescription}
   * @memberof INopeModule
   */
  toDescription(): INopeModuleDescription;

  /**
   * Internal Element, which is used to store elements, that should be added
   * automaticallay.
   *
   * @type {(Array<{accessor: string, options:IEventOptions | IServiceOptions}>)}
   * @memberof INopeModule
   */
  _markedElements: Array<{
    accessor: string;
    options: IEventOptions | IServiceOptions;
    type: "method" | "prop" | "event";
  }>;
}

export interface IGenericNopeModule extends INopeModule {
  dynamicInstanceMethods: {
    [index: string]: <T>(...args) => INopePromise<T>;
  };
  dynamicInstanceProperties: {
    [index: string]: INopeObservable<any>;
  };
  dynamicInstanceMethodsWithOptions: {
    [index: string]: <T>(
      options: Partial<ICallOptions>,
      ...args
    ) => INopePromise<T>;
  };
}

/**
 * Descriptor of an Property.
 *
 * @export
 * @interface IEventOptions
 */
export interface IEventOptions {
  /**
   * Mode of the Property Connection.
   */
  mode: "subscribe" | "publish" | Array<"subscribe" | "publish">;

  /**
   * Schema of the Property.
   */
  schema:
    | {
        getter: INopeDescriptor;
        setter: INopeDescriptor;
        internal: INopeDescriptor;
      }
    | INopeDescriptor;

  topic:
    | string
    | {
        subscribe?: string;
        publish?: string;
      };

  /**
   * Flag, to indicate, that the Item is dynamic.
   *
   * @type {boolean}
   * @memberof IEventOptions
   */
  isDynamic?: boolean;
}

/**
 * Options, used to register a Function.
 *
 * @export
 * @interface IServiceOptions
 */
export interface IServiceOptions<T = any> extends Partial<ICallOptions> {
  /**
   * Instead of generating a uuid an id could be provided
   *
   * @type {string}
   * @memberof IServiceOptions
   */
  id?: string;

  /**
   * Schema of the Function.
   *
   * @type {INopeDescriptor}
   * @memberof IServiceOptions
   */
  schema: INopeDescriptor;

  /**
   * The ui definition of the service.
   */
  ui?: {
    /**
     * Custom function to render the service in the editor
     */
    serviceConfiguration?: TRenderConfigureServicePage<T>;

    /**
     * Helper to enable auto generating a configuration
     */
    autoGenBySchema?:
      | {
          /**
           * Function used to Descripe the configured Settings in a short sentence,
           * based on the given settings.
           */
          getDescriptionText?: (item: { [index: string]: any }) => string;

          /**
           * Function, which will be used to convert the service parameters.
           *
           * @return {T}
           * @memberof IEditPage
           */
          getData?: (item: { [index: string]: any }) => T;

          /**
           * Helper function to generate ports, based on the given items.
           * @param item
           */
          getPorts?: (item: { [index: string]: any }) => TServiceGetPortsReturn;
        }
      | true;

    /**
     * Flag to indicate, that rendering the service configuration requires
     * a provider itself. This for instance is the case, if some functions
     * needs to be called.
     */
    requiredProvidersForRendering?: string[];

    /**
     * Helper to generate the Pors based on the provided node data.
     */
    getPorts?: TGetPorts<T>;

    /**
     * Helper to get the Icon, it must be available under
     * 'assets/icons/{icon}.png'. Just enter the **name**
     *
     */
    icon?: string;
  };

  /**
   * Flag, to indicate, that the Item is dynamic.
   *
   * @type {boolean}
   * @memberof IServiceOptions
   */
  isDynamic?: boolean;

  /**
   * The Package of the service to list it in.
   */
  package?: string;
}

/**
 * Parsable Description of a Module
 */
export interface IParsableDescription {
  name: string;
  properties: IEventOptions[];
  methods: IServiceOptions[];
}
