/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { INopeEventEmitter } from "../nope/nopeEventEmitter.interface";
import { INopeObservable } from "../nope/nopeObservable.interface";

/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

export interface IMinProvidedDataSet {
  event: any;
  panels: IPossiblePanels;
}

export type ICallback<D extends IMinProvidedDataSet> = (data: D) => void;

/** Default Callback for Buttons etc inside of a toolbar and the layout. */
export type IAdaptDataCallback<D extends IMinProvidedDataSet> = (
  event: any,
  panels: IPossiblePanels
) => D;

/** Valid panel defintions. (see w2ui) */
export type ValidPanels =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "preview"
  | "main";

export const ValidPanels: ValidPanels[] = [
  "left",
  "right",
  "top",
  "bottom",
  "preview",
  "main",
];

export type IPossiblePanels = {
  [P in ValidPanels]?: IPanelInstance;
};

export type IPanels = {
  [P in ValidPanels]?: IPanelControl;
};

export interface IPanelControl {
  visible: boolean;
  toggle(): void;
  icon:
    | "arrow-left-outline"
    | "arrow-right-outline"
    | "arrow-up-outline"
    | "arrow-down-outline"
    | string;
  tooltip: string;
  enabled: boolean;
}

/**
 * Base data of an W2UI-Element
 *
 * @export
 * @interface IBaseElement
 * @template D The desired data, which will be used during callbacks.
 */
export interface IBaseElement<D extends IMinProvidedDataSet> {
  /**
   * Id of the Element
   *
   * @type {string}
   */
  id: string;
  /**
   * Flag to disable the Element
   *
   * @type {boolean}
   */
  disabled?: boolean;
  /**
   * Flag to hide the element.
   *
   * @type {boolean}
   */
  hidden?: boolean;
  /**
   * Text to render
   */
  text?: string | ((item: any) => string);
  /**
   * Style sheet
   */
  style?: string;
  /**
   * Badge to be rendered as counter (number)
   */
  count?: number;
  /**
   * The Type. This will be overwritten by the elements.
   *
   * @type {string}
   */
  type?: string;
  /**
   * A Tooltip, which will be renderd on hovering.
   *
   * @type {string}
   */
  tooltip?: string;
  /**
   * Callback which will be called, on clicking the element
   */
  onClick?: ICallback<D>;
  /**
   * Callback which will be called, on refresing (rerendering) the element
   */
  onRefresh?: ICallback<D>;
}

/** A Classical Button */
export interface IButton<D extends IMinProvidedDataSet>
  extends IBaseElement<D> {
  type: "button";
  /** An Icon, which will be rendered next to the Label of the button */
  icon?: string;
  /** An Image, which will be rendered next to the Label */
  img?: string;
}

/** A Classical Checkbox */
export interface ICheckbox<D extends IMinProvidedDataSet>
  extends IBaseElement<D> {
  type: "check";
  /** An Icon, which will be rendered next to the Label  */
  icon?: string;
  /** An Image, which will be rendered next to the Label */
  img?: string;
  /** An Flag, which will set the Element to Checked or not */
  checked?: boolean;
}

/** A Classical Radiobutton */
export interface IRadioButton<D extends IMinProvidedDataSet>
  extends IBaseElement<D> {
  type: "radio";
  /** An Icon, which will be rendered next to the Label  */
  icon?: string;
  /** An Image, which will be rendered next to the Label */
  img?: string;
  /** Flag, whether this element will be checked or not */
  checked?: boolean;
  /**
   * Group of the Radio-Buttons. A Group contains multiple
   * Element. But in a group, only one element can be selected
   * at the same time
   */
  group?: string | number;
}

/**
 * Helper Entry for a Radio Menu Entry
 *
 * @export
 * @interface IRadioMenuItemDescription
 */
export interface IRadioMenuItemDescription {
  id: string;
  /**
   * Text of the Radio element. It will usally be render next to the icon
   *
   * @type {string}
   * @memberof IRadioMenuItemDescription
   */
  text?: string;
  /**
   * An icon, which will be rendered.
   *
   * @type {string}
   * @memberof IRadioMenuItemDescription
   */
  icon?: string;
  /**
   * An image instead of the icon.
   *
   * @type {string}
   * @memberof IRadioMenuItemDescription
   */
  img?: string;
  /**
   * Option, to disable the entry.
   *
   * @type {boolean}
   * @memberof IRadioMenuItemDescription
   */
  disabled?: boolean;

