/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { injectable } from "inversify";
import { NopeObservable } from "./nopeObservable";

/**
 * RsJX based Observable.
 *
 * Contains additional Functionalities like:
 *  - property with the current value
 *  - function to publish values. (wrapper for next)
 *  - enables performing a subscription with synced call or a immediate call.
 */
@injectable()
export class InjectableNopeObservable<T, S = T, G = T> extends NopeObservable<
  T,
  S,
  G
> {}
