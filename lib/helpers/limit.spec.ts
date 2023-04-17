/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { describe, it } from "mocha";
import { sleep } from "./async";
import { limitedCalls } from "./limit";

describe("limit", function () {
  // Describe the required Test:

  describe("limitedCalls", function () {
    it("single-call - sync", async () => {
      const f = limitedCalls(sleep, {
        maxParallel: 0,
      });
      const start = Date.now();
      const promises = [f(100), f(100)];
      await Promise.all(promises);
      const end = Date.now();
      if (end - start < 200) {
        throw Error("Failed to call sync");
      }
    });

    it("single-call - with locking", async () => {
      const sleepExtended = (delay, opts) => {
        return new Promise((resolve) => {
          opts.pauseTask();
          setTimeout(() => {
            opts.continueTask();
            resolve(null);
          }, delay);
        });
      };

      const f = limitedCalls(sleepExtended, {
        maxParallel: 0,
        assignControlFunction(args, opts) {
          args.push(opts);
          return args;
        },
      });
      const start = Date.now();
      const promises = [f(100), f(100)];
      await Promise.all(promises);
      const end = Date.now();
      if (end - start > 150) {
        throw Error("Failed to call async");
      }
    });

    it("single-call - parallel", async () => {
      const f = limitedCalls(sleep, {
        maxParallel: 2,
      });
      const start = Date.now();
      const promises = [f(100), f(100)];
      await Promise.all(promises);
      const end = Date.now();
      if (end - start > 200) {
        throw Error("Failed to call parallel");
      }
    });
    it("single-call - between (sync)", async () => {
      const f = limitedCalls<void>(async (...args) => {}, {
        maxParallel: 0,
        callbackBetween: () => sleep(50),
      });
      const start = Date.now();
      const promises = [f(100), f(100)];
      await Promise.all(promises);
      const end = Date.now();
      if (end - start < 50) {
        throw Error("Failed to call callbackBetween");
      }
    });
    it("single-call - between (parallel)", async () => {
      const f = limitedCalls<void>(async (...args) => {}, {
        maxParallel: 10,
        callbackBetween: () => sleep(50),
      });
      const start = Date.now();
      const promises = [f(100), f(100)];
      await Promise.all(promises);
      const end = Date.now();
      if (end - start > 50) {
        throw Error("Failed to call callbackBetween");
      }
    });
    it("single-call - delay", async () => {
      const f = limitedCalls<void>(async (...args) => {}, {
        maxParallel: 0,
        minDelay: 50,
      });
      const start = Date.now();
      const promises = [f(100), f(100)];
      await Promise.all(promises);
      const end = Date.now();
      if (end - start < 50) {
        throw Error("Failed to call callbackBetween");
      }
    });
    it("single-call - delay (parallel)", async () => {
      const f = limitedCalls<void>(async (...args) => {}, {
        maxParallel: 10,
        minDelay: 50,
      });
      const start = Date.now();
      const promises = [f(100), f(100)];
      await Promise.all(promises);
      const end = Date.now();
      if (end - start < 50) {
        throw Error("Failed to call callbackBetween");
      }
    });
  });
});
