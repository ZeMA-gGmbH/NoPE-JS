/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 09:07:28
 * @modify date 2020-11-06 09:09:33
 * @desc [description]
 */

import { INopePromise } from "../types/nope/nopePromise.interface";

/**
 * A Custom Implementation of Nope-Promise.
 * They are cancelable.
 *
 * @export
 * @class NopePromise
 * @extends {Promise<T>}
 * @implements {INopePromise<T>}
 * @template T Type of the Default Promise
 * @template E Type of the Cancelation Data.
 */
export class NopePromise<T, E = any>
  extends Promise<T>
  implements INopePromise<T>
{
  /**
   * Function used to cancel the Element.
   *
   * @param {E} reason
   * @memberof NopePromise
   */
  cancel(reason: E): void {
    throw new Error("Method has to be overwritten");
  }

  /**
   * Attribute holding the Task-ID assinged by a dispatcher.
   *
   * @type {string}
   * @memberof NopePromise
   */
  taskId: string;

  /**
   * Creates an instance of NopePromise.
   * @param {((resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void)} executor
   * @param {(reason: E) => void} [cancel]
   * @param {string} [taskId]
   * @memberof NopePromise
   */
  constructor(
    executor: (
      resolve: (value?: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void
    ) => void,
    cancel?: (reason: E) => void,
    taskId?: string
  ) {
    super(executor);

    if (typeof cancel === "function") {
      this.cancel = cancel;
    }

    if (typeof taskId === "string") {
      this.taskId = taskId;
    }
  }
}
