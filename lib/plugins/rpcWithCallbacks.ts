import { plugin } from "./plugin";
import { NopeRpcManager as OrgNopeRpcManager } from "../dispatcher/RpcManager";
import { NopeConnectivityManager as OrgConnectivityManager } from "../dispatcher/ConnectivityManager";
import {
  IExtraData,
  INopePromise,
  INopeRpcManager,
  INopeStatusInfo,
  IRequestRpcMsg,
  IRpcResponseMsg,
  toConstructor,
  ValidCallOptions,
} from "../types";
import { generateId } from "../helpers/index.browser";
import { DEBUG } from "../logger/index.browser";
import { NopePromise } from "../promise";

export interface ValidCallOptionsWithFunction extends ValidCallOptions {
  callbackOptions?: ({
    idx: number;
    timeToLifeAfterCall: number;
    calledOnce: boolean;
  } & Omit<ValidCallOptionsWithFunction, "calledOnce">)[];
  timeToLifeAfterCall?: number;
  calledOnce?: number[];
}

export interface INopeRpcManagerWithCallback extends INopeRpcManager {
  performCall<T>(
    serviceName: string | string[],
    params: unknown[],
    options?: ValidCallOptionsWithFunction | ValidCallOptionsWithFunction[]
  ): INopePromise<T>;

  /**
   * Flag to keep callbacks open. Defaults to 1 Hour.
   * The Value is given in *ms*
   */
  defaultKeepAlive: number;
}

