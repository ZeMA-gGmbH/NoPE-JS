/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { EventEmitter } from "events";
import { getNopeLogger, ILogger, LoggerLevel } from "../index.browser";
import { generateId } from "./idMethods";
import { difference } from "./setMethods";

/**
 * The options for call
 */
export type TLimitedOptions = {
  /**
   * The Id to use. If not provided, an specific id is generated
   */
  functionId: string;

  /**
   * An queue that should be used. If not provided, a queue is used.
   */
  queue: Array<[string, string, any[]]>;

  /**
   * Mapping for the Functions.
   */
  mapping: { [index: string]: (...args) => Promise<any> };

  /**
   * An emitter to use.
   */
  emitter: EventEmitter;

  /**
   * Helper function to request a lock.
   */
  getLock: (functionId: string, newTaskId: string) => boolean;

  /**
   * An additional function, wich can be used between the next function in is called. e.g. sleep.
   */
  callbackBetween?: () => Promise<void>;

  /**
   * Number of elements, which could be called in parallel. 0 = sequntial
   */
  maxParallel: number;

  /**
   * A logger to use.
   */
  loggerLevel: false | LoggerLevel;

  /**
   * An overview with active Tasks. This is relevant for multiple Funtions.
   */
  activeTasks: Set<string>;

  /**
   * An overview with active Tasks. This is relevant for multiple Funtions.
   */
  awaitingTasks: Set<string>;

  /**
   * Helper to assign the control function, for example on an async function.
   */
  assignControlFunction: (
    args: any[],
    functions: {
      pauseTask: () => void;
      continueTask: () => void;
    }
  ) => any[];

  minDelay: number;

  lastDone: number;
};

/**
 * Helper to get the default options in a shared context
 * @param options The options to enhance the defaults.
 * @returns The options.
 */
export function getLimitedOptions(
  options: Partial<TLimitedOptions>
): Partial<TLimitedOptions> {
  const defaultSettings: Partial<TLimitedOptions> = {
    queue: [],
    mapping: {},
    emitter: new EventEmitter(),
    maxParallel: 0,
    loggerLevel: false,
    activeTasks: new Set(),
    awaitingTasks: new Set(),
  };

  return Object.assign(defaultSettings, options);
}

/**
 * Function to limit the calls based on the settings.
 * @param func The function to use. This should be an async function.
 * @param options The Options.
 * @returns
 */