  checked?: boolean;
  selected?: boolean;
}

/**
 * An Element containing a Menu wiht Buttons
 */
export interface IMenu<D extends IMinProvidedDataSet> extends IBaseElement<D> {
  type: "menu";
  /** valid Icons next to the Menu */
  icon?:
    | "icon-folder"
    | "icon-page"
    | "icon-reload"
    | "icon-columns"
    | "icon-search"
    | "icon-add"
    | "icon-delete"
    | "icon-save"
    | "icon-edit"
    | "icon-bullet-black";
  /**
   * List of Items, which will be rendered in the Menu
   */
  items: Array<IBaseElement<D> | IMenu<D>>;
}

/**
 * A Sub-Menu containing checkable Attributes
 */
export interface IMenuCheckbox<D extends IMinProvidedDataSet>
  extends IBaseElement<D> {
  type: "menu-check" | "menu-radio";
  icon?:
    | "icon-folder"
    | "icon-page"
    | "icon-reload"
    | "icon-columns"
    | "icon-search"
    | "icon-add"
    | "icon-delete"
    | "icon-save"
    | "icon-edit"
    | "icon-bullet-black";
  items: Array<{
    id: string; // id of the menu item
    text?: string; // text of the menu item
    icon?: string; // css class for icon font
    img?: string; // css class for an image
    disabled?: boolean; // indicates if menu item is disabled
    checked?: boolean; // indicates if menu item is checked (for menu-check or menu-radio)
    selected?: boolean;
  }>;
  selected?: string;
}

/**
 * A customizable dropdown
 */
export interface ICustomDropDown<D extends IMinProvidedDataSet>
  extends IBaseElement<D> {
  type: "drop";
  /**
   * A text (containing the HTML Code), or a function, which will
   * return the HTML code.
   */
  html: string | ((value: any) => string);
}

/**
 * A customizable HTML element in the Menu
 */
export interface ICustomHTML<D extends IMinProvidedDataSet>
  extends IBaseElement<D> {
  type: "html";
  /**
   * A text (containing the HTML Code), or a function, which will
   * return the HTML code.
   */
  html: string | ((value: any) => string);
}

/**
 * A Color Picker
 */
export interface IColor<D extends IMinProvidedDataSet> extends IBaseElement<D> {
  type: "color";
  /**
   * Parameter to disable/activate transparent Colors
   */
  transparent?: boolean;
}

/**
 * A Color selector, which uses a Textinput to render the Hex-Code
 */
export interface ITextColor<D extends IMinProvidedDataSet>
  extends IBaseElement<D> {
  type: "text-color";
  /**
   * Parameter to disable/activate transparent Colors
   */
  transparent?: boolean;
}

/**
 * A Simple Break (a vertical line)
 */
export interface IBreak {
  type: "break";
}

/**
 * Simple Spacer
 */
export interface ISpacer {
  type: "spacer";
}

/**
 * Type describing valid Elements of A Menu
 */
export type IToolbarElements<D extends IMinProvidedDataSet> =
  | IButton<D>
  | ICheckbox<D>
  | IRadioButton<D>
  | IMenu<D>
  | IMenuCheckbox<D>
  | ICustomDropDown<D>
  | ICustomHTML<D>
  | IColor<D>
  | ITextColor<D>
  | IBreak
  | ISpacer;

/**
 * A Menu
 */
export interface IMenubar<D extends IMinProvidedDataSet> {
  /**
   * Elements, ordered by their index, which should be
   * rendered in the Menu.
   */
  items: Array<IToolbarElements<D>>;
}

/**
 * A Configuration to define a Tab-Group
 *
 * @export
 * @interface ITabProps
 */
export interface ITabProps {
  /**
   * Callback, which will be call during rendering the tab group for the first time.
   *
   * @memberof ITabProps
   */
  onMount?: (item: ITabProps) => void;

  /**
   * Callback, which will be called if a new tab is created. If creating is permitted,
   * the promise must resolve `false`, otherwise a tab-defintion (see {@link ITab}) must
   * be resolved.
   *
   * @memberof ITabProps
   */
  onNewTab?: () => Promise<ITab | false>;

