/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { inject, injectable } from "inversify";
import { DISPATCHER_INSTANCE } from "../symbols/identifiers";
import { INopeCore } from "../types";
import { NopeBaseModule } from "./BaseModule";

/**
 * Base Implementation of a Module.
 *
 * The Module is used to share information and data. Although it implements the
 * the Basic behavior to fullfill a given traget.
 *
 * @export
 * @class BaseModule
 * @implements {INopeModule}
 */
@injectable()
export class InjectableNopeBaseModule extends NopeBaseModule {
  /**
   * Creates an instance of BaseModule.
   * @memberof InjectableNopeBaseModule
   */
  constructor(@inject(DISPATCHER_INSTANCE) _core: INopeCore) {
    super(_core);
  }
}
