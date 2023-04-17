/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { Container, injectable, interfaces } from "inversify";
import { flatten, isArguments } from "lodash";
import "reflect-metadata";
import {
  getCentralDecoratedContainer,
  IexportAsNopeServiceParameters,
} from "../decorators";
import { arraysEqual } from "../helpers/arrayMethods";
import { sleep } from "../helpers/async";
import { RUNNINGINNODE } from "../helpers/runtimeMethods";
import { getNopeLogger } from "../logger/getLogger";
import { DISPATCHER_INSTANCE } from "../symbols/identifiers";
import { INopeDispatcher } from "../types/nope/nopeDispatcher.interface";
import { INopeModule } from "../types/nope/nopeModule.interface";
import {
  IClassDescriptor,
  INopeActivationHanlder,
  IPackageDescription,
} from "../types/nope/nopePackage.interface";
import { INopePackageLoader } from "../types/nope/nopePackageLoader.interface";

/**
 * Helper Class to Build an inversify Container.
 *
 * @export
 * @class NopePackageLoader
 * @implements {INopePackageLoader}
 */
@injectable()
export class NopePackageLoader implements INopePackageLoader {
  /**
   * Array containing multipl Activation Handlers
   *
   * @protected
   * @memberof NopePackageLoader
   */
  protected _actionHandlers = new Map<string, INopeActivationHanlder>();
  public _logger = getNopeLogger("package-loader", "debug");

  public get activationHandlers() {
    return Array.from(this._actionHandlers.values());
  }

  /**
   * Adds an Activation Handler. (Those are called, after an Object has been created)
   *
   * @param {(context: interfaces.Context, element: any) => any} func The Corresponding Method which will be called.
   * @memberof NopePackageLoader
   */
  public async addActivationHandler(
    func: INopeActivationHanlder | Array<INopeActivationHanlder>
  ): Promise<void> {
    if (!Array.isArray(func)) {
      func = [func];
    }

    for (const _func of func) {
      const _name = _func.name;

      if (!this._actionHandlers.has(_name))
        this._actionHandlers.set(_name, _func);
      else {
        this._logger.warn("Trying to Add Activation Handler twice!");
      }
    }
  }

  private _dispatcher: INopeDispatcher = null;
  public get dispatcher(): INopeDispatcher {
    // Define a Lazy - Getter for an Modul:
    if (this._dispatcher === null) {
      this._dispatcher = this.container.get(DISPATCHER_INSTANCE);
    }

    return this._dispatcher;
  }

  /**
   * Adds the Container to the given Container.
   *
   * @param {Container} container the Container, that should be merged
   * @memberof NopePackageLoader
   */
  public addContainers(container: Container): void {
    this.container = Container.merge(this.container, container) as Container;
  }

  /**
   * Function which will perform all Activation Handlers.
   *
   * @protected
   * @param {interfaces.Context} _context
   * @param {*} _element
   * @returns
   * @memberof NopePackageLoader
   */
  protected _onActivation(_context: interfaces.Context, _element: any): any {
    // Perform the Handlers on the Object
    for (const _handler of this._actionHandlers.values()) {
      _element = _handler(_context, _element);
    }
    return _element;
  }

  public availableElements: IClassDescriptor[];

  protected _compareElements(
    _a: IClassDescriptor,
    _b: IClassDescriptor
  ): boolean {
    if (
      _a.options &&
      _a.options.addition &&
      _b.options &&
      _b.options.addition
    ) {
      return (
        _b.options.addition.name === _a.options.addition.name &&
        arraysEqual(_b.options.addition.args, _a.options.addition.args)
      );
    }
    return true;
  }

  /**
   * Internal Method to Test, whether an Element exists or not.
   *
   * @protected
   * @param {IClassDescriptor} _item
   * @return {*}  {boolean}
   * @memberof NopePackageLoader
   */
  protected _hasElement(_item: IClassDescriptor): boolean {
    for (const _element of this.availableElements) {
      try {
        if (Array.isArray(_element.selector)) {
          if (
            arraysEqual(
              _element.selector,
              Array.isArray(_item.selector) ? _item.selector : [_item.selector]
            ) &&
            this._compareElements(_element, _item)
          ) {
            return true;
          }
        } else if (
          !Array.isArray(_item.selector) &&
          _element.selector === _item.selector &&
          this._compareElements(_element, _item)
        ) {
          return true;
        } else if (
          _item.factorySelector &&
          _item.factorySelector === _element.factorySelector &&
          this._compareElements(_element, _item)
        ) {
          return true;
        }
      } catch (e) {
        this._logger.error(
          e,
          "Error During Check",
          _item.factorySelector,
          _element.factorySelector
        );
      }
    }

    return false;
  }