  /**
   * Callback, which is call if the user wants to change the tab. The callback must resolve
   * a `boolean`, where as `true` allows the tab-change, `false` permits the change.
   *
   * @memberof ITabProps
   */
  onTabSelect?: (oldTabId: ITab, newTabId: ITab) => Promise<boolean>;

  /**
   * Callback, which is called, if the Tab receivs a `double-click`. The function can adapt
   * the Tab configuration (for example its label) which must be returned by this label.
   *
   * @memberof ITabProps
   */
  onTabEdit?: (tab: ITab) => Promise<ITab>;

  /**
   * Callback, which is call if the user wants to change the tab. The callback must resolve
   * a `boolean`, where as `true` allows the deleting the tab, `false` permits deleting the
   * tab.
   *
   * @memberof ITabProps
   */
  onTabDelete?: (tabId: ITab, forced?: boolean) => Promise<boolean>;

  /**
   * A callback, which will be called, if all tabs has been closed.
   *
   * @memberof ITabProps
   */
  onNoTabSelected?: () => Promise<void>;

  /**
   * Callback, which is called if the Configuration has been changed. This is the case, if a
   * tab as been `added`, `selected` or `removed`
   *
   * @memberof ITabProps
   */
  onConfigChanged?: (config: ITabProps) => void;
  /**
   * Flag to allow / disable reordering of the tabs.
   *
   * @type {boolean}
   * @memberof ITabProps
   */
  reorder?: boolean;

  /**
   * Object, containing the inital tabs.
   *
   * @memberof ITabProps
   */
  tabs: {
    /**
     * Flag, which will ensure that there exits a tab
     * with the label `+`. If clicked, a new tab will
     * be inserted. This results in the calling the
     * {@link ITabProps.onNewTab} callback.
     *
     * @type {boolean}
     */
    allowNewTabs?: boolean;
    /**
     * Flag of the active tab.
     *
     * @type {string}
     */
    active: string;
    /**
     * List of the available tabs.
     *
     * @type {ITab[]}
     */
    items: ITab[];
  };
  // Name of the Tab-Group.
  name: string;
  /**
   * The id of the W2UI-Layout, where the tab-group is getting rendered
   *
   * @type {string}
   * @memberof ITabProps
   */
  layoutId: string;
  /**
   * The position on the W2UI-Layout, where the tab-group is getting rendered
   *
   * @type {ValidPanels}
   * @memberof ITabProps
   */
  position: ValidPanels;
}

export type TRenderAngularComponentAtElement<T = any> = (options: {
  element: any;
  component: T;
  inputs?: { [index: string]: any };
  outputs?: { [index: string]: (value: any) => void };
}) => {
  destroy: () => void;
  instance: T;
};

export interface IPanelOptions {
  // The Panel ID
  id: string;
  // type of the panel can be: left, right, top, bottom, preview
  type: ValidPanels;
  // title for the panel
  title?: string;
  // width or height of the panel depending on panel type
  size?: number;
  // minimum size of the panel in px when it is resized
  minSize?: number;
  // if a number, then it defined maximum size of the panel
  maxSize?: number;
  // indicates if panel is hidden
  hidden?: boolean;
  // indicates if panel is resizable
  resizable?: boolean;
  // overflow property of the panel, can have same values as similar CSS property
  overflow?: string;
  // additional css styles for the panel
  style?: string;
  // content of the pane, can be a string or an object with .render(box) method
  content?: string | any;
  // width of the panel, read only
  width?: number;
  // height of the panel, read only
  height?: number;
  // w2tabs object for the panel
  tabs?: Partial<ITabProps>;

  // The Rendering Settings.
  rendering?: TRendering;

  show?: {
    // indicates what sections are shown
    tabs: boolean;
    toolbar: boolean;
  };
}

export interface IPanel extends IPanelOptions {
  id: string;

  // toolbar?: IToolbar<D>,
  /**
   * Enable / Disable the Toggle Button on the bottom. Defaults to false.
   */
  toggle?:
    | boolean
    | {
        /**
         * Provide an additional Tool-Tip.
         */
        tooltip:
          | {
              show: string;
              hide: string;
            }
          | string;
        /**
         * Custom Icon to use.
         */
        icon:
          | {
              show: string;
              hide: string;
            }
          | string;
      };
  /**
   * Style for the Panel
   */
  style?: string;
  // events
  onRefresh?: (event: any) => void; // refresh event for the panel
  onResizing?: (event: any) => void; // resizing event for the panel
  onShow?: (event: any) => void; // show event for the panel
  onHide?: (event: any) => void; // hide event for the panel
  callback?: (event: any) => void;
}

