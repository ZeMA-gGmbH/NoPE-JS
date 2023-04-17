/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:17:20
 * @modify date 2020-11-05 12:17:41
 * @desc [description]
 */

import { ClassDeclaration } from "ts-morph";
import { IDecoratorInformation } from "./IDecoratorInformation";
import { IImportMapping } from "./IImportMapping";
import { IModifierInformation } from "./IModifierInformation";
import { IPropertyInformation } from "./IPropertyInformation";

/** Definition of a Filter, to select the relevant properties */
export type IPropertyFilter = (
  /**
   * The Class, on which the docorator is applied
   */
  cl: ClassDeclaration,
  /**
   * The property
   */
  property: IPropertyInformation & IDecoratorInformation & IModifierInformation,
  /**
   * A Mapping of the imported files
   */
  importMapping: IImportMapping
) => boolean;