  /**
   * Method to add an Element to the Build
   *
   * @param {IClassDescriptor[]} _elements Definition containing the Elements that should be added
   * @memberof NopePackageLoader
   */
  public async addDescription(
    _elements: IClassDescriptor[],
    _instance: NopePackageLoader | null = null
  ): Promise<void> {
    if (_instance === null) {
      for (const _element of _elements) {
        if (!this._hasElement(_element)) {
          this.availableElements.push(_element);
          this._addElement(_element);
        } else {
          this._logger.warn("Using the Same Selector / Factory of", _element);
          if (RUNNINGINNODE) {
            this.availableElements.push(_element);
            this._addElement(_element);
          }
        }
      }
    } else {
      for (const _element of _elements) {
        if (!this._hasElement(_element)) {
          this.availableElements.push(_element);
          this._linkExternalBuilder(_element, _instance);
        } else {
          this._logger.warn("Using the Same Selector / Factory of", _element);
        }
      }
    }
  }

  /**
   * Internal Helper Function to Merge an external Builder for creating Tasks.
   *
   * @protected
   * @param {IClassDescriptor} _element
   * @param {NopePackageLoader} _instance
   * @memberof NopePackageLoader
   */
  protected _linkExternalBuilder(
    _element: IClassDescriptor,
    _instance: NopePackageLoader
  ): void {
    // Bind Factory
    if (!Array.isArray(_element.selector)) {
      _element.selector = [_element.selector] as Array<symbol | string>;
    }

    if (_element.factorySelector && !Array.isArray(_element.factorySelector)) {
      _element.factorySelector = [_element.factorySelector] as Array<
        symbol | string
      >;
    }

    // Add al instances.
    for (const _selector of _element.selector as
      | Array<symbol>
      | Array<string>) {
      this.container.bind(_selector).toDynamicValue(() => {
        return _instance.container.get(_selector);
      });
    }

    for (const _selector of _element.factorySelector as
      | Array<symbol>
      | Array<string>) {
      this.container.bind(_selector).toDynamicValue(() => {
        return _instance.container.get(_selector);
      });
    }
  }

