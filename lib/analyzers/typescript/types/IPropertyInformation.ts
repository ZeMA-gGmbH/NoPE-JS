/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:21:36
 * @modify date 2020-11-05 15:41:34
 * @desc [description]
 */

import { PropertyDeclaration } from "ts-morph";
import { IDecoratorInformation } from "./IDecoratorInformation";
import { IModifierInformation } from "./IModifierInformation";
import { ITypeInformation } from "./ITypeInformation";

export interface IPropertyInformation
  extends IDecoratorInformation,
    IModifierInformation,
    ITypeInformation {
  /** Name of the Property */
  name: string;

  /** Declaration of the Property */
  declaration: PropertyDeclaration;
}
