/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:15:04
 * @modify date 2020-11-05 12:15:04
 * @desc [description]
 */

import {
  ClassDeclaration,
  Decorator,
  MethodDeclaration,
  PropertyDeclaration,
} from "ts-morph";

/**
 * Information of the Decorator:
 */
export interface IDecoratorInformation {
  /**
   * Declaration of the Type being decorated
   */
  declaration: MethodDeclaration | PropertyDeclaration | ClassDeclaration;

  /**
   * Names of the Decorators
   */
  decoratorNames: string[];

  /**
   * The Decorators itself
   */
  decorators: Decorator[];

  /**
   * The Settings of the Decorator, which has been prodived by the user.
   */
  decoratorSettings: { [index: string]: { [index: string]: any } };
}