export interface ITab {
  id: string; // command to be sent to all event handlers
  text: string; // tab caption
  hidden?: boolean; // defines if tab is hidden
  disabled?: boolean; // defines if tab is disabled
  closable?: boolean; // defines if tab is closable
  style?: string; // additional style for the tab text
  tooltip?: string; // mouse hint for the tab
  onClick?: (event: any) => void; // click event handler (only this tab)
  onRefresh?: (event: any) => void; // refresh event handler (only this tab)
  onClose?: (event: any) => void; // close event handler (only this tab),
  rendering?: TRendering;
}

export type TRendering =
  | IRenderHTML
  | IRenderW2UIElement
  | IRenderMarkdown
  | ICustomRender;

export interface IRenderHTML {
  type: "html";
  html: string;
}

export interface IRenderMarkdown {
  type: "markdown";
  markdown: string;
}

export interface ICustomRender {
  type: "custom";
  create: (div: HTMLElement) => Promise<void>;
  destroy: () => Promise<void>;
}

export interface IRenderW2UIElement {
  type: "w2ui-element";
  elementID: string;
}

export interface IToolbar<D extends IMinProvidedDataSet> {
  items: Array<IToolbarElements<D>>;
}

export interface ISelectionContextMenuEntry<T> {
  id: string;
  text: string;
  icon?: string;
  hidden?: boolean;
  callback?: (menu: ISelectionContextMenuEntry<T>[], item: T) => void;
}

export interface IAdditionalSelectionContextMenuEntry<T>
  extends ISelectionContextMenuEntry<T> {
  callback: (menu: ISelectionContextMenuEntry<T>[], item: T) => void;
}

/**
 * An Interface to define a Windows-Like-Toolbar.
 */
export interface IToolbarConfig<D extends IMinProvidedDataSet> {
  // Element to Select an Active Tab
  activeTab?: string;
  // Object containing the Tabs with the Corresponding Menu
  tabs: {
    [index: string]: {
      /**
       * The Render Text of the Tab
       */
      text: string;
      /**
       * Flag which hides the Toolbar
       */
      hidden?: boolean;
      /**
       * Flag which disables the Toolbar
       */
      disabled?: boolean;
      /**
       * A Tooltip, which is shown on hovering over the Tab-Element
       */
      tooltip?: string;
      /**
       * A Configuration of the Menu, which is provided inside of the Toolbar.
       */
      menu: IMenubar<D>;
      /**
       * Called, if the toolbar is active
       */
      onActive?: (D) => Promise<boolean>;

      /**
       * Called, if the toolbar should be left.
       */
      onLeave?: (D) => Promise<boolean>;
    };
  };
}

export interface ILayout {
  // The size of draggable resizer between panels.
  resizer?: number;

  // Padding between panels in px.
  padding?: number;

  // The Included Panels
  panels?: IPanel[];
}

export interface IPanelInstance {
  // The Panel Object
  panel: any;
  // The Element
  element: HTMLElement;
  // A Function to Destroy the Panel
  destroy(): void;
  // Hide the Panel
  hide(immediate?: boolean): void;
  // Show the Panel
  show(immediate?: boolean): void;
  // Resize the Panel to the desired Size
  resize(size: number): void;
  // Function to Show a Message
  showMessage(options: {
    html?: string; // html of the message
    body?: string; // similar to body in w2popup, can be used instead of options.html
    buttons?: string; // similar to buttons in w2popup, can be used instead of options.html
    width?: number; // width in px (if negative, then it is 100% of popup in message.width)
    height?: number; // height in px (if negative, then it is 100% of popup in message.height)
    hideOnClick?: boolean; // if true, hide message if user clicks on it
    onOpen?: (event: any) => void; // function to execute when message opens
    onClose?: (event: any) => void; // function to execute when message closes
  }): void;
  // Function to Close the Message
  closeMessage(): void;
  // Funtion to unlock the panel,
  unlock(): void;
  // Function to lock the panel,
  lock(message?: string, showSpinner?: boolean): void;
  // Function to get the height
  width(): number;
  // Funtion to unlock the panel,
  height(): number;
  // The Options of the Panel.
  options: IPanelOptions;
}

