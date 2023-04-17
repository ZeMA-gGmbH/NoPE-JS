/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2022-01-04 10:03:41
 * @modify date 2022-01-10 14:12:20
 * @desc [description]
 */

import { expect } from "chai";
import { beforeEach, describe, it } from "mocha";
import "reflect-metadata";
import { getLayer } from "../../communication/getLayer.nodejs";
import { INopeObserver, NopeEventEmitter } from "../../eventEmitter";
import { NopeObservable } from "../../observables/nopeObservable";
import { NopeCore } from "./NopeCore";

describe("NopeCore", function () {
  // Describe the required Test:
  let core = new NopeCore(
    {
      communicator: getLayer("event", "", false),
      logger: false,
    },
    () => new NopeEventEmitter(),
    () => new NopeObservable(),
    "first"
  );

  describe("Configuration", function () {
    let communicator = getLayer("event", "", false);

    beforeEach(() => {
      core.dispose();

      communicator = getLayer("event", "", false);

      // Create a new Core
      core = new NopeCore(
        {
          communicator: getLayer("event", "", false),
          logger: false,
        },
        () => new NopeEventEmitter(),
        () => new NopeObservable(),
        "first"
      );
    });

    it("dispose", async () => {
      // Remove the Old Timer
      await core.ready.waitFor();
      await core.dispose();
    });
  });

  describe("Events", function () {
    let communicator = getLayer("event", "", false);

    let remote = new NopeCore(
      {
        communicator,
        logger: false,
      },
      () => new NopeEventEmitter(),
      () => new NopeObservable(),
      "second"
    );

    beforeEach(() => {
      core.dispose();
      remote.dispose();

      communicator = getLayer("event", "", false);

      // Create a new Core
      core = new NopeCore(
        {
          communicator,
          logger: false,
        },
        () => new NopeEventEmitter(),
        () => new NopeObservable(),
        "first"
      );

      remote = new NopeCore(
        {
          communicator,
          logger: false,
        },
        () => new NopeEventEmitter(),
        () => new NopeObservable(),
        "second"
      );
    });

    it("subscribe", (done) => {
      let sub: INopeObserver = null;
      sub = remote.eventDistributor.registerSubscription<string>(
        "test",
        (data) => {
          expect(data).to.equal("test");

          sub.unsubscribe();

          core.dispose();
          remote.dispose();

          done();
        }
      );

      setTimeout(() => {
        core.eventDistributor.emit("test", "test", {
          forced: true,
        });
      }, 20);
    });
  });

  describe("Properties", function () {
    let communicator = getLayer("event", "", false);

    let remote = new NopeCore(
      {
        communicator,
        logger: false,
      },
      () => new NopeEventEmitter(),
      () => new NopeObservable(),
      "second"
    );

    beforeEach(() => {
      core.dispose();
      remote.dispose();

      communicator = getLayer("event", "", false);

      // Create a new Core
      core = new NopeCore(
        {
          communicator,
          logger: false,
        },
        () => new NopeEventEmitter(),
        () => new NopeObservable(),
        "first"
      );

      remote = new NopeCore(
        {
          communicator,
          logger: false,
        },
        () => new NopeEventEmitter(),
        () => new NopeObservable(),
        "second"
      );
    });

    it("subscribe - clean", (done) => {
      let sub = null;
      sub = remote.dataDistributor.registerSubscription<string>(
        "test",
        (data, opts) => {
          if (data !== undefined) {
            expect(data).to.equal("test");
            done();
          }
        }
      );

      setTimeout(() => {
        core.dataDistributor.emit("test", "test", {
          forced: true,
        });
      }, 50);
    });

    it("subscribe - dirty data", (done) => {
      let sub = null;
      let first = true;

      remote.dataDistributor.pushData("test", "not-clean");
      sub = remote.dataDistributor.registerSubscription<string>(
        "test",
        (data, opts) => {
          if (first) {
            first = false;
            expect(data).to.equal("not-clean");
          } else {
            expect(data).to.equal("test");
            done();
          }
        }
      );

      setTimeout(() => {
        core.dataDistributor.emit("test", "test", {
          forced: true,
        });
      }, 50);
    });
  });
});
