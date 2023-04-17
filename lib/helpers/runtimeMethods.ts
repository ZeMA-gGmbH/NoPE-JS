/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

declare const process: any;
declare const setImmediate: any;

const _runningInNode =
  typeof process !== "undefined" &&
  typeof process.release !== "undefined" &&
  (process as any).release.name === "node";

/**
 * Function to call a function something direct async
 */
export const callImmediate = _runningInNode
  ? (callback: (...args) => void, ...args) => {
      // return setTimeout(callback, 0, ...args);
      const trace = new Error("Error for Bugtracing");
      return setImmediate(() => {
        try {
          callback(...args);
        } catch (error) {
          console.error(error);
          console.log("Trancing Bug with the Following Error");
          console.error(trace);
        }
      });
    }
  : (callback: (...args) => void, ...args) => {
      const trace = new Error("Error for Bugtracing");
      return setTimeout(() => {
        try {
          callback(...args);
        } catch (error) {
          console.error(error);
          console.log("Trancing Bug with the Following Error");
          console.error(trace);
        }
      }, 0);
    };

export const callDirect = (callback: (...args) => void, ...args) => {
  callback(...args);
};

export const RUNNINGINNODE = _runningInNode;
export const RUNNINGINWINDOWS = _runningInNode
  ? require("os").type() != "Linux"
  : false;
export const RUNNINGINLINUX = _runningInNode
  ? require("os").type() === "Linux"
  : false;
