/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-23 08:06:30
 * @modify date 2020-12-02 07:38:10
 * @desc [description]
 */

import { injectable } from "inversify";
import { NopeEventEmitter } from "./nopeEventEmitter";

/**
 * RsJX based Observable.
 *
 * Contains additional Functionalities like:
 *  - property with the current value
 *  - function to publish values. (wrapper for next)
 *  - enables performing a subscription with synced call or a immediate call.
 */
@injectable()
export class InjectableNopeEventEmitter<
  T,
  S = T,
  G = T
> extends NopeEventEmitter<T, S, G> {}
