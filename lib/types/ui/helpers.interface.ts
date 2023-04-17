/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import * as go from "gojs";
import { ILogger } from "js-logger";
import * as plotly from "plotly.js";
import { LoggerLevel } from "../../logger/nopeLogger";
import { IJsonSchema } from "../IJSONSchema";
import {
  IClassDescription,
  IServiceOptions,
  INopeDispatcher,
  INopeObservable,
  INopeDescriptor,
} from "../nope/index";
import {
  IBasicLayoutComponent,
  IMinProvidedDataSet,
  IPanel,
  IPossiblePanels,
  IRadioMenuItemDescription,
} from "./layout.interface";

export type TSettingsObject = { [index: string]: string | number | boolean };

/** Descripting a session, which the ui has established. */
export type TSession = {
  name: string;
  uri: string;
  port: number;
  dataServer: string;
  connection: "mqtt" | "io-client";
  forwardData: boolean;
  required: boolean;
};

/** A Schema to receive an object from the url (use the query pattern) */
export type TSimpleSchema = {
  [index: string]:
    | "number"
    | "integer"
    | "string"
    | "boolean"
    | {
        parse: (data: string) => any;
        validate: (data: string) => boolean;
      };
};

/**
 * Type containing the external libraries.
 */
export type TLibraries = {
  /**
   * The Nope Library. It contains only the Browser build.
   *
   * @type {*}
   */
  nope: any;

  /**
   * Built on top of d3.js and stack.gl, Plotly.js is a high-level, declarative charting library. plotly.js ships with over 40 chart types, including 3D charts,
   * statistical graphs, and SVG maps. plotly.js is free and open source and you can view the source, report issues or contribute on GitHub.
   *
   * For Tutorials and more checkout: https://plotly.com/javascript/
   */
  plotly: typeof plotly;

  /**
   * Out of the box w2ui is an all-in-one solution. It contains common UI widgets: Grid, Forms, Toolbars, Layout, Sidebar, Tabs, Popup and various field controls.
   * You do not need to put together a collection of mismatched plugins to accomplish your goals.
   *
   * Contains the original w2ui Library. https://w2ui.com/web/
   */
  w2uiHelpers: {
    w2popup: (...args) => any;
    w2alert: (...args) => any;
    w2confirm: (...args) => any;
    w2prompt: (...args) => any;
    w2grid: (...args) => any;
    w2utils: any;
    /**
     * The Custom W2UI-Helper provided by the nope-ui package.
     */
    nopeW2ui: any;
  };

  w2ui: any;

  /**
   * jQuery is a fast, small, and feature-rich JavaScript library. It makes things like HTML document traversal and manipulation, event handling,
   * animation, and Ajax much simpler with an easy-to-use API that works across a multitude of browsers. With a combination of versatility and extensibility,
   * jQuery has changed the way that millions of people write JavaScript.
   *
   * Contains jQuery. See: https://jquery.com/
   */
  jQuery: any;

  /**
   * Contains a library for a dynamic JSON-Editor. This contains a tree-view, with edit options.
   *
   * For more details checkout: https://github.com/josdejong/jsoneditor
   */
  jsoneditor: any;

  /**
   * GoJS is a JavaScript library that lets you easily create interactive diagrams in modern web browsers. GoJS supports graphical templates and data-binding
   * of graphical object properties to model data. You only need to save and restore the model, consisting of simple JavaScript objects holding whatever properties
   * your app needs. Many predefined tools and commands implement the standard behaviors that most diagrams need. Customization of appearance and behavior is
   * mostly a matter of setting properties.
   *
   * For more details checkout: https://gojs.net/latest/
   */
  gojs: typeof go;

  /**
   * Ace is an embeddable code editor written in JavaScript. It matches the features and performance of native editors such as Sublime, Vim and TextMate.
   * It can be easily embedded in any web page and JavaScript application. Ace is maintained as the primary editor for Cloud9 IDE and is the successor of
   * the Mozilla Skywriter (Bespin) project.
   *
   * For more details checkout: https://ace.c9.io/#nav=about
   */
  ace: typeof ace;
};

export type TcreateLayoutOptions = {
  /**
   * Id of the Layout
   */
  id: string;
  /**
   * ID of the div. given via `<div id="blabla" #blabla></div>`
   */
  divId: string;
  /**
   * Function which is called during resizing.
   *
   * Receives the `event` and the `panels` (containg all panels of the layout)
   */
  onResizeCallback?: (event: any, panels?: IPossiblePanels) => void;
  /**
   * The width, that should be set e.g. `100%` or `100px`
   */
  width?: string | number;
  /**
   * The height, that should be set e.g. `100%` or `100px`
   */
  height?: string | number;

  /**
   * To define.
   *
   * @type {*}
   */
  colors?: any;
};

