/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

/**
 * Delays some execution. Sleeps the amount of time in **ms**
 * @param delay [ms]
 * @returns void
 */
export function sleep(delay: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delay);
  });
}

/**
 * Tests if a Function is async or not.
 * @param func The function to test.
 * @returns {boolean} The test result.
 */
export function isAsyncFunction(func: (...args) => any): boolean {
  return func.constructor.name === "AsyncFunction";
}

/**
 * Function which will halt the Process until the Testcallback deliveres "true"
 *
 * @export
 * @param {(() => boolean | Promise<boolean>)} testCallback Function which is used to periodically test the State
 * @param {{ testFirst?: boolean; maxRetries?: number, timeout?: number, maxTimeout?: number }} [options={}] Options to enhance the behavior. Look at the details
 * @returns
 */
export function waitFor(
  testCallback: () => boolean | Promise<boolean>,
  options: {
    /**
     * Inital delay, before the test is started.
     */
    initialWait?: number;
    /**
     * Flag to enable testing the call the callback directly before
     * proceeding or just ensure the inital waiting time
     */
    testFirst?: boolean;
    /**
     * Max amount of retries before an execption is raised
     */
    maxRetries?: number;
    /**
     * Delay to wait, after an unsucessfull test.
     */
    delay?: number;
    /**
     * Timeout afterwhich the Test will fail.
     */
    maxTimeout?: number;
    /**
     * A Delay which is added after the Test is fullfilled,
     * before the Promise is done.
     */
    additionalDelay?: number;
  } = {}
): Promise<void> {
  const _options = Object.assign(
    {
      testFirst: true,
      delay: 50,
    },
    options
  );

  const _isAsync = isAsyncFunction(testCallback);

  if (_isAsync) {
    return new Promise<void>(async (resolve, reject) => {
      if (options.initialWait) {
        await sleep(options.initialWait);
      }

      let _resolve: () => void;
      if (_options.additionalDelay) {
        _resolve = () => {
          setTimeout(resolve, _options.additionalDelay);
        };
      } else {
        _resolve = resolve;
      }

      try {
        if (_options.testFirst && (await testCallback())) {
          _resolve();
        } else {
          let retryCounter = 0;

          let timeout: any | null = null;
          let interval: any | null = null;

          // If there is a Timeout, define a Timeout Function, which will
          // Throw an Error on Timeout.
          if (_options.maxTimeout) {
            timeout = setTimeout(async () => {
              if (interval) {
                clearInterval(interval);
              }

              reject(new Error("Wait has been Timeout"));
            }, _options.maxTimeout);
          }

          // Define a Testfunction, which will periodically test whether the condition is
          // fullfield or not. Internally it counts the number of retries, if the max allowed
          // number of retries has been reached => Throw an Error
          interval = setInterval(async () => {
            try {
              if (_options.maxRetries && retryCounter > _options.maxRetries) {
                // Clear out the Interval
                clearInterval(interval);

                // If there is a Timeout clear it as well;
                if (timeout) {
                  clearTimeout(timeout);
                }

                reject(new RangeError("Max Retries has been reached"));
              } else if (await testCallback()) {
                // Clear out the Interval
                clearInterval(interval);

                // If there is a Timeout clear it as well;
                if (timeout) {
                  clearTimeout(timeout);
                }

                _resolve();
              }
              retryCounter += 1;
            } catch (err) {
              reject(err);
            }
          }, _options.delay);
        }
      } catch (e) {
        reject(e);
      }
    });
  } else {
    return new Promise<void>((resolve, reject) => {
      const _func = () => {
        let _resolve: () => void;
        if (_options.additionalDelay) {
          _resolve = () => {
            setTimeout(resolve, _options.additionalDelay);
          };
        } else {
          _resolve = resolve;
        }

        try {
          if (_options.testFirst && testCallback()) {
            if (_options.additionalDelay) {
              setTimeout(resolve, _options.additionalDelay);
            } else {
              _resolve();
            }
          } else {
            let retryCounter = 0;

            let timeout: any | null = null;
            let interval: any | null = null;

            // If there is a Timeout, define a Timeout Function, which will
            // Throw an Error on Timeout.
            if (_options.maxTimeout) {
              timeout = setTimeout(async () => {
                if (interval) {
                  clearInterval(interval);
                }

                reject(new Error("Wait has been Timeout"));
              }, _options.maxTimeout);
            }

            // Define a Testfunction, which will periodically test whether the condition is
            // fullfield or not. Internally it counts the number of retries, if the max allowed
            // number of retries has been reached => Throw an Error
            interval = setInterval(() => {
              try {
                if (_options.maxRetries && retryCounter > _options.maxRetries) {
                  // Clear out the Interval
                  clearInterval(interval);

                  // If there is a Timeout clear it as well;
                  if (timeout) {
                    clearTimeout(timeout);
                  }

                  reject(new RangeError("Max Retries has been reached"));
                } else if (testCallback()) {
                  // Clear out the Interval
                  clearInterval(interval);

                  // If there is a Timeout clear it as well;
                  if (timeout) {
                    clearTimeout(timeout);
                  }

                  _resolve();
                }
                retryCounter += 1;
              } catch (err) {
                reject(err);
              }
            }, _options.delay);
          }
        } catch (e) {
          reject(e);
        }
      };
      if (options.initialWait) {
        setTimeout(_func, options.initialWait);
      } else {
        _func();
      }
    });
  }
}
