/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { sleep } from "./async";
import { assert, expect } from "chai";
import { describe, it } from "mocha";
import { ParallelPriorityTaskQueue } from "./taskQueue";

describe("PriorityTaskQueue", function () {
  // Describe the required Test:

  describe("Async Functions", function () {
    it("no parallel execution - no priority", async function () {
      let called: string[] = [];

      async function delayed(ret: string) {
        await sleep(25);
        called.push(ret);
        return ret;
      }

      const queue = new ParallelPriorityTaskQueue();
      queue.maxParallel = 1;
      queue.usePriority = false;

      const promises = [
        queue.execute(delayed, ["first"], 5),
        queue.execute(delayed, ["second"], 10),
      ];

      const start = Date.now();

      await Promise.all(promises);

      const diff = Date.now() - start;

      assert(diff > 40, "Functions should be called after each other");
      assert(called[0] == "first", "First should be the first entry");
      assert(called[1] == "second", "First should be the first entry");
    });
    it("parallel execution - no priority", async function () {
      let called: string[] = [];

      async function delayed(ret: string) {
        await sleep(25);
        called.push(ret);
        return ret;
      }

      const queue = new ParallelPriorityTaskQueue();
      queue.maxParallel = 10;
      queue.usePriority = false;

      const promises = [
        queue.execute(delayed, ["first"], 5),
        queue.execute(delayed, ["second"], 10),
      ];

      const start = Date.now();

      await Promise.all(promises);

      const diff = Date.now() - start;

      assert(diff < 40, "Functions should be called parallel");
      assert(called[0] == "first", "First should be the first entry");
      assert(called[1] == "second", "First should be the first entry");
    });
    it("no parallel execution - with priority", async function () {
      let called: string[] = [];

      async function delayed(ret: string) {
        await sleep(25);
        called.push(ret);
        return ret;
      }

      const queue = new ParallelPriorityTaskQueue();
      queue.maxParallel = 1;
      queue.usePriority = true;

      const promises = [
        queue.execute(delayed, ["first"], 5),
        queue.execute(delayed, ["second"], 10),
        queue.execute(delayed, ["third"], 15),
      ];

      const start = Date.now();

      await Promise.all(promises);

      const diff = Date.now() - start;

      assert(diff > 40, "Functions should be called after each other");
      assert(called[1] == "third", "second should be the third entry");
      assert(called[2] == "second", "third should be the second entry");
    });
    it("parallel execution - with priority", async function () {
      let called: string[] = [];

      async function delayed(ret: string) {
        await sleep(25);
        called.push(ret);
        return ret;
      }

      const queue = new ParallelPriorityTaskQueue();
      queue.maxParallel = 10;
      queue.usePriority = true;

      const promises = [
        queue.execute(delayed, ["first"], 5),
        queue.execute(delayed, ["second"], 10),
        queue.execute(delayed, ["third"], 15),
      ];

      const start = Date.now();

      await Promise.all(promises);

      const diff = Date.now() - start;

      assert(diff < 40, "Functions should be called parallel");
      assert(called[0] == "first", "First should be the first entry");
      assert(called[1] == "second", "second should be the second entry");
      assert(called[2] == "third", "third should be the third entry");
    });
  });
});