  /**
   * Internal Funcitont to add an Description.
   *
   * @protected
   * @param {IClassDescriptor} _element
   * @memberof NopePackageLoader
   */
  protected _addElement(_element: IClassDescriptor): void {
    if (_element) {
      const _this = this;

      const _dict = {
        whenTargetTagged: "getTagged",
        whenTargetNamed: "getNamed",
      };

      // Define Option if required
      // And use the line below to update them and
      // put them into the correct format.

      if (!_element.options) {
        _element.options = {};
      }

      if (_element.selector) {
        if (!Array.isArray(_element.selector)) {
          _element.selector = [_element.selector];
        }
      } else {
        _element.selector = [];
      }

      if (
        _element.factorySelector &&
        !Array.isArray(_element.factorySelector)
      ) {
        _element.factorySelector = [_element.factorySelector];
      }

      // Select the Method
      const _method = _element.options.toConstant ? "toConstantValue" : "to";

      // Check if a specific Scope is given
      if (_element.options.scope != undefined) {
        // A specified Scope for Inversify is given
        if (_element.options.addition) {
          // Add all instances.
          for (const [_index, _selector] of (
            _element.selector as Array<symbol | string>
          ).entries()) {
            // Firstly bind to the First Selector
            if (_index === 0) {
              this._logger.debug("adding selector", _selector.toString());
              this.container
                .bind(_selector)
                [_method](_element.type)
                [_element.options.scope]()
                [_element.options.addition.name](
                  ..._element.options.addition.args
                )
                .onActivation((_context, _element) => {
                  return _this._onActivation(_context, _element);
                });
            } else {
              this._logger.debug("adding selector", _selector.toString());
              // Afterwards redirect to the Se
              this.container.bind(_selector).toDynamicValue((context) => {
                // Create the First Element and return it.
                return context.container[_dict[_element.options.addition.name]](
                  (_element.selector as Array<symbol | string>)[0],
                  ..._element.options.addition.args
                );
              });
            }
          }
        } else {
          // Add all instances.
          for (const [_index, _selector] of (
            _element.selector as Array<symbol | string>
          ).entries()) {
            // Firstly bind to the First Selector
            if (_index === 0) {
              this._logger.debug("adding selector", _selector.toString());
              this.container
                .bind(_selector)
                [_method](_element.type)
                [_element.options.scope as string]()
                .onActivation((_context, _element) => {
                  return _this._onActivation(_context, _element);
                });
            } else {
              this._logger.debug("adding selector", _selector.toString());
              // Afterwards redirect to the Get the Element with the First Tag.
              this.container.bind(_selector).toDynamicValue((context) => {
                // Create the First Element and return it.
                return context.container.get(
                  (_element.selector as Array<symbol | string>)[0]
                );
              });
            }
          }
        }
      } else {
        // No Scope is given
        if (_element.options.addition) {
          // Add all instances.
          for (const [_index, _selector] of (
            _element.selector as Array<symbol | string>
          ).entries()) {
            // Firstly bind to the First Selector
            if (_index === 0) {
              this._logger.debug("adding selector", _selector.toString());
              this.container
                .bind(_selector)
                [_method](_element.type)
                [_element.options.addition.name as string](
                  ..._element.options.addition.args
                )
                .onActivation((_context, _element) => {
                  return _this._onActivation(_context, _element);
                });
            } else {
              this._logger.debug("adding selector", _selector.toString());
              // Afterwards redirect to the Se
              this.container.bind(_selector).toDynamicValue((context) => {
                // Create the First Element and return it.
                return context.container[_dict[_element.options.addition.name]](
                  (_element.selector as Array<symbol | string>)[0],
                  ..._element.options.addition.args
                );
              });
            }
          }
        } else {
          // Add all instances.
          for (const [_index, _selector] of (
            _element.selector as Array<symbol | string>
          ).entries()) {
            // Firstly bind to the First Selector
            if (_index === 0) {
              this._logger.debug("adding selector", _selector.toString());
              this.container
                .bind(_selector)
                [_method](_element.type)
                .onActivation((_context, _element) => {
                  return _this._onActivation(_context, _element);
                });
            } else {
              this._logger.debug("adding selector", _selector.toString());
              // Afterwards redirect to the Get the Element with the First Tag.
              this.container.bind(_selector).toDynamicValue((context) => {
                // Create the First Element and return it.
                return context.container.get(
                  (_element.selector as Array<symbol | string>)[0]
                );
              });
            }
          }
        }
      }

      // Add the Factory if neccessary
      if (_element.factorySelector) {
        // Generate a Dict for converting the Instanciation Values to the Factory Methods.
        if (_element.options.factoryCallback) {
          if (_element.options.addition) {
            if (Array.isArray(_element.options.addition)) {
              // TODO
            } else {
              const firstArg = _element.options.addition.args[0];
              const secondArg = _element.options.addition.args[1];

              for (const _selector of _element.factorySelector as Array<
                symbol | string
              >) {
                this.container
                  .bind(_selector)
                  .toFactory(_element.options.factoryCallback)
                  [_element.options.addition.name](firstArg, secondArg);
              }
            }
          } else {
            for (const _selector of _element.factorySelector as Array<
              symbol | string
            >) {
              console.log(_selector, _element);
              this.container
                .bind(_selector)
                .toFactory(_element.options.factoryCallback);
            }
          }
        } else {
          if (_element.options.addition) {
            if (Array.isArray(_element.options.addition)) {
              // TODO
            } else {
              const firstArg = _element.options.addition.args[0];
              const secondArg = _element.options.addition.args[1];

              for (const _selector of _element.factorySelector as Array<
                symbol | string
              >) {
                this.container
                  .bind(_selector)
                  .toFactory((context: interfaces.Context) => {
                    return () => {
                      // Call get function on the Container
                      return context.container[
                        _dict[_element.options.addition.name]
                      ](
                        // Return the First Element
                        (_element.selector as Array<symbol | string>)[0],
                        ..._element.options.addition.args
                      );
                    };
                  })
                  [_element.options.addition.name](firstArg, secondArg);
              }
            }
          } else {
            for (const _selector of _element.factorySelector as Array<
              symbol | string
            >) {
              this.container
                .bind(_selector)
                .toFactory((context: interfaces.Context) => {
                  return () => {
                    return context.container.get(
                      (_element.selector as Array<symbol | string>)[0]
                    );
                  };
                });
            }
          }
        }
      }
    }
  }