/**
 * A Interface for a Group
 */
export interface ISelectionGroup<T> {
  /** A Flag, for showing, that the Element is a Group */
  group: true;
  /** The Label / Text of the Group, if it is rendered in the Sidebar */
  text: string;
  /** The Elements, which are provided in the Group */
  elements: Array<ISelectionTemplate<T> | ISelectionGroup<T>>;
}

/**
 * A Template for an element in the Sidebar
 */
export interface ISelectionTemplate<T> {
  /** The Label / Text of the Group, if it is rendered in the Sidebar */
  text: string;
  /** A List of Keywords, which are used to Find the corresponding Elements */
  keywords: Array<string>;
  /** The Element containing the Template of a Node */
  template: T;
  /** The Icon to use */
  icon?: string;
}

/**
 * The complete Config of the Selection interface
 */
export interface ISelectionConfig<T> {
  favorites: Array<ISelectionTemplate<T>>;
  elements: {
    [index: string]: {
      id: string;
      label: string;
      items: Array<ISelectionTemplate<T> | ISelectionGroup<T>>;
    };
  };
}

/**
 * The Element, which is rendered in the Selection
 *
 * (The ID is required by the W2UI)
 */
export interface ISelectionElement<T> extends ISelectionTemplate<T> {
  id: number;
}

export interface IW2UISelection<T> {
  id: string;
  text: string;
  expanded: boolean;
  group: boolean;
  groupShowHide: boolean;
  hidden: boolean;
  nodes: ISelectionElement<T>[];
}

export interface IHotKeyAction<D extends IMinProvidedDataSet> {
  /**
   * The Pressed Key. Please use a valid "KeyCode".
   *
   * @type {string}
   */
  keyCode: string;
  /**
   * Optional CTRL Key, which has to be pressed
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof IHotKeyAction
   */
  ctrlKey?: boolean;
  /**
   * Optional ALT Key, which has to be pressed
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof IHotKeyAction
   */
  altKey?: boolean;
  /**
   * Optional SHIFT Key, which has to be pressed
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof IHotKeyAction
   */
  shiftKey?: boolean;
  /**
   * The corresponding Callback, which will handle the
   * Action if a Hotkey Press has been detected.
   *
   * @type {ICallback<D>}
   */
  onPress: ICallback<D>;
  /**
   * The corresponding Callback, which will handle the
   * Action if a Hotkey Press has been detected.
   *
   * @type {ICallback<D>}
   */
  onRelease?: ICallback<D>;
}

/**
 * Options for a Layout
 *
 * @export
 * @interface ILayoutOptions
 * @template T The Template Element.
 * @template D Callback Data
 */
export interface ILayoutOptions<D extends IMinProvidedDataSet> {
  /**
   * Define a custom ID.
   */
  id?: string;

  /**
   * The Title which will be shown on the Top.
   * If not present, no titlebar will be shown
   *
   * @type {string}
   * @memberof ILayoutOptions
   */
  title: string;

  /**
   * Helper to show the Toggle Elements or not.
   */
  showToggleElements?: boolean;

  /**
   * Configuration of the Toolbar.
   *
   * @type {{
   *         config: IToolbarConfig<D>
   *         panel: ValidPanels
   *     }}
   * @memberof ILayoutOptions
   */
  toolbar?: {
    /**
     * A Toolbar Configuration.
     *
     * @type {IToolbarConfig<D>}
     */
    config: IToolbarConfig<D>;

    /**
     * The Panel, which will be used to render the Toolbar. Normally this should be
     * set to "top".
     *
     * @type {ValidPanels}
     */
    panel: ValidPanels;
  };

  /**
   * A List containing all Panels, which should be generaged
   *
   * @type {IPanel<D>[]}
   * @memberof ILayoutOptions
   */
  panels: IPanel[];

  /**
   * Optional callback which will be called it a resize event occours.
   *
   * @memberof ILayoutOptions
   */
  onResized?: (panels: IPossiblePanels) => Promise<void>;

  /**
   * Callback, which will be used to provide the actual Editmode.
   *
   * @memberof ILayoutOptions
   */
  onEditModeChanged?: (editingEnabled: boolean) => Promise<void>;