export function limitedCalls<T>(
  func: (...args) => Promise<T>,
  options: Partial<TLimitedOptions>
) {
  let logger: ILogger | false = false;

  // Define the Default-Settings
  const defaultSettins: TLimitedOptions = {
    functionId: Date.now().toString(),
    queue: [],
    mapping: {},
    emitter: new EventEmitter(),
    getLock: () => {
      const tasks = difference(
        settingsToUse.activeTasks,
        settingsToUse.awaitingTasks
      );

      if (logger) {
        logger[settingsToUse.loggerLevel as LoggerLevel](
          `active Tasks: [${Array.from(tasks)}]; awaiting Tasks: [${Array.from(
            settingsToUse.awaitingTasks
          )}];`
        );
      }

      return (
        settingsToUse.maxParallel < 0 || tasks.size <= settingsToUse.maxParallel
      );
    },
    assignControlFunction: (args, opts) => {
      return args;
    },
    maxParallel: 0,
    loggerLevel: false,
    activeTasks: new Set(),
    awaitingTasks: new Set(),
    minDelay: -1,
    lastDone: Date.now(),
  };

  const settingsToUse: TLimitedOptions = Object.assign(defaultSettins, options);
  const functionId = settingsToUse.functionId;

  settingsToUse.mapping[functionId] = func;

  if (settingsToUse.loggerLevel) {
    logger = getNopeLogger("limited-calls", settingsToUse.loggerLevel);
  }

  const wrapped = function (...args) {
    // Generate the Call-ID
    const taskId = generateId();

    const pauseTask = () => {
      if (logger) {
        logger[settingsToUse.loggerLevel as LoggerLevel](
          `pausing taskId="${taskId}".`
        );
      }
      settingsToUse.awaitingTasks.add(taskId);
      settingsToUse.emitter.emit("execute");
    };

    const continueTask = () => {
      if (logger) {
        logger[settingsToUse.loggerLevel as LoggerLevel](
          `continuing taskId="${taskId}".`
        );
      }
      settingsToUse.awaitingTasks.delete(taskId);
      settingsToUse.emitter.emit("execute");
    };

    // Add the functions.
    args = settingsToUse.assignControlFunction(args, {
      pauseTask,
      continueTask,
    });

    // Push the Content to the emitter
    settingsToUse.queue.push([functionId, taskId, args]);

    // lets have an item, that contains the resolve
    let resolve = null;
    let reject = null;

    // Define a callback, which is called.
    const cb = (error, result) => {
      settingsToUse.emitter.off(taskId, cb);

      if (error) {
        reject(error);
      } else {
        resolve(result);
      }

      // Delete the Task
      settingsToUse.activeTasks.delete(taskId);
      settingsToUse.awaitingTasks.delete(taskId);

      if (typeof settingsToUse.callbackBetween === "function") {
        if (logger) {
          logger[settingsToUse.loggerLevel as LoggerLevel](
            `using 'callbackBetween' for taskId="${taskId}". Calling now`
          );
        }

        settingsToUse
          .callbackBetween()
          .then((_) => {
            if (logger) {
              logger[settingsToUse.loggerLevel as LoggerLevel](
                `awaited 'callbackBetween' for taskId="${taskId}". Transmitting results now`
              );
            }

            settingsToUse.lastDone = Date.now();

            // Emit, that there is a new task available
            settingsToUse.emitter.emit("execute");
          })
          .catch((_) => {
            // Log some stuff
            if (logger) {
              logger[settingsToUse.loggerLevel as LoggerLevel](
                `something went wrong with 'callbackBetween' for taskId="${taskId}". Transmitting results now!`
              );
            }

            settingsToUse.lastDone = Date.now();

            // Emit, that there is a new task available
            settingsToUse.emitter.emit("execute");
          });
      } else {
        if (logger) {
          logger[settingsToUse.loggerLevel as LoggerLevel](
            `no 'callbackBetween' for taskId="${taskId}". Transmitting results now`
          );
        }

        settingsToUse.lastDone = Date.now();

        // Emit, that there is a new task available
        settingsToUse.emitter.emit("execute");
      }
    };

    settingsToUse.emitter.on(taskId, cb);

    const promise = new Promise<T>((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    settingsToUse.emitter.emit("execute");

    return promise;
  };

  if (settingsToUse.emitter.listeners("execute").length == 0) {
    const tryExecuteTask = () => {
      if (settingsToUse.queue.length > 0) {
        // Get the Id and the Args.
        const [functionId, taskId, args] = settingsToUse.queue[0];

        if (settingsToUse.getLock(functionId, taskId)) {
          const diff = Date.now() - settingsToUse.lastDone;

          if (settingsToUse.minDelay > 0 && diff < settingsToUse.minDelay) {
            // Recall our routine
            setTimeout(
              tryExecuteTask,
              settingsToUse.minDelay - diff + 10,
              null
            );
            return;
          }

          if (settingsToUse.maxParallel > 0) {
            settingsToUse.lastDone = Date.now();
          }

          // Add the Task as active.
          settingsToUse.activeTasks.add(taskId);

          // Remove the items:
          settingsToUse.queue.splice(0, 1);

          // Try to perform the call.
          try {
            if (logger) {
              logger[settingsToUse.loggerLevel as LoggerLevel](
                `calling function '${functionId}' for the task taskId="${taskId}"`
              );
            }

            settingsToUse.mapping[functionId](...args)
              .then((result) => {
                if (logger) {
                  logger[settingsToUse.loggerLevel as LoggerLevel](
                    `called function '${functionId}' for the task taskId="${taskId}"`
                  );
                }
                settingsToUse.emitter.emit(taskId, null, result);
              })
              .catch((error) => {
                if (logger) {
                  logger[settingsToUse.loggerLevel as LoggerLevel](
                    `called function '${functionId}' for the task taskId="${taskId}", but resulted in an error`
                  );
                }
                settingsToUse.emitter.emit(taskId, error, null);
              });
          } catch (error) {
            settingsToUse.emitter.emit(taskId, error, null);
          }
        }
      }
    };

    settingsToUse.emitter.on("execute", tryExecuteTask);
  }

  return wrapped;
}
