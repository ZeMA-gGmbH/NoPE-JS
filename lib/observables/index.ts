/**
 * @module observables
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 *
 * # Observables
 *
 * ## Usage of `nope.observables`
 *
 * Import Nope.
 *
 * ```typescript
 * import * as nope from "nope";
 * ```
 *
 * In our nodebook, we have to use **javascript** instead of **typescript**:
 *
 * ```javascript
 * // First lets install nope using npm
 * const nope = require("../dist-nodejs/index.nodejs");
 *
 * // Create our Observable:
 * const obs = new nope.observables.NopeObservable();
 * ```
 * ### `setContent`: Change the content of the Observable.
 *
 * To change the content of an observable use the function `setContent`.
 *
 * ```javascript
 * // Set the content to "1337"
 * obs.setContent(5);
 *
 * // Print the content (see getContent)
 * console.log("current value =", obs.getContent());
 * ```
 *
 * > ` current value = 5`
 *
 * #### `setter`: Define a specific setter for the observable.
 *
 * You can specify a specifc getter for the observable for instance, to limit the number to the following constrains `> 0` and `< 10`.
 *
 *
 * The setter function will receive multiple parameters, as listed below:
 *
 * 1. `value`,
 * 2. `options` containing:
 *   - `sender`: The Element, which changed the data
 *   - `timestamp`: The timestamp of the change
 *   - `args`: additional args.
 *
 *
 *
 * The setter function have to return a `dict` with the following keys:
 *
 * | key | type | content |
 * | - | - | - |
 * | `valid` | `bool` | A Flag, to show whether the data are valid or not. If the data is invalid, the observable wont store them |
 * | `value` | `any` | The Data that has been adapted |
 *
 *
 *
 * Below, we will implement an example to show the setter above.
 *
 * ```javascript
 * obs.setter = (value, options) => {
 *   // Print, which data we received
 *   console.log("setter received", value, options);
 *   // Show the result of our comparison
 *   console.log("data is valid:", value > 0 && value < 10);
 *   return {
 *     // The Value
 *     value: value,
 *     // Valid
 *     valid: value > 0 && value < 10,
 *   };
 * };
 *
 * // Set the content to "1337" ==> But our setter will prevent using this value because it isnt valid.
 * obs.setContent(1337);
 *
 * // Print the content (see getContent) ==> we expect to get "5"
 * console.log("current value =", obs.getContent());
 * ```
 *
 * > ```
 * > setter received 1337 {}
 * > data is valid: false
 * > current value = 5
 * > ```
 *
 * To remove such a getter just set the getter property to `null`.
 *
 * ```javascript
 * obs.setter = null;
 *
 * // Set the content to "1337" we do not have any setter ==> we will use this parameter
 * obs.setContent(1337);
 *
 * // Print the content (see getContent) ==> we expect to get "1337"
 * console.log("current value =", obs.getContent());
 * ```
 *
 * > `current value = 1337`
 *
 * ### `getContent`: Get the current content of the Observable.
 *
 *  To extract the content of our observable, we are able to use the function `getContent`
 *
 * ```javascript
 * let content = obs.getContent();
 * console.log("current value =", content);
 * ```
 *
 *  > `current value = 1337`
 *
 *  If no data is assigned, this will result in `undefined`. Otherwise the current data is returned.
 *
 *  #### `getter`: Define a specific getter for the observable.
 *
 *  You can specify a specifc getter for the observable for instance, to allways return a `string`
 *
 * ```javascript
 * // Define a getter
 * obs.getter = (value) => "Allways this result";
 * console.log("current value (with getter) =", obs.getContent());
 * ```
 *
 * > `current value (with getter) = Allways this result`
 *
 *  To remove such a getter just set the getter property to `null`.
 *
 *  The Original value is not changed ==> we expect to get "1337"
 *
 * ```javascript
 * // Reset the getter.
 * obs.getter = null;
 * console.log("current value (after removing the getter) =", obs.getContent());
 * ```
 *
 * > `current value (after removing the getter) = 1337`
 */

export * from "../types/nope/nopeObservable.interface";
export { NopeObservable } from "./nopeObservable";
export { InjectableNopeObservable } from "./nopeObservable.injectable";