  /**
   * Function, which will be called before the Componented is getting destroyed.
   * This function could be used to clean up everything
   *
   * @memberof ILayoutOptions
   */
  dispose?: () => Promise<void>;

  /**
   * An addtional Function which will be called before a Callback of the Context-Menu
   * or Toolbar will be called.
   *
   * @memberof ILayoutOptions
   */
  adaptData: IAdaptDataCallback<D>;

  /**
   * Optional Hotkey, which will triggerd custom Functions
   *
   * @type {{
   *         key: string,
   *         onPress: ICallback<D>
   *     }[]}
   * @memberof ILayoutOptions
   */
  hotkeys?: IHotKeyAction<D>[];

  /**
   * Called if the layout is ready
   *
   * @author M.Karkowski
   * @memberof ILayoutOptions
   */
  onReady?: () => Promise<void>;

  /**
   * Boolean to toggle the FullScreen
   *
   * @author M.Karkowski
   * @memberof ILayoutOptions
   */
  fullScreen?: boolean;
}

/**
 * Type which is used to render an custom html code.
 * Must return a function, which will be called if
 * the panel is destroyed.
 *
 * Result, that must be provided by the Render Function.
 */
export type TRenderFunctionResult = {
  /**
   * Callback, which is called on destroyed
   */
  onDestroy?: () => Promise<boolean>;
  /**
   * Callback, which is called, if the panel is hide
   */
  onHide?: () => Promise<boolean>;
  /**
   * Callback, which is calle, if the Element is rendered.
   */
  onShow?: () => Promise<void>;
};

/**
 * Type which is used to render an custom html code.
 * Must return a function, which will be called if
 * the panel is destroyed.
 */
export type TRenderFunction<
  I,
  O extends TRenderFunctionResult = TRenderFunctionResult,
  D extends IMinProvidedDataSet = IMinProvidedDataSet
> = (
  div: HTMLDivElement,
  options: {
    input: I;
    setVisibilityOfPanel: (value: boolean) => void;
    layout: IBasicLayoutComponent<D>;
  }
) => Promise<O>;

/**
 * Base Component to render a Layout.
 */
export interface IBasicLayoutComponent<
  D extends IMinProvidedDataSet = IMinProvidedDataSet
