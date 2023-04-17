/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-05 12:14:55
 * @modify date 2020-11-09 15:54:36
 * @desc [description]
 */

import { IDecoratorInformation } from "./IDecoratorInformation";
import { IMethodInformation } from "./IMethodInformation";
import { IModifierInformation } from "./IModifierInformation";
import { IPropertyInformation } from "./IPropertyInformation";

export interface IClassAnalyzeResult {
  // Name of the Class
  className: string;
  // Decorators of the Class
  classDecorator: IDecoratorInformation;
  // Methods of the Class
  methods: (IMethodInformation &
    IDecoratorInformation &
    IModifierInformation)[];
  // Properties of the Class
  properties: (IPropertyInformation &
    IDecoratorInformation &
    IModifierInformation)[];
  events: (IPropertyInformation &
    IDecoratorInformation &
    IModifierInformation)[];
  // Imports of the Class (contians external Files)
  imports: {
    content: string;
    required: boolean;
  };
}
