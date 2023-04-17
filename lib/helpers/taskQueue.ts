import { NopePromise } from "../promise";
import { isAsyncFunction } from "./async";
import { PriorityList } from "./lists";

/**
 * A Task-Queue. This could be used to make parallel
 * Request run sequentially. For Instance during
 * Saving and Reading Vars to achive a consistent set
 * of Data.
 *
 * Usage:
 *
 * ```typescript
 *  // Create a Queue
 *  const _queue = new PriorityTaskQueue();
 *  // Create a Function
 *  const _func = (_input: string, _cb) => {
 *      console.log("Hallo ", _input)
 *      _cb(null, null);
 *  }
 *
 * const promises = [
 *  _queue.execute(_func, ['Welt priority=0'],0),
 *  _queue.execute(_func, ['Welt priority=1'],1),
 *  _queue.execute(_func, ['Welt priority=2'],2) *
 * ];
 *
 * // => Hallo Welt priority=0 <- Startet directly.
 * // => Hallo Welt priority=2 <- Startet because it has the highest priority.
 * // => Hallo Welt priority=1
 * ```
 * @export
 * @class TaskQeue
 */
export class ParallelPriorityTaskQueue {
  protected _queue = new PriorityList<{
    func: (...args) => void;
    cancel: () => void;
    args: any;
    resolve: (data) => void;
    reject: (err) => void;
  }>();

  protected _runningTasks = 0;
  protected _counter = 0;

  public maxParallel = 1;
  public usePriority = true;

  /**
   * Executes the given Task. If now Task is running it is executed immediatelly,
   * otherwise it is pushed in the queue and call if the other tasks are call.
   *
   * @param {any} _func The Function which should be called.
   * @param {any} _param The Data which should be used for the call.
   * @param {any} _callback The Callback, which should be called after
   * @memberof TaskQeue
   */
  public execute<T>(
    func: (...args) => T | Promise<T>,
    args: any[],
    priority: number = 0,
    cancel: () => void = () => {}
  ): NopePromise<T> {
    let resolve, reject;

    const promise = new NopePromise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    promise.cancel = cancel;

    // Check whether the Execution is activ:
    if (
      this._runningTasks < this.maxParallel &&
      this._queue.length < this.maxParallel
    ) {
      this._runningTasks++;
      this._execute({
        func,
        args,
        cancel,
        resolve,
        reject,
      });
    } else {
      // Extend the Queue.
      this._queue.push(this.usePriority ? priority : this._counter++, {
        func,
        args,
        cancel,
        resolve,
        reject,
      });
    }

    return promise;
  }

  protected _execute(data: {
    func: (...args) => any | Promise<any>;
    args: any[];
    cancel: () => void;
    resolve: (data) => void;
    reject: (err) => void;
  }) {
    // Verify whether there is an CancelHandler, if yes.
    // Register at the Cancel-Handler. Thereby the next
    // function is call if the currently running Task is
    // aborted.
    if (data.cancel) {
      data.args.push(() => {
        data.cancel();
        data.reject(Error("Canceled"));
        this._finish();
      });
    }
    if (isAsyncFunction(data.func)) {
      (data.func as (...args: any[]) => Promise<any>)(...data.args)
        .then((res) => {
          data.resolve(res);
          this._finish();
        })
        .catch((err) => {
          data.reject(err);
          this._finish();
        });
    } else {
      try {
        const res = (data.func as (...args: any[]) => any)(...data.args);
        data.resolve(res);
      } catch (err) {
        data.reject(err);
      }
      this._finish();
    }
  }

  /**
   * Internal Function to Finish all Tasks.
   *
   * @protected
   * @memberof PriorityTaskQueue
   */
  protected _finish() {
    // Remove one Element.
    this._runningTasks--;

    if (this._runningTasks < 0) {
      this._runningTasks = 0;
    }
    // Remove the First Task
    const task = this._queue.highest();

    // Call the Function with the adapted Callback, if there is a Task Left open.
    if (task) {
      this._execute(task);
    }
  }

  public get length(): number {
    return this._queue.length;
  }
}