  /**
   * The Inversify-Container see https://github.com/inversify/InversifyJS
   *
   * @type {Container}
   * @memberof NopePackageLoader
   */
  public container: Container;

  public async reset(): Promise<void> {
    // Generate the container
    this.container = new Container();

    const _globalConfig: any = {};

    this.container.bind("global.config").toConstantValue(_globalConfig);

    this.availableElements = new Array<IClassDescriptor>();
  }

  constructor() {
    this.reset();
  }

  public packages: { [index: string]: IPackageDescription<any> } = {};

  protected _instances = new Map<string | symbol, number>();

  /**
   * Loader Function. This function will register all provided functions,
   * create the desired instances. Additionally it will add all descriptors.
   *
   * @param {IPackageDescription<any>} element
   * @memberof NopePackageLoader
   */
  async addPackage(element: IPackageDescription<any>): Promise<void> {
    if (this.packages[element.nameOfPackage] !== undefined) {
      throw Error(
        'Already loaded a Package with the name "' +
          element.nameOfPackage +
          '" !'
      );
    }

    this._logger.info("loading package " + element.nameOfPackage);

    // Store the Package
    this.packages[element.nameOfPackage] = element;

    // Firstly add all Descriptors:
    await this.addDescription(
      element.providedClasses.map((item) => {
        return item.description;
      })
    );
    // Load the Activation Handlers:
    await this.addActivationHandler(element.activationHandlers);

    const _this = this;
    // Based on the provided settings register a generator Function for the Instances:
    for (const cl of element.providedClasses) {
      // Based on the Defintion extract the corresponding selector:
      let selector: string | symbol = null;
      let factory = false;
      if (cl.description.factorySelector) {
        // Firstly try to use a Factory Selector => new instances are generated instead of only
        // one singleton Object.
        selector = Array.isArray(cl.description.factorySelector)
          ? cl.description.factorySelector[0]
          : cl.description.factorySelector;
        factory = true;
      } else if (cl.description.selector) {
        // Otherwise select the Selector of the Singleton.
        selector = Array.isArray(cl.description.selector)
          ? cl.description.selector[0]
          : cl.description.selector;
      }

      if (selector && cl.settings?.allowInstanceGeneration) {
        this._logger.info(
          "Adding an instance generator for  " + cl.description.name
        );

        // Register an Instance Generator, only if allowed
        await this.dispatcher.instanceManager.registerConstructor(
          cl.description.name,
          async (_, identifier) => {
            const currentAmount = _this._instances.get(selector) || 0;

            if (
              cl.settings.allowInstanceGeneration &&
              currentAmount < (cl.settings.maxAmountOfInstance || Infinity)
            ) {
              // Define the Instance:
              const instance = factory
                ? _this.container.get<() => INopeModule>(selector)()
                : _this.container.get<INopeModule>(selector);
              instance.identifier = identifier;

              // Update the Used Instance
              _this._instances.set(selector, currentAmount + 1);

              // Return the instance.
              return instance;
            }

            throw Error("Not allowed to create instances");
          }
        );
      }
    }

    // Iterate over the provided Functions:
    for (const func of element.providedServices) {
      await this.dispatcher.rpcManager.registerService(
        func.service,
        func.options
      );
    }
  }

