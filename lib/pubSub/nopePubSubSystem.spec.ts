/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-11-13 08:17:19
 * @modify date 2021-11-13 09:44:51
 * @desc [description]
 */

import { assert, expect } from "chai";
import { beforeEach, describe, it } from "mocha";
import { NopeEventEmitter } from "../eventEmitter/nopeEventEmitter";
import { NopeObservable } from "../observables/nopeObservable";
import { INopeEventEmitter } from "../types/nope";
import { DataPubSubSystem } from "./nopeDataPubSubSystem";
import { PubSubSystemBase } from "./nopePubSubSystem";

describe("PubSubSystemBase", function () {
  // Describe the required Test:
  let pubSubSystem = new PubSubSystemBase({
    generateEmitterType: function () {
      return new NopeEventEmitter() as INopeEventEmitter;
    },
  });

  // Create a Publisher and Subscriber
  let publisher: INopeEventEmitter = new NopeEventEmitter();
  let subscriber: INopeEventEmitter = new NopeEventEmitter();

  describe("Publish and Subscribe", () => {
    beforeEach(() => {
      // Create a new Observer
      pubSubSystem = new PubSubSystemBase({
        generateEmitterType: function () {
          return new NopeEventEmitter() as INopeEventEmitter;
        },
      });

      publisher = new NopeEventEmitter();
      subscriber = new NopeEventEmitter();
    });

    it("Ommitting last published data", (done) => {
      publisher.emit("This should not be visible");

      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/#",
      });

      subscriber.subscribe((data) => {
        try {
          assert.deepEqual(data, "Hello World!", "Message should be equal");
          done();
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscription with smaller pattern length", (done) => {
      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      subscriber = pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is/#",
      });

      subscriber.subscribe((data) => {
        try {
          assert.deepEqual(data, "Hello World!", "Message should be equal");
          done();
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscription with smaller topic", (done) => {
      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      subscriber = pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is",
      });

      subscriber.subscribe((data) => {
        try {
          assert.deepEqual(
            data,
            { a: { test: "Hello World!" } },
            "Message should be equal"
          );
          done();
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscription with same pattern length", (done) => {
      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      subscriber = pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is/+/test",
      });

      subscriber.subscribe((data) => {
        try {
          assert.equal(data, "Hello World!", "Message should be equal");
          done();
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscription with same pattern length and multiple wildcards", (done) => {
      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is/+/#",
      });

      subscriber.subscribe((data) => {
        try {
          assert.equal(data, "Hello World!", "Message should be equal");
          done();
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscriptions", (done) => {
      const subscriber02 = new NopeObservable();

      publisher.emit("This should not be visible");

      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is",
      });

      pubSubSystem.register(subscriber02, {
        mode: "subscribe",
        schema: {},
        topic: "this/is/a",
      });

      const items = [];

      subscriber.subscribe((data) => {
        try {
          assert.deepEqual(
            data,
            { a: { test: "Hello World!" } },
            "Message of Subscriber should be equal"
          );
          items.push("subscriber");
          if (items.length == 2) {
            assert.include(items, "subscriber02", "Should have subscriber");
            assert.include(items, "subscriber", "Should have subscriber");
            done();
          }
        } catch (e) {
          done(e);
        }
      });

      subscriber02.subscribe((data) => {
        try {
          assert.deepEqual(
            data,
            { test: "Hello World!" },
            "Message of Subscriber02 should be equal"
          );
          items.push("subscriber02");
          if (items.length == 2) {
            assert.include(items, "subscriber02", "Should have subscriber");
            assert.include(items, "subscriber", "Should have subscriber");
            done();
          }
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Testing Emitters", (done) => {
      pubSubSystem.subscriptions.onChange.subscribe((data) => {
        if (data.added.includes("this/#")) {
          done();
        }
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/#",
      });
    });

    it("Testing Emitters", (done) => {
      pubSubSystem.subscriptions.data.subscribe(
        (data) => {
          if (data.includes("this/#")) {
            done();
          }
        },
        { skipCurrent: true }
      );

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/#",
      });
    });

    it("throw Error on multi registering", (done) => {
      const error = new Error("Error not thrown");
      try {
        pubSubSystem.register(publisher, {
          mode: "publish",
          schema: {},
          topic: "this/is/a/test",
        });
        pubSubSystem.register(publisher, {
          mode: "publish",
          schema: {},
          topic: "this/is/a/test",
        });
        throw error;
      } catch (e) {
        if (e === error) {
          done(e);
        } else {
          done();
        }
      }
    });
  });

  describe("Publish and Subscribe - without child data", () => {
    beforeEach(() => {
      // Create a new Observer
      pubSubSystem = new PubSubSystemBase({
        generateEmitterType: function () {
          return new NopeEventEmitter() as INopeEventEmitter;
        },
        forwardChildData: false,
      });

      publisher = new NopeEventEmitter();
      subscriber = new NopeEventEmitter();
    });

    it("Ommitting last published data", (done) => {
      publisher.emit("This should not be visible");

      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/#",
      });

      subscriber.subscribe((data) => {
        try {
          assert.deepEqual(data, "Hello World!", "Message should be equal");
          done();
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscription with smaller pattern length", (done) => {
      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      subscriber = pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is/#",
      });

      subscriber.subscribe((data) => {
        try {
          assert.deepEqual(data, "Hello World!", "Message should be equal");
          done();
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscription with smaller topic", (done) => {
      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      subscriber = pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is",
      });

      subscriber.subscribe((data) => {
        try {
          assert.deepEqual(
            data,
            { a: { test: "Hello World!" } },
            "Message should be equal"
          );
          done();
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscription with same pattern length", (done) => {
      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      subscriber = pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is/+/test",
      });

      subscriber.subscribe((data) => {
        try {
          assert.equal(data, "Hello World!", "Message should be equal");
          done();
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscription with same pattern length and multiple wildcards", (done) => {
      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is/+/#",
      });

      subscriber.subscribe((data) => {
        try {
          assert.equal(data, "Hello World!", "Message should be equal");
          done();
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscriptions", (done) => {
      const subscriber02 = new NopeObservable();

      publisher.emit("This should not be visible");

      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is",
      });

      pubSubSystem.register(subscriber02, {
        mode: "subscribe",
        schema: {},
        topic: "this/is/a",
      });

      const items = [];

      subscriber.subscribe((data) => {
        try {
          assert.deepEqual(
            data,
            { a: { test: "Hello World!" } },
            "Message of Subscriber should be equal"
          );
          items.push("subscriber");
          if (items.length == 2) {
            assert.include(items, "subscriber02", "Should have subscriber");
            assert.include(items, "subscriber", "Should have subscriber");
            done();
          }
        } catch (e) {
          done(e);
        }
      });

      subscriber02.subscribe((data) => {
        try {
          assert.deepEqual(
            data,
            { test: "Hello World!" },
            "Message of Subscriber02 should be equal"
          );
          items.push("subscriber02");
          if (items.length == 2) {
            assert.include(items, "subscriber02", "Should have subscriber");
            assert.include(items, "subscriber", "Should have subscriber");
            done();
          }
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Testing Emitters", (done) => {
      pubSubSystem.subscriptions.onChange.subscribe((data) => {
        if (data.added.includes("this/#")) {
          done();
        }
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/#",
      });
    });

    it("Testing Emitters", (done) => {
      pubSubSystem.subscriptions.data.subscribe(
        (data) => {
          if (data.includes("this/#")) {
            done();
          }
        },
        { skipCurrent: true }
      );

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/#",
      });
    });

    it("throw Error on multi registering", (done) => {
      const error = new Error("Error not thrown");
      try {
        pubSubSystem.register(publisher, {
          mode: "publish",
          schema: {},
          topic: "this/is/a/test",
        });
        pubSubSystem.register(publisher, {
          mode: "publish",
          schema: {},
          topic: "this/is/a/test",
        });
        throw error;
      } catch (e) {
        if (e === error) {
          done(e);
        } else {
          done();
        }
      }
    });
  });
});

describe("DataPubSubSystemBase", function () {
  // Describe the required Test:
  let pubSubSystem = new DataPubSubSystem({
    generateEmitterType: function <T>() {
      return new NopeObservable<T>();
    },
  });

  // Create a Publisher and Subscriber
  let publisher = new NopeObservable();
  let subscriber = new NopeObservable();

  describe("Data Handling", () => {
    beforeEach(() => {
      // Create a new Observer
      pubSubSystem = new DataPubSubSystem({
        generateEmitterType: function <T>() {
          return new NopeObservable<T>();
        },
      });

      publisher = new NopeObservable();
      subscriber = new NopeObservable();
    });

    it("writing to root name", () => {
      pubSubSystem.pushData("", { root: "data" });
      expect(pubSubSystem.data).to.be.deep.equal({ root: "data" });
    });
    it("writing to path", () => {
      pubSubSystem.pushData("root", "data");
      expect(pubSubSystem.data).to.be.deep.equal({ root: "data" });
    });
    it("reading with patternbasedPullData", () => {
      pubSubSystem.pushData("test", { a: 1337, b: 1337 });
      const result = pubSubSystem.patternbasedPullData("test/+");

      assert.isArray(result, "Expecting an arry");
      assert.deepInclude(
        result,
        { path: "test/a", data: 1337 },
        `Expecting Element in array. array=${JSON.stringify(result)}`
      );
      assert.deepInclude(
        result,
        { path: "test/b", data: 1337 },
        `Expecting Element in array. array=${JSON.stringify(result)}`
      );
    });
    it("reading with patternbasedPullData and deep data", () => {
      pubSubSystem.pushData("test", { a: 1337, b: { c: 1337 } });
      let result = pubSubSystem.patternbasedPullData("test/+");

      assert.isArray(result, "Expecting an arry");
      assert.deepInclude(
        result,
        { path: "test/a", data: 1337 },
        `Expecting Element in array. array=${JSON.stringify(result)}`
      );
      assert.deepInclude(
        result,
        { path: "test/b", data: { c: 1337 } },
        `Expecting Element in array. array=${JSON.stringify(result)}`
      );

      result = pubSubSystem.patternbasedPullData("+/a");

      assert.isArray(result, "Expecting an arry");
      assert.deepInclude(
        result,
        { path: "test/a", data: 1337 },
        `Expecting Element in array. array=${JSON.stringify(result)}`
      );
      assert.isTrue(result.length === 1, "Should contain only 1 item.");
    });
    it("reading with patternbasedPullData and deep data and multilevel wildcard", () => {
      pubSubSystem.pushData("test", { a: 1337, b: { c: 1337 } });
      const result = pubSubSystem.patternbasedPullData("test/#");

      assert.isArray(result, "Expecting an arry");
      assert.deepInclude(
        result,
        { path: "test/a", data: 1337 },
        `Expecting Element in array. array=${JSON.stringify(result)}`
      );
      assert.deepInclude(
        result,
        { path: "test/b", data: { c: 1337 } },
        `Expecting Element in array. array=${JSON.stringify(result)}`
      );
      assert.deepInclude(
        result,
        { path: "test/b/c", data: 1337 },
        `Expecting Element in array. array=${JSON.stringify(result)}`
      );
      assert.isTrue(result.length === 3, "Should contain only 3 item.");
    });
    it("writing with pattern and deep data", () => {
      pubSubSystem.pushData("test", { a: 1337, b: { c: 1337 } });
      pubSubSystem.patternBasedPush("test/+", 1338);

      let result = pubSubSystem.patternbasedPullData("test/+");

      expect(pubSubSystem.data).to.be.deep.equal({
        test: { a: 1338, b: 1338 },
      });

      assert.isArray(result, "Expecting an arry");
      assert.deepInclude(
        result,
        { path: "test/a", data: 1338 },
        `Expecting Element in array. array=${JSON.stringify(result)}`
      );
      assert.deepInclude(
        result,
        { path: "test/b", data: 1338 },
        `Expecting Element in array. array=${JSON.stringify(result)}`
      );

      pubSubSystem.patternBasedPush("+/b", 1339);
      result = pubSubSystem.patternbasedPullData("test/+");

      expect(pubSubSystem.data).to.be.deep.equal({
        test: { a: 1338, b: 1339 },
      });

      pubSubSystem.patternBasedPush("+/c", 1339);
      result = pubSubSystem.patternbasedPullData("test/+");

      expect(pubSubSystem.data).to.be.deep.equal({
        test: { a: 1338, b: 1339 },
      });

      pubSubSystem.patternBasedPush("+/b/c", 1340);
      result = pubSubSystem.patternbasedPullData("test/+");

      expect(pubSubSystem.data).to.be.deep.equal({
        test: { a: 1338, b: 1339 },
      });
    });
    it("throw error pattern in pull", (done) => {
      const error = new Error("Error not thrown");
      try {
        pubSubSystem.pullData("+/#");
        throw error;
      } catch (e) {
        if (e === error) {
          done(e);
        } else {
          done();
        }
      }
    });
    it("throw error pattern in pull", (done) => {
      const error = new Error("Error not thrown");
      try {
        pubSubSystem.pullData("test/+");
        throw error;
      } catch (e) {
        if (e === error) {
          done(e);
        } else {
          done();
        }
      }
    });
    it("throw error pattern in pull", (done) => {
      const error = new Error("Error not thrown");
      try {
        pubSubSystem.pullData("test/#");
        throw error;
      } catch (e) {
        if (e === error) {
          done(e);
        } else {
          done();
        }
      }
    });
  });

  describe("Publish and Subscribe", () => {
    beforeEach(() => {
      // Create a new Observer
      pubSubSystem = new DataPubSubSystem({
        generateEmitterType: function <T>() {
          return new NopeObservable<T>();
        },
      });

      publisher = new NopeObservable();
      subscriber = new NopeObservable();
    });

    it("emitting content via emitter", (done) => {
      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is",
      });

      publisher.setContent("Hello World!");
      subscriber.subscribe((data) => {
        try {
          assert.deepEqual(
            data,
            { a: { test: "Hello World!" } },
            "Message should be equal"
          );
          expect(pubSubSystem.data).to.be.deep.equal({
            this: { is: { a: { test: "Hello World!" } } },
          });
          done();
        } catch (e) {
          done(e);
        }
      });
    });
    it("receiving content via pub-sub-system", (done) => {
      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is",
      });
      subscriber.subscribe(
        (data) => {
          try {
            assert.equal(data, "a test", "Message should be equal");
            expect(pubSubSystem.data).to.be.deep.equal({
              this: { is: "a test" },
            });
            done();
          } catch (e) {
            done(e);
          }
        },
        {
          skipCurrent: true,
        }
      );
      pubSubSystem.pushData("this/is", "a test");
    });
  });

  describe("Publish and Subscribe - without child data", () => {
    beforeEach(() => {
      // Create a new Observer
      pubSubSystem = new DataPubSubSystem({
        generateEmitterType: function <T>() {
          return new NopeObservable<T>();
        },
        forwardChildData: false,
      });

      publisher = new NopeObservable();
      subscriber = new NopeObservable();
    });

    it("Ommitting last published data", (done) => {
      publisher.emit("This should not be visible");

      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/#",
      });

      subscriber.subscribe(
        (data) => {
          try {
            assert.deepEqual(data, "Hello World!", "Message should be equal");
            done();
          } catch (e) {
            done(e);
          }
        },
        {
          skipCurrent: true,
        }
      );

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscription with smaller pattern length", (done) => {
      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is/#",
      });

      subscriber.subscribe((data) => {
        try {
          assert.deepEqual(data, "Hello World!", "Message should be equal");
          done();
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscription with smaller topic", (done) => {
      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is",
      });

      subscriber.subscribe((data) => {
        done(new Error("Should not be called"));
      });

      publisher.emit("Hello World!");
      done();
    });

    it("Forwading data for subscription with same pattern length", (done) => {
      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is/+/test",
      });

      subscriber.subscribe((data) => {
        try {
          assert.equal(data, "Hello World!", "Message should be equal");
          done();
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscription with same pattern length and multiple wildcards", (done) => {
      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is/+/#",
      });

      subscriber.subscribe((data) => {
        try {
          assert.equal(data, "Hello World!", "Message should be equal");
          done();
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Forwading data for subscriptions", (done) => {
      const subscriber02 = new NopeObservable();

      publisher.emit("This should not be visible");

      pubSubSystem.register(publisher, {
        mode: "publish",
        schema: {},
        topic: "this/is/a/test",
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/is",
      });

      pubSubSystem.register(subscriber02, {
        mode: "subscribe",
        schema: {},
        topic: "this/is/a",
      });

      const items = [];

      subscriber.subscribe((data) => {
        try {
          assert.deepEqual(
            data,
            { a: { test: "Hello World!" } },
            "Message of Subscriber should be equal"
          );
          items.push("subscriber");
          if (items.length == 2) {
            assert.include(items, "subscriber02", "Should have subscriber");
            assert.include(items, "subscriber", "Should have subscriber");
            done();
          }
        } catch (e) {
          done(e);
        }
      });

      subscriber02.subscribe((data) => {
        try {
          assert.deepEqual(
            data,
            { test: "Hello World!" },
            "Message of Subscriber02 should be equal"
          );
          items.push("subscriber02");
          if (items.length == 2) {
            assert.include(items, "subscriber02", "Should have subscriber");
            assert.include(items, "subscriber", "Should have subscriber");
            done();
          }
        } catch (e) {
          done(e);
        }
      });

      publisher.emit("Hello World!");
    });

    it("Testing Emitters", (done) => {
      pubSubSystem.subscriptions.onChange.subscribe((data) => {
        if (data.added.includes("this/#")) {
          done();
        }
      });

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/#",
      });
    });

    it("Testing Emitters", (done) => {
      pubSubSystem.subscriptions.data.subscribe(
        (data) => {
          if (data.includes("this/#")) {
            done();
          }
        },
        { skipCurrent: true }
      );

      pubSubSystem.register(subscriber, {
        mode: "subscribe",
        schema: {},
        topic: "this/#",
      });
    });

    it("throw Error on multi registering", (done) => {
      const error = new Error("Error not thrown");
      try {
        pubSubSystem.register(publisher, {
          mode: "publish",
          schema: {},
          topic: "this/is/a/test",
        });
        pubSubSystem.register(publisher, {
          mode: "publish",
          schema: {},
          topic: "this/is/a/test",
        });
        throw error;
      } catch (e) {
        if (e === error) {
          done(e);
        } else {
          done();
        }
      }
    });
  });
});