export const extend = plugin(
  [
    "dispatcher.rpcManager.NopeRpcManager",
    "dispatcher.connectivityManager.NopeConnectivityManager",
  ],
  (
    clNopeRpcManager: toConstructor<OrgNopeRpcManager>,
    clConnectivityManager: toConstructor<OrgConnectivityManager>
  ) => {
    interface IRequestMsgWithCallbacks extends IRequestRpcMsg, IExtraData {
      callbacks: ({
        id: string;
        idx: number;
      } & ValidCallOptionsWithFunction)[];
    }

    class NopeRpcManager
      extends clNopeRpcManager
      implements INopeRpcManagerWithCallback
    {
      /**
       * Flag to keep callbacks open. Defaults to 1 Hour.
       * The Value is given in *ms*
       */
      public defaultKeepAlive: number = 60 * 60 * 1000;

      protected _performCall<T>(
        serviceName: string,
        params: any[],
        options: Partial<ValidCallOptionsWithFunction> = {}
      ): INopePromise<T> {
        // Get a Call Id
        const _taskId = generateId();
        const _this = this;

        const _options = {
          resultSink: this._getServiceName(serviceName, "response"),
          callbackOptions: [],
          timeToLifeAfterCall: this.defaultKeepAlive, // 1 Hour
          calledOnce: [],
          ...options,
        } as ValidCallOptionsWithFunction;

        const _registeredCallbacks: Array<string> = [];

        const clear = () => {
          // Remove the task:
          if (_this._runningInternalRequestedTasks.has(_taskId)) {
            if (_this._logger?.enabledFor(DEBUG)) {
              _this._logger.debug(`Clearing Callbacks from ${_taskId}`);
            }
            // Delete all Callbacks.
            _registeredCallbacks.map((id) => _this.unregisterService(id));

            const task = _this._runningInternalRequestedTasks.get(_taskId);

            // Remove the Timeout.
            if (task.timeout) {
              clearTimeout(task.timeout);
            }

            // Remove the Task itself
            _this._runningInternalRequestedTasks.delete(_taskId);
          }
        };

        if (_this._logger?.enabledFor(DEBUG)) {
          _this._logger.debug(
            `Dispatcher "${this._id}" requesting externally Function "${serviceName}" with task: "${_taskId}"`
          );
        }

        // Define a Callback-Function, which will expect the Task.
        const ret = new NopePromise<T>(async (resolve, reject) => {
          try {
            const taskRequest: {
              resolve: (value: any) => void;
              reject: (error: any) => void;
              clear: () => void;
              serviceName: string;
              timeout?: any;
              target: string;
            } = {
              resolve,
              reject,
              clear,
              serviceName,
              timeout: null,
              target: null,
            };

            // Register the Handlers,
            _this._runningInternalRequestedTasks.set(_taskId, taskRequest);

            // Define a Task-Request
            const packet: IRequestMsgWithCallbacks = {
              functionId: serviceName,
              params: [],
              taskId: _taskId,
              resultSink: _options.resultSink,
              requestedBy: _this._id,
              callbacks: [],
            };

            // Assign the callbackoptions.
            const callbackOptions: {
              [
                index: number
              ]: ValidCallOptionsWithFunction["callbackOptions"][0];
            } = {};
            for (const item of _options.callbackOptions) {
              callbackOptions[item.idx] = item;
            }

            // Iterate over all Parameters and
            // Determin Callbacks. Based on the Parameter-
            // Type assign it either to packet.params (
            // for parsable Parameters) and packet.callbacks
            // (for callback Parameters)
            for (const [idx, contentOfParameter] of params.entries()) {
              // Test if the parameter is a Function
              if (typeof contentOfParameter !== "function") {
                packet.params.push({
                  idx,
                  data: contentOfParameter,
                });
              } else {
                let timeToLifeAfterCall: number =
                  callbackOptions[idx]?.timeToLifeAfterCall;
                timeToLifeAfterCall =
                  typeof timeToLifeAfterCall === "number"
                    ? timeToLifeAfterCall
                    : _options.timeToLifeAfterCall;

                let calledOnce: boolean = callbackOptions[idx]?.calledOnce;
                calledOnce =
                  typeof calledOnce === "boolean"
                    ? calledOnce
                    : _options.calledOnce.includes(idx);

                let id: string = "";
                let timeout: any = null;

                const removeCallback = () => {
                  this.unregisterService(id).catch((e) => {
                    this._logger.error(
                      "Failed to unregister a dynamic callback"
                    );
                    this._logger.error(e);
                  });
                };
                let cb = async (...args) => {
                  if (timeout) {
                    clearTimeout(timeout);
                  }
                  if (timeToLifeAfterCall > 0) {
                    timeout = setTimeout(removeCallback, timeToLifeAfterCall);
                  }
                  return await contentOfParameter(...args);
                };

                if (calledOnce) {
                  cb = async (...args) => {
                    const res = await contentOfParameter(...args);
                    await this.unregisterService(id);
                    return res;
                  };
                } else if (timeToLifeAfterCall) {
                  timeout = setTimeout(removeCallback, timeToLifeAfterCall);
                }

                // The Parameter is a Callback => store a
                // Description of the Callback and register
                // the callback inside of the Dispatcher
                const _func = await _this.registerService(cb, {
                  schema: {},
                  id: generateId({ prestring: "callback" }),
                });

                id = _func["id"];

                _registeredCallbacks.push(id);

                // Register the Callback
                packet.callbacks.push({
                  id,
                  idx,
                });
              }
            }

            if (!_this.serviceExists(serviceName)) {
              // Create an Error:
              const error = new Error(
                `No Service Provider known for "${serviceName}"`
              );

              if (_this._logger) {
                _this._logger.error(
                  `No Service Provider known for "${serviceName}"`
                );
                _this._logger.error(error);
              }

              throw error;
            }

            if (
              _this.options.forceUsingSelectors ||
              this.services.amountOf.get(serviceName) > 1
            ) {
              if (typeof options.target !== "string") {
                taskRequest.target = options.target;
              } else if (typeof options?.selector === "function") {
                const dispatcherToUse = await options.selector({
                  rpcManager: this,
                  serviceName,
                });

                // Assign the Selector:
                taskRequest.target = dispatcherToUse;
              } else {
                const dispatcherToUse = await this._defaultSelector({
                  rpcManager: this,
                  serviceName,
                });

                // Assign the Selector:
                taskRequest.target = dispatcherToUse;
              }

              packet.target = taskRequest.target;
            } else {
              taskRequest.target = Array.from(
                this.services.keyMappingReverse.get(serviceName)
              )[0];
            }

            // Send the Message to the specific element:
            await _this._communicator.emit("rpcRequest", packet);

            if (_this._logger?.enabledFor(DEBUG)) {
              _this._logger.debug(
                `Dispatcher "${
                  this._id
                }" putting task "${_taskId}" on: "${_this._getServiceName(
                  packet.functionId,
                  "request"
                )}"`
              );
            }

            // If there is a timeout =>
            if (options.timeout > 0) {
              taskRequest.timeout = setTimeout(() => {
                _this.cancelTask(
                  _taskId,
                  new Error(
                    `TIMEOUT. The Service allowed execution time of ${options.timeout.toString()}[ms] has been excided`
                  ),
                  false
                );
              }, options.timeout);
            }
          } catch (e) {
            // Clear all Elements of the Function:
            clear();

            // Throw the error.
            reject(e);
          }
        });

        ret.taskId = _taskId;
        ret.cancel = (reason) => {
          _this.cancelTask(_taskId, reason);
        };

        return ret;
      }

      protected async _handleExternalRequest(
        data: IRequestMsgWithCallbacks,
        _function: (...args) => Promise<any> = null
      ): Promise<void> {
        try {
          // Try to get the function if not provided:
          if (typeof _function !== "function") {
            _function = this._registeredServices.get(data.functionId)?.func;
          }

          if (this._logger?.enabledFor(DEBUG)) {
            // If there is a Logger:
            this._logger.debug(
              `Dispatcher "${this._id}" received request: "${data.functionId}" -> task: "${data.taskId}"`
            );
          }

          const _this = this;

          if (typeof _function === "function") {
            // Now we check, if we have to perform test, whether
            // we are allowed to execute the task:
            if (data.target && data.target !== this._id) {
              return;
            }

            // Callbacks
            // Callbacks
            const cbs: Array<(reason) => void> = [];

            const observer = _this.onCancelTask.subscribe((cancelEvent) => {
              if (cancelEvent.taskId == data.taskId) {
                // Call Every Callback.
                cbs.map((cb) => {
                  return cb(cancelEvent.reason);
                });

                // Although we are allowed to Cancel the Subscription
                observer.unsubscribe();
              }
            });

            // Only if the Function is present extract the arguments etc.
            const args = [];

            // First extract the basic arguments
            data.params.map((item) => (args[item.idx] = item.data));

            // Add the Callbacks. Therefore create a function which will
            // trigger the remote.
            data.callbacks.map(
              (optionsOfCallback) =>
                (args[optionsOfCallback.idx] = async (..._args) => {
                  // And Create the Task and its Promise.
                  const servicePromise = _this.performCall<any>(
                    optionsOfCallback.id,
                    _args,
                    optionsOfCallback
                  );

                  const cancelCallback = (reason) => {
                    // The Main Task has been canceled =>
                    // We are allowed to canel the Subtask as well.
                    servicePromise.cancel(reason);
                    // this.cancelTask()
                  };

                  cbs.push(cancelCallback);

                  // Await the Result. If an Task is canceled => The Error is Thrown.
                  const result = await servicePromise;

                  // Remove the Index
                  cbs.splice(cbs.indexOf(cancelCallback), 1);

                  return result;
                })
            );
            // Perform the Task it self.
            const _resultPromise = _function(...args);

            if (
              typeof (_resultPromise as INopePromise<any>)?.cancel ===
              "function"
            ) {
              // Push the Callback to the Result.
              cbs.push((reason) => {
                return (_resultPromise as INopePromise<any>).cancel(reason);
              });
            }

            // Store, who has requested the task.
            _this._runningExternalRequestedTasks.set(
              data.taskId,
              data.requestedBy
            );

            let _result: any = null;

            try {
              // Wait for the Result to finish.
              _result = await _resultPromise;
              // Unsubscribe from Task-Cancelation
              observer.unsubscribe();
            } catch (error) {
              // Unsubscribe from Task-Cancelation
              observer.unsubscribe();

              // Now throw the Error again.
              throw error;
            }

            // Define the Result message
            const result: IRpcResponseMsg = {
              result: typeof _result !== "undefined" ? _result : null,
              taskId: data.taskId,
              sink: data.resultSink,
            };

            // Use the communicator to publish the result.
            await this._communicator.emit("rpcResponse", result);
          }
        } catch (error) {
          if (this._logger) {
            // If there is a Logger:
            this._logger.error(
              `Dispatcher "${this._id}" failed with request: "${data.taskId}"`
            );
            this._logger.error(error);
          }

          // Remove the requested task.
          this._runningExternalRequestedTasks.delete(data.taskId);

          // An Error occourd => Forward the Error.
          const result: IRpcResponseMsg = {
            error: {
              error,
              msg: error.toString(),
            },
            taskId: data.taskId,
          };

          // Send the Error via the communicator to the remote.
          await this._communicator.emit("rpcResponse", result);
        }
      }
    }

    class NopeConnectivityManager extends clConnectivityManager {
      /**
       * Add our Plugin to the Status Message.
       * @returns We now enlist our Plugin.
       */
      protected _info(): INopeStatusInfo {
        const ret = super._info();
        ret.plugins.push("rpcCallbacks");

        return ret;
      }
    }

    return [
      {
        adapted: NopeRpcManager,
        name: "NopeRpcManager",
        path: "dispatcher.rpcManager.NopeRpcManager",
      },
      {
        adapted: NopeConnectivityManager,
        name: "NopeConnectivityManager",
        path: "dispatcher.connectivityManager.NopeConnectivityManager",
      },
    ];
  },
  "rpcCallbacks"
);
