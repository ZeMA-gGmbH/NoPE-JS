/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { assert, expect } from "chai";
import { beforeEach, describe, it } from "mocha";
import "reflect-metadata";
import { getLayer } from "../../communication/getLayer.nodejs";
import { sleep } from "../../helpers/async";
import { NopeObservable } from "../../observables/nopeObservable";
import { NopeConnectivityManager } from "./ConnectivityManager";

describe("NopeConnectivityManager", function () {
  // Describe the required Test:
  let first = new NopeConnectivityManager(
    {
      communicator: getLayer("event", "", false),
      logger: false,
    },
    () => new NopeObservable(),
    "first"
  );

  describe("Configuration", function () {
    let communicator = getLayer("event", "", false);

    beforeEach((done) => {
      first.dispose(true);

      communicator = getLayer("event", "", false);

      // Create a new Observer
      first = new NopeConnectivityManager(
        {
          communicator,
          logger: false,
        },
        () => new NopeObservable(),
        "test"
      );

      first.ready.waitFor().then(() => done());
    });

    it("adapting timings", async () => {
      // Remove the Old Timer
      first.setTimings({
        checkInterval: 10,
        dead: 25,
        remove: 30,
        sendAliveInterval: 5,
        slow: 15,
        warn: 20,
      });

      first.dispose();
    });
    it("master-flag", async () => {
      // Remove the Old Timer
      expect(first.isMaster, "Expecting to be the master");
      first.isMaster = true;
      expect(first.isMaster, "Expecting to be the master");
      first.isMaster = false;
      expect(!first.isMaster, "Expecting to be the master");
      first.dispose();
    });
  });

  describe("NopeConnectivityManager Communication", function () {
    let communicator = getLayer("event", "", false);

    beforeEach((done) => {
      first.dispose(true);

      communicator = getLayer("event", "", false);

      // Create a new Observer
      first = new NopeConnectivityManager(
        {
          communicator,
          logger: false,
        },
        () => new NopeObservable(),
        "first"
      );

      first.ready.waitFor().then(() => done());
    });

    it("new detection", (done) => {
      let sub = null;
      sub = first.dispatchers.onChange.subscribe((changes) => {
        if (changes.added.length >= 1) {
          done();
          first.dispose(true);
          sub.unsubscribe();
        } else {
          done(new Error("Not found"));
          first.dispose(true);
          sub.unsubscribe();
        }
      });

      const second = new NopeConnectivityManager(
        {
          communicator,
          logger: false,
          timeouts: {
            checkInterval: 10,
            dead: 25,
            remove: 30,
            sendAliveInterval: 5,
            slow: 15,
            warn: 20,
          },
        },
        () => new NopeObservable(),
        "second"
      );
      second.dispose(true);
    });

    it("removed detection", (done) => {
      let sub = null;
      let firstCall = true;
      // We want our first dispatcher to detect the loss ==>
      // We adapt the time. That our second dispatcher will be
      // more less directly offline.
      first.setTimings({
        checkInterval: 10,
        dead: 25,
        remove: 30,
        sendAliveInterval: 5,
        slow: 15,
        warn: 20,
      });
      sub = first.dispatchers.onChange.subscribe((changes) => {
        if (firstCall) {
          firstCall = false;
        } else {
          if (changes.removed.length >= 1) {
            done();
            first.dispose(true);
            second.dispose(true);
            sub.unsubscribe();
          } else {
            done(new Error("removing has not been detected"));
            first.dispose(true);
            second.dispose(true);
            sub.unsubscribe();
          }
        }
      });

      const second = new NopeConnectivityManager(
        {
          communicator,
          logger: false,
        },
        () => new NopeObservable(),
        "second"
      );
    });

    it("synchronizing time", async () => {
      // Remove the Old Timer
      first.dispose(true);
      first = new NopeConnectivityManager(
        {
          communicator,
        },
        () => new NopeObservable(),
        "first"
      );
      const timestamp = first.now;

      // Now we want to simulate an delay.
      let start = Date.now();
      await sleep(30);
      let end = Date.now();

      // We have waited something like 100 ms (+-)
      // thats our delay. Now if we use that delay,
      // we are able sync our time.
      first.syncTime(timestamp, end - start);

      // Get the Adapted Timestamp.
      const adapted = first.info.timestamp;
      end = Date.now();

      // Dispose our Delay.
      first.dispose(true);

      assert(end - adapted < 5, "There should not be an delta.");
    });

    it("master", async () => {
      // Wait for the Handshake
      await sleep(10);

      assert(first.isMaster, "First should be master");

      // Create the second Element.
      const second = new NopeConnectivityManager(
        {
          communicator,
          logger: false,
        },
        () => new NopeObservable(),
        "second"
      );

      // Wait for the Handshake
      await sleep(10);

      assert(first.isMaster, "First should be master");
      assert(second.isMaster == false, "Second should not be master");
      assert(
        first.master.id == first.id,
        "First should recognize the first as master"
      );
      assert(
        second.master.id == first.id,
        "Second should recognize the first as master"
      );

      first.dispose(true);
      second.dispose(true);
    });

    it("master - forced", async () => {
      // Wait for the Handshake
      await sleep(10);

      assert(first.isMaster, "First should be master");

      first.isMaster = false;

      // Create the second Element.
      const second = new NopeConnectivityManager(
        {
          communicator,
          logger: false,
        },
        () => new NopeObservable(),
        "second"
      );

      // Wait for the Handshake
      await sleep(10);

      assert(first.isMaster == false, "First should not be master");
      assert(second.isMaster == true, "Second should be master");
      assert(
        first.master.id == second.id,
        "First should recognize the second as master"
      );
      assert(
        second.master.id == second.id,
        "Second should recognize the second as master"
      );

      // Wait for the Handshake
      first.isMaster = null;
      await sleep(40);

      assert(first.isMaster === true, "First should be master");
      assert(second.isMaster == false, "Second should not be master");
      assert(
        first.master.id == first.id,
        "First should recognize the first as master"
      );
      assert(
        second.master.id == first.id,
        "Second should recognize the first as master"
      );

      first.dispose(true);
      second.dispose(true);
    });
  });
});