  /**
   * Function to initialize all the instances.
   *
   * @param {boolean} [testRequirements=true]
   * @memberof NopePackageLoader
   */
  async generateInstances(testRequirements = true): Promise<void> {
    const _this = this;

    if (this._logger) {
      this._logger.info("Package Loader generates the instances.");
    }

    if (testRequirements) {
      const availablePackages = Object.getOwnPropertyNames(this.packages);

      // First extract all required Packages
      const reuqiredPackages = Array.from(
        new Set(
          flatten(
            availablePackages.map((name) => {
              return _this.packages[name].requiredPackages;
            })
          )
        )
      );

      // Now Check if every Package is present.
      reuqiredPackages.map((_package) => {
        if (!availablePackages.includes(_package)) {
          throw Error("Packages are not known");
        }
      });
    }

    for (const name in this.packages) {
      const definitions = this.packages[name].defaultInstances;
      for (const definition of definitions) {
        if (this._logger?.enabledFor) {
          this._logger.debug(
            'Requesting Generating Instance "' +
              definition.options.identifier +
              '" of type "' +
              definition.options.type +
              '"'
          );
        }

        const instance = await this.dispatcher.instanceManager.createInstance(
          definition.options
        );

        if (this._logger) {
          this._logger.info(
            'Sucessfully Generated the Instance "' +
              definition.options.identifier +
              '" of type "' +
              definition.options.type +
              '"'
          );
        }

        // Store the Function, that the instance will be disposed on leaving.
        this._disposeDefaultInstance.push(() => {
          return instance.dispose();
        });

        if (definition.options.identifier in this.packages[name].autostart) {
          // There are autostart Tasks in the Package for the considered Instance,
          // which has been recently defined.
          try {
            const autostart =
              this.packages[name].autostart[definition.options.identifier];
            for (const task of autostart) {
              if (task.delay) {
                await sleep(task.delay);
              }
              await instance[task.service](...task.params);
            }
          } catch (e) {
            this._logger.error(
              "Failed with autostart tasks for " + instance.identifier
            );
            this._logger.error(e);
          }
        } else {
          this._logger.info("No autostart for " + instance.identifier);
        }
      }
    }

    if (this._logger) {
      this._logger.info("generated all defined Instances");
    }
  }

  /**
   * Function to load all decorated elements with the decorators `exportAsNopeService`
   *
   * @param options
   */
  async addDecoratedElements(
    options: {
      addServiceCallback?: (
        options: IexportAsNopeServiceParameters
      ) => Promise<boolean>;
      addClassCallback?: (options: INopeModule) => Promise<boolean>;
      consider?: Array<"services" | "classes">;
    } = {
      consider: ["services"],
    }
  ): Promise<void> {
    const _this = this;

    // Get the container containing all registered Services and Classes.
    const CONTAINER = getCentralDecoratedContainer();

    // Helper to list the Promises.
    const promises = new Array<Promise<any>>();

    if (!Array.isArray(options.consider)) {
      options.consider = [];
    }

    if (typeof options.addServiceCallback === "function") {
      options.consider.push("services");
    }

    if (typeof options.addClassCallback === "function") {
      options.consider.push("classes");
    }

    if (options.consider.includes("services")) {
      for (const serviceDefintion of CONTAINER.services.values()) {
        if (typeof options.addServiceCallback === "function") {
          let resolve = null;
          // Create a Promise, that will be completed, if
          // the function is been added
          const promise = new Promise((_resolve) => (resolve = _resolve));
          promises.push(promise);

          // Now we call the function to decide whether the
          // service should be added or not.
          options
            .addServiceCallback(serviceDefintion.options)
            .then((decision) => {
              if (decision) {
                this.dispatcher.rpcManager.registerService(
                  serviceDefintion.callback,
                  serviceDefintion.options
                );
              }
              resolve(null);
            });
        } else {
          // Just add the Service.
          this.dispatcher.rpcManager.registerService(
            serviceDefintion.callback,
            serviceDefintion.options
          );
        }
      }
    }

    // for (const classDefinition of CONTAINER.classes.values()){
    //   this.dispatcher.rpcManager.registerService(classDefinition.,classDefinition.options)
    // }

    // Wait for all Promises to be added.
    await Promise.all(promises);
  }

  protected _disposeDefaultInstance: Array<() => Promise<void>> = [];

  async dispose(): Promise<void> {
    // Start all dispose Values
    const promises = this._disposeDefaultInstance.map((cb) => {
      return cb();
    });

    // Wait for all to finish!
    await Promise.all(promises);

    this._disposeDefaultInstance = [];
  }
}
