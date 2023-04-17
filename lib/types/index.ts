/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import * as nope from "./nope/index";
import * as ui from "./ui/index";
export * from "./IJSONSchema";
export * from "./nope/index";
export * from "./ui/index";
export { nope, ui };

export type toConstructor<T> = {
  new (...args): T;
};
