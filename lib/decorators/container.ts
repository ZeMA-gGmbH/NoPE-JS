/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { getSingleton } from "../helpers/singletonMethod";
import { IServiceOptions, INopeModule } from "../types";

export type IexportAsNopeServiceParameters = IServiceOptions;

/**
 * Return the central loger. This logger is a singleton (see {@link getSingleton})
 *
 * @author M.Karkowski
 * @export
 * @return {NopeLogger} A Returns the Logger {@link NopeLogger}
 */
export function getCentralDecoratedContainer(): {
  services: Map<
    string,
    {
      uri: string;
      callback: (...args) => Promise<any>;
      options: IexportAsNopeServiceParameters;
    }
  >;
  classes: Map<string, INopeModule>;
} {
  const container = getSingleton("nope.decorated.elements", () => {
    return {
      services: new Map(),
      classes: new Map(),
    };
  });

  return container.instance;
}
