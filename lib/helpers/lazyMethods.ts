/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

/**
 * Sometimes, the creation of an new Instance is very slow. Therefore this Lazy-Constructor could be used.
 * Instead of creating a new Instance, it looks for a not used and returns that Instance. By returning
 * the unused Instance it is marked as used. After the usage the instance could marked as unused again.
 * If there is no unused Instance available an new Instance is created.
 *
 * To utilize the Lazy-Constructor a specific create-instance method and a compare function is required.
 *
 * @export
 * @class LazyConstructor
 * @template T Args which are required to Construct an Instance
 * @template U Type of the Instance
 */
export class LazyConstructor<T> {
  private _inactive = new Set<T>();

  /**
   * Creates an instance of LazyConstructor.
   * @param {*} _ctor
   * @param {(a:T,b:t)=>boolean} _equals
   * @memberof LazyConstructor
   */
  constructor(private _ctor: (...arggs) => T) {}

  /**
   * Creates a new Instance and tries to use an already existing
   * one if possible.
   *
   * @param {T} args An Object containing the args which are required to create an Instance
   * @returns {U} new Object
   * @memberof LazyConstructor
   */
  public createInstance(...args): T {
    /** First Loop check whether there is a math in the Keys*/

    const _instance = this._inactive[Symbol.iterator]().next();

    if (!_instance.done) {
      /** Remove the Instance */
      this._inactive.delete(_instance.value);
      /** Return the Value. */
      return _instance.value;
    }

    return this._ctor(...args);
  }

  /**
   * Releases a used Instance. Thereby it could be
   * used again.
   *
   * @param {U} instance
   * @memberof LazyConstructor
   */
  public releaseInstance(instance: T) {
    this._inactive.add(instance);
  }
}
