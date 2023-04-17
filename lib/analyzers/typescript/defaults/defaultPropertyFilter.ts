/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 11:02:48
 * @modify date 2020-11-05 11:10:16
 * @desc [description]
 */

import { ClassDeclaration } from "ts-morph";
import { isPropOfType } from "../helpers/isPropOfType";
import { IDecoratorInformation } from "../types/IDecoratorInformation";
import { IImportMapping } from "../types/IImportMapping";
import { IModifierInformation } from "../types/IModifierInformation";
import { IPropertyFilter } from "../types/IPropertyFilter";
import { IPropertyInformation } from "../types/IPropertyInformation";

/**
 * Default Filter, to Filter Properties
 * @param options The Options to use.
 */
export function defaultPropertyFilter(options: {
  propertyType: string;
  propertyDecorator: string;
}): IPropertyFilter {
  return (
    cl: ClassDeclaration,
    property: IPropertyInformation &
      IDecoratorInformation &
      IModifierInformation,
    importMapping: IImportMapping
  ) => {
    return (
      isPropOfType(property.declaration, options.propertyType, false) &&
      property.isPublic &&
      property.decoratorNames.includes(options.propertyDecorator)
    );
  };
}
