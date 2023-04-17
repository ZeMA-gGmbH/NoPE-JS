/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */
import { assert } from "chai";
import { beforeEach, describe, it } from "mocha";
import { NopeObservable } from "./nopeObservable";

describe("NopeObservable", function () {
  // Describe the required Test:

  describe("NopeObservable, with default behavior", function () {
    let emitter = new NopeObservable<string>();

    beforeEach(() => {
      emitter = new NopeObservable<string>();
    });

    it("subscribe callback without inital value", (done) => {
      try {
        const subscriber = emitter.subscribe({
          next: (data) => {
            done();
          },
        });
        subscriber.pause();
        emitter.setContent("Hello");
        subscriber.unpause();
        emitter.setContent("World!");
      } catch (e) {
        throw Error("Something went wrong");
      }
    });

    it("subscribe callback with inital value", (done) => {
      try {
        emitter.setContent("This is a Test.");
        const subscriber = emitter.subscribe({
          next: (data) => {
            done();
          },
        });
        subscriber.pause();
        emitter.setContent("Hello");
      } catch (e) {
        throw Error("Something went wrong");
      }
    });

    it("subscribe callback with setter", (done) => {
      try {
        emitter.setter = (data) => {
          return {
            valid: true,
            data: "Hello " + data,
          };
        };
        emitter.setContent("World!");

        emitter.subscribe({
          next: (data) => {
            try {
              assert.strictEqual(data, "Hello World!");
              done();
            } catch (e) {
              done(e);
            }
          },
        });
      } catch (e) {
        throw Error("Something went wrong");
      }
    });

    it("subscribe callback with getter", (done) => {
      try {
        emitter.getter = (data) => {
          return data + "!";
        };
        emitter.setContent("Hello World");

        emitter.subscribe({
          next: (data) => {
            try {
              assert.strictEqual(data, "Hello World!");
              done();
            } catch (e) {
              done(e);
            }
          },
        });
      } catch (e) {
        throw Error("Something went wrong");
      }
    });

    it("subscribe callback with inital value", (done) => {
      try {
        emitter.emit("This is a Test.");
        const subscriber = emitter.subscribe(
          {
            next: (data) => {
              done();
            },
          },
          {
            skipCurrent: true,
          }
        );
        subscriber.pause();
        emitter.emit("Hello");
        subscriber.unpause();
        emitter.emit("World!");
      } catch (e) {
        throw Error("Something went wrong");
      }
    });

    it("subscribe check order", (done) => {
      const items: string[] = [];
      try {
        emitter.setContent("0");
        const subscriber = emitter.subscribe({
          next: (data) => {
            items.push(data);
            if (items.length === 4) {
              try {
                assert.deepEqual(items, ["0", "1", "2", "3"]);
                done();
              } catch (e) {
                done(e);
              }
            }
          },
        });
        for (let i = 1; i <= 3; i++) {
          emitter.setContent(i.toString());
        }
      } catch (e) {
        throw Error("Something went wrong");
      }
    });
  });

  describe("NopeObservable with record", function () {
    let emitter = new NopeObservable<string>({
      showCurrent: true,
      playHistory: true,
    });

    beforeEach(() => {
      emitter = new NopeObservable<string>({
        showCurrent: true,
        playHistory: true,
      });
    });

    it("subscribe check order", (done) => {
      const items: string[] = [];
      try {
        emitter.emit("0");
        emitter.emit("1");
        const subscriber = emitter.subscribe({
          next: (data) => {
            items.push(data);
            if (items.length === 3) {
              try {
                assert.deepEqual(items, ["0", "1", "2"]);
                done();
              } catch (e) {
                done(e);
              }
            }
          },
        });
        emitter.emit("2");
      } catch (e) {
        throw Error("Something went wrong");
      }
    });
  });
});