> {
  /**
   * Flag, showing if the layout is ready or not.
   *
   * @type {INopeObservable<boolean>}
   * @memberof IBasicLayoutComponent
   */
  ready: INopeObservable<boolean>;

  /**
   * An Eventemitter, to show that the system has been resized
   *
   * @type {INopeEventEmitter<IPossiblePanels>}
   * @memberof IBasicLayoutComponent
   */
  resized: INopeEventEmitter<IPossiblePanels>;

  /**
   * The Elment, holding the currently created instances.
   *
   * @type {IPossiblePanels}
   * @memberof IBasicLayoutComponent
   */
  panels: IPossiblePanels;

  /**
   * Controll elements for the Panels. Contains a toggle function,
   * an icon, tooltip etc. This shows / hides the panels.
   *
   * @type {IPanelControl[]}
   * @memberof IBasicLayoutComponent
   */
  panelControlls: IPanelControl[];

  /**
   * Items of the Toolbar.
   *
   * @type {{ destroy(): void }}
   * @memberof IBasicLayoutComponent
   */
  toolbar: {
    /**
     * Callback to destroy the Toolbar.
     */
    destroy(): void;
    /**
     * Locks the tabs.
     */
    lock(tab?: string): void;

    /**
     * Releases the tabs.
     */
    release(tab?: string): void;

    /**
     * The Tab to add.
     * @param tabID The id of the Tab.
     * @param config The tab to add
     */
    add(tabID: string, config: IToolbarConfig<D>["tabs"]["tab"]): void;

    /**
     * Removes the tab.
     * @param tabID The name / id of the tab.
     */
    remove(tabID: string): void;

    /**
     * The w2ui-element of the toolbar (The icons)
     */
    toolbarElement: any;

    /**
     * The w2ui-elment of the tabs.
     */
    tabElement: any;
  };

  /**
   * The original W2UI Layout. See [here](https://w2ui.com/web/docs/2.0/) for more details and navigate to `layout`.
   * There you'll find all methods, events and properties to manipulate the layout. But you should use the wrappers,
   * provided by the abstraction in here.
   *
   * @type {*}
   * @memberof IBasicLayoutComponent
   */
  w2uiLayout: any;

  /**
   * Element containing specific helpers.
   *
   * @author M.Karkowski
   * @memberof IBasicLayoutComponent
   */
  helpers: { [index: string]: (...args) => any };

  /**
   * Flag, to toggle the Panel-Control. If set to false this control is not shown.
   *
   * @type {boolean}
   * @memberof IBasicLayoutComponent
   */
  panelControlEnabled: boolean;

  /**
   * Element to access the current Mouse-Position
   *
   * @type {MouseEvent}
   * @memberof IBasicLayoutComponent
   */
  currentMousePosition: MouseEvent;

  /**
   * You can disable the hot-keys defined in configuration
   *
   * @type {boolean}
   * @memberof IBasicLayoutComponent
   */
  hotkeysEnabled: boolean;

  /**
   * Helper, to check if the desired Panel is visible or not
   *
   * @param {ValidPanels} panel The panel to check.
   * @return {boolean}
   * @memberof IBasicLayoutComponent
   */
  isPanelVisible(panel: ValidPanels): boolean;

  /**
   * Function to toggle the visiblity of a given panel.
   *
   * @param {ValidPanels} panel The panel to manipulate.
   * @param {boolean} visible The visibility. `false` => hidden; `true` => visible.
   * @memberof IBasicLayoutComponent
   */
  controllVisibilityOfPanel(panel: ValidPanels, visible: boolean): void;

  /**
   * Helper to enable/disable the Controll Button of a panel. Therefore the Controll-Button
   * must be present.
   *
   * @param {ValidPanels} panel The panel of the button to manipulate.
   * @param {boolean} enabled `false` => disable; `true` => enable.
   * @memberof IBasicLayoutComponent
   */
  enablePanelControllButton(panel: ValidPanels, enabled: boolean): void;

  /**
   * Toggles the Edit mode.
   *
   * @param {boolean} [mode] The Mode. To force.
   * @memberof IBasicLayoutComponent
   */
  toggleEdit(mode?: boolean): void;

  /**
   * Opens a dynamic w2ui panel
   *
   * @author M.Karkowski
   * @template I Input data
   * @template A Additional Data
   * @template O Result Function of the Function
   * @param  options The ptions
   * @memberof IBasicLayoutComponent
   */
  openDynamicW2UiPanel<
    I = any,
    O extends TRenderFunctionResult = TRenderFunctionResult
  >(options: {
    /** Input which is fowarded to the render Function "render" */
    input?: I;
    /** Callback which will be called to create the element */
    render: TRenderFunction<I, O, D>;
    /** Appends the Panel or replaces it. */
    append?: boolean;
    /** Show the Panel on creating */
    showOnCreate?: boolean;
    /** The Panel to show */
    panel: ValidPanels;
  }): Promise<O>;

  /**
   * Closes a dynamic window!
   * @param options The options to use.
   */
  closeDynamicW2UiPanel(options: {
    /** Appends the Panel or replaces it. */
    silent?: boolean;
    /** The Panel to show */
    panel: ValidPanels;
  }): Promise<void>;

  /**
   * Returns the div of the panel.
   * @param panel THe Panel.
   */
  getElementOfPanel(panel: ValidPanels): null | any;

  /**
   * Updates the content of the Panel.
   * @param panel The panel
   * @param content The content / HTML
   */
  setContentOfPanel(panel: ValidPanels, content: string): void;

  /**
   * Changes the visiblity of a panel
   *
   * @author M.Karkowski
   * @param {ValidPanels} panel The panel to consider
   * @param {boolean} show The Flag to show / hide the panel. VISIBLE = TRUE;
   * @memberof IBasicLayoutComponent
   */
  setVisibilityOfPanel(panel: ValidPanels, show: boolean): void;

  /**
   * Helper to toggle the Screen mode (Fullscreen or normal)
   *
   * @author M.Karkowski
   * @memberof IBasicLayoutComponent
   */
  toggleScreenMode(): void;

  /**
   * Helper to open the fullscreen of the Layout.
   */
  openFullscreen(): void;

  /**
   * Helper to close the fullscreen of the Lay
   */
  closeFullscreen(): void;

  /**
   * Contains an actual set of the current data.
   */
  readonly data: D;
}
