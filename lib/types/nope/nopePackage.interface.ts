import { interfaces } from "inversify";
import { IJsonSchema } from "../IJSONSchema";
import { TInstanceManagerPage, TRenderInstancePage } from "../ui";
import { IInstanceCreationMsg } from "./nopeCommunication.interface";
import { IValidPromise } from "./nopeDispatcher.interface";
import { IServiceOptions, INopeModule } from "./nopeModule.interface";

export interface IClassDescriptor<T extends INopeModule = INopeModule> {
  /**
   * Identifier for a Single Element
   *
   * @type {(symbol | string)}
   * @memberof Y
   */
  selector?: symbol | string | Array<string | symbol>;

  /**
   * Selector for a the Factory.
   *
   * @type {(symbol | string)}
   * @memberof Y
   */
  factorySelector?: symbol | string | Array<string | symbol>;

  /**
   * Contains the Type of Constant or something similar
   *
   * @type {*}
   * @memberof Y
   */
  type?: any;

  /**
   * Additional Options
   *
   * @type {({
   *         toConstant?: boolean,
   *         scope?: 'inRequestScope' | 'inSingletonScope' | 'inTransientScope'
   *     })}
   * @memberof Y
   */
  options?: {
    toConstant?: boolean;
    scope?: "inRequestScope" | "inSingletonScope" | "inTransientScope";
    addition?: {
      name: "whenTargetTagged" | "whenTargetNamed" | "onActivation";
      args: any[];
    };
    factoryCallback?: (context: interfaces.Context) => (...args) => T;
  };

  /**
   * Name of the Element.
   *
   * @type {string}
   * @memberof IDescriptor
   */
  name: string;
}

export interface IClassDescription {
  /**
   * Descriptor of the class
   */
  description: IClassDescriptor;
  /**
   * Settings used for the creator.
   */
  settings: {
    /**
     * You can prevent creating instances.
     * Defaults to `true`
     */
    allowInstanceGeneration?: boolean;
    /**
     * Max amount, of instances, that are allowed to
     * be created by the local dispatcher. (This is only
     * used for hosting.)
     */
    maxAmountOfInstance?: number;
  };
  /**
   * UI Related Methods.
   */
  ui?: {
    /**
     * Creates a a custom function used for rendering the creator function.
     * This wont be used if a `creatorSchema` is provided.
     */
    creator?: TInstanceManagerPage;
    /**
     * Helper to simply creation of a creator interface. Uses the the schema
     * to create the ui.
     */
    creatorSchema?: {
      /**
       * Schema for the init method.
       */
      schema: IJsonSchema;
      /**
       * Function used sort the inputs given by the schema.
       * @param item
       * @returns
       */
      order: (item: { [index: string]: any }) => any[];
    };
    /**
     * Specialized config view.
     */
    config?: TRenderInstancePage;

    /**
     * Helper to get the Icon, it must be available under
     * 'assets/icons/{icon}.png'. Just enter the **name**
     *
     */
    icon?: string;
  };
}

/**
 * Element used to define a nopePackages.
 * A Package can be loaded automatically.
 *
 * @export
 * @interface IPackageDescription
 * @template T
 */
export interface IPackageDescription<
  T extends { [index: string]: symbol | string }
> {
  /**
   * Element containing the classes of the module.
   *
   * @type {Array<IClassDescriptor>}
   * @memberof IPackageDescription
   */
  providedClasses: Array<IClassDescription>;

  /**
   * Element containing functions of the module.
   *
   * @memberof IPackageDescription
   */
  providedServices: Array<{
    service: (...args) => IValidPromise<any>;
    options: IServiceOptions;
  }>;

  /**
   * List of Defaultly created Instances. (This can be adapted by the Programmer via the config.)
   *
   * @type {string[]}
   * @memberof IPackageDescription
   */
  defaultInstances: {
    options: Partial<IInstanceCreationMsg>;
    selector: symbol | string;
  }[];

  /**
   * Name of the Module.
   *
   * @type {string}
   * @memberof IPackageDescription
   */
  nameOfPackage: string;

  /**
   * Requried Assemblies.
   *
   * @type {string[]}
   * @memberof IPackageDescription
   */
  requiredPackages: string[];

  /**
   * An autostart Element.
   *
   * @type {{
   *         // The Id of the Element.
   *         [index: string]: Array<{
   *             delay: number,
   *             params: Array<any>
   *         }>
   *     }}
   * @memberof IPackageDescription
   */
  autostart: {
    // The name of the Element.
    [index: string]: Array<{
      // Name of the Service
      service: string;
      // The Delay, after which the Function should be called
      delay?: number;
      // The Paramters
      params: Array<any>;
    }>;
  };

  /**
   * Element containing the Type-Identifiers
   *
   * @type {T}
   * @memberof IPackageDescription
   */
  types: T;

  /**
   * For Compatibility. The activation handlers are loaded after
   * an instance has been created.
   *
   * @memberof IPackageDescription
   */
  activationHandlers: Array<INopeActivationHanlder>;
}

export type INopeActivationHanlder = (
  _context: interfaces.Context,
  _instance: any
) => any;
