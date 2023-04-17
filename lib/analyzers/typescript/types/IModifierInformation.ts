/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:15:26
 * @modify date 2020-11-06 08:50:49
 * @desc [description]
 */

import { MethodDeclaration, PropertyDeclaration } from "ts-morph";

/**
 * Holds Information about the Modifier of a Property or Method.
 *
 * @export
 * @interface IModifierInformation
 */
export interface IModifierInformation {
  /**
   * The Original declaration of the Element.
   *
   * @type {(MethodDeclaration | PropertyDeclaration)}
   * @memberof IModifierInformation
   */
  declaration: MethodDeclaration | PropertyDeclaration;

  /**
   * Element holding additional modifiers
   *
   * @type {string[]}
   * @memberof IModifierInformation
   */
  modifiers: string[];

  /**
   * Flag, if the Element is Public or not.
   *
   * @type {boolean}
   * @memberof IModifierInformation
   */
  isPublic: boolean;

  /**
   * Flag, if the Element is Private
   *
   * @type {boolean}
   * @memberof IModifierInformation
   */
  isPrivate: boolean;

  /**
   * Flag showing, wehter the item is protected or not.
   *
   * @type {boolean}
   * @memberof IModifierInformation
   */
  isProtected: boolean;

  /**
   * Flag, holding information, whether the
   * attribute is readonly or not
   *
   * @type {boolean}
   * @memberof IModifierInformation
   */
  isReadonly: boolean;
}