export interface IUiDefinition {
  /**
   * Contains the ui-defintions of the Functions
   */
  functions: {
    /**
     * index - Function ID:
     */
    [index: string]: {
      /**
       * The provided UI-Functions
       */
      ui: IServiceOptions["ui"];
      /**
       * Original ID of the Function.
       */
      id: string;
      /**
       * Schema of the Function.
       *
       * @type {INopeDescriptor}
       * @memberof IServiceOptions
       */
      schema: INopeDescriptor;
    };
  };
  /**
   * Contains all UIs for the class
   */
  classes: {
    /**
     * Index = Class-Identifier.
     */
    [index: string]: {
      /**
       * The UI Defintion of the Class.
       */
      ui?: IClassDescription["ui"];
      /**
       * Definition of the UI.
       */
      methods: {
        [index: string]: IServiceOptions["ui"];
      };
    };
  };
}

export type IUiTheme = {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    info: string;
    warning: string;
    danger: string;
    light: string;
    dark: string;
  };
  font: {
    size: number;
    type: string;
    color: string;
    computedFont: string;
  };
};

/** Helper for the provided data: */
export interface IRenderData {
  helpers: {
    data: {
      /*
       * Function to set a data element. usally stores the data in key <-> value combination.
       * Make shure we are able to parse the data (for instance to json), before using this function.
       *
       * @param {string} key The key to store the value.
       * @param {*} value The data that should be stored.
       * @return {Promise<boolean>}
       * @memberof IDataInterface
       */
      setData(key: string, value: any): Promise<boolean>;

      /**
       * Helper to get the a value from the store, which is related to the key. If the data isn't present,
       * the store **must** store the provided `defaultValue`. Afterwards it **must** return the provided
       * `defaultValue`
       *
       * @template T expected type. Is defined by the `defaultValue`
       * @param {string} key The key, under which the data is expected.
       * @param {T} defaultValue The default value, which should be used if the data isnt present.
       * @return {Promise<T>} The extracted data / `defaultValue`
       * @memberof IDataInterface
       */
      getData<T>(key: string, defaultValue: T): Promise<T>;

      /**
       * Helper to test if the data exists.
       *
       * @author M.Karkowski
       * @param {string} key The key, under which the data is expected.
       * @return {Promise<boolean>}
       */
      hasData(key: string): Promise<boolean>;

      /**
       * Register Schema for data. If you try to store or pull data, the schema will be used to verify the data
       * @param key The path of the data which should be observed
       * @param schema The schema to store
       * @returns {boolean} Flag to show the shema is stored or not.
       */
      registerSchema(key: string, schema: IJsonSchema): boolean;

      /**
       * Helper, to store the configuration.
       * @returns success of the operation
       */
      store(): Promise<boolean>;
    };
    connection: {
      /**
       * Flag showing whether the Service is connected to a backend or not
       *
       */
      readonly sessionsConnected: INopeObservable<boolean>;

      /**
       * Flag, to define, whether a external connection is required to
       * set the {@link INoPEConnectService.sessionsConnected} to true.
       *
       * @type {boolean}
       * @memberof INoPEConnectService
       */
      readonly noExternalConnectionRequired: boolean;

      /**
       * Hostname used in the browser.
       *
       * @author M.Karkowski
       * @type {string}
       */
      readonly hostname: string;
      /**
       * Returns the available layers.
       *
       * @author M.Karkowski
       * @readonly
       * @type {(Array<TSession & { connected: boolean }>)}
       * @memberof NoPEService
       */
      readonly layers: Array<TSession & { connected: boolean }>;

      /**
       * Adds an communication Layer.
       *
       * @param {TSession} _session The Parameters for the Session.
       * @memberof NoPEService
       */
      addCommunicationLayer(_session: TSession): void;

      /**
       * Disconnects the Layer.
       * @param session The Session Parameters to use.
       */
      removeCommunicationLayer(session: TSession): void;

      /**
       * Helper Function to establish a connection to a backend. If called, to url is changed to the `pages/connect` and after a sucessfull connection, the original url is loaded **again**.
       *
       * >Use with care, if you get problems reloading the side again.
       * @param options
       * @returns
       */
      connect(options?: {
        delay: number; // Delay, after which the page is reloaded.
      }): Promise<boolean>;
    };
    file: {
      /**
       * Helper to upload data to the browser. (Opens a Popup)
       *
       * > The data is only available in the Browser.
       */
      upload: (options: {
        /**
         * Title of the upload form
         */
        title: string;
        width?: number;
        height?: number;
        /**
         * Callback which is called after the data has been received.
         *
         * @param error Error, during uploading
         * @param data The data formated as **string**
         */
        callback(error: any, data: string): void;
      }) => void;
      /**
       * Downloads some content as file.
       *
       */
      download: (
        content: string,
        fileName?: string,
        option?: {
          /**
           * Automatically provide Unicode text encoding hints
           * @default false
           */
          autoBom: boolean;
        }
      ) => void;
    };
    url: {
      /**
       * Helper to get an Object from a schema. The Schema must be from type Object and is only allowed to have
       * types "number", "boolean", "integer", "string". If a different type is used an error is thrown.
       * @param schema The JSON-Schema
       * @returns
       */
      getObjectFromQueryWithSchema(
        schema: IJsonSchema
      ): Promise<{ [index: string]: any } | false>;

      /**
       * Extract the data based on some query parameters. The Parameters to use are provided in the schema object.
       * @param simpleSchema
       * @returns
       */
      getObjectFromQuery(
        simpleSchema: TSimpleSchema
      ): Promise<{ [index: string]: any } | false>;

      /**
       * Generates a link with Query Parameters.
       * @param object
       * @returns
       */
      generateLinkWithQueryParams(
        ...objects: TSettingsObject[]
      ): Promise<string>;
    };
    layout: {
      /**
       * Helper to create a W2UI Layout
       *
       * @param {IPanel[]} panelConfig
       * @param {TcreateLayoutOptions} options
       * @param {...any[]} args
       * @return {*}
       */
      createLayout(
        panelConfig: IPanel[],
        options: TcreateLayoutOptions,
        ...args: any[]
      ): {
        layout: {
          layout: any;
          element: any;
          destroy: () => void;
        };
        panels: IPossiblePanels;
      };
      toolbar: {
        /**
         * Helper function, to generate a Radio Menu Entry for a Toolbar.
         *
         * @export
         * @template D The desired callback Data.
         * @template T The desired data of the item.
         * @param options The Options to define the radio-menu. Must contain items and a onSelect callback.
         * @return {*}
         */
        generateRadioMenuEntry<
          D extends IMinProvidedDataSet = IMinProvidedDataSet,
          T extends IRadioMenuItemDescription = IRadioMenuItemDescription
        >(options: {
          /**
           * The Toolbar Entries.
           *
           * @type {T[]}
           */
          items: T[];
          /**
           * The Id of the already selected radio-element
           *
           * @type {string}
           */
          selected?: string;
          /**
           * Callback, that should be called on selecting a radio-box item.
           *
           */
          onSelect: (data: D, item: T) => void;
        }): void;

        /**
         * Helper to render a Select Toobar.
         *
         * @template D
         * @template T
         * @param options
         */
        generateSelectMenuEntry<
          D extends IMinProvidedDataSet,
          T extends IRadioMenuItemDescription
        >(options: {
          /**
           * The Items which can be selected
           */
          items: (T | string)[];
          /**
           * The Selected Item
           */
          selected?: string;
          /**
           * The Text to Show
           */
          text: string;
          onSelect: (data: D, selection: { [index: string]: boolean }) => void;
        }): void;
      };
    };
    ui: {
      /**
       * Contains a Flag to toggle the ui into fullscreen or not.
       */
      readonly fullscreen: INopeObservable<boolean>;
      /**
       * Function, used to set the system to Fullscreen
       */
      openFullscreen(): void;
      /**
       * Function, used to close the fullscreen.
       */
      closeFullscreen(): void;
      /**
       * Returns a defintion of the currently used colors.
       */
      getTheme(): IUiTheme;
    };
    logging: {
      /**
       * Helper to log a message
       * @param level The Level of the Message
       * @param sender The Sender
       * @param message The Message. Should be a human friendly text
       */
      log(level: LoggerLevel, sender: string, message: string);
      /**
       * Helper to create a toast. See https://akveo.github.io/nebular/docs/components/toastr/overview#nbtoastrservice for examples.
       * @param level The Level of the Message
       * @param sender The Sender
       * @param message The Message. Should be a human friendly text
       */
      toast(level: LoggerLevel, sender: string, message: string);
    };
  };
  /**
   * Contains the information about the session.
   */
  session: IUiDefinition;
  logger: ILogger;
  dispatcher: INopeDispatcher;
  libraries: TLibraries;
}

export interface IDynamicUiRenderData<
  D extends IMinProvidedDataSet = IMinProvidedDataSet
> extends IRenderData {
  currentUi: IBasicLayoutComponent<
    IMinProvidedDataSet & IDynamicUiRenderData<D>
  >;
}
