/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-23 08:06:30
 * @modify date 2021-10-19 17:55:35
 * @desc [description]
 */
import { assert } from "chai";
import { beforeEach, describe, it } from "mocha";
import { NopeEventEmitter } from "./nopeEventEmitter";

describe("NopeEventEmitter", function () {
  // Describe the required Test:

  describe("NopeEventEmitter wichout current-value", function () {
    let emitter = new NopeEventEmitter<string>();

    beforeEach(() => {
      emitter = new NopeEventEmitter<string>();
    });

    it("subscribe callback without inital value", (done) => {
      try {
        const subscriber = emitter.subscribe({
          next: (data) => {
            done();
          },
        });
        subscriber.pause();
        emitter.emit("Hello");
        subscriber.unpause();
        emitter.emit("World!");
      } catch (e) {
        throw Error("Something went wrong");
      }
    });

    it("subscribe callback with inital value", (done) => {
      try {
        emitter.emit("This is a Test.");
        const subscriber = emitter.subscribe({
          next: (data) => {
            done();
          },
        });
        subscriber.pause();
        emitter.emit("Hello");
        subscriber.unpause();
        emitter.emit("World!");
      } catch (e) {
        throw Error("Something went wrong");
      }
    });

    it("subscribe callback with setter", (done) => {
      try {
        emitter.emit("This is a Test.");

        emitter.setter = (data) => {
          return {
            valid: true,
            data: "Hello " + data,
          };
        };

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

        emitter.emit("World!");
      } catch (e) {
        throw Error("Something went wrong");
      }
    });

    it("subscribe callback with getter", (done) => {
      try {
        emitter.emit("This is a Test.");

        emitter.getter = (data) => {
          return data + "!";
        };

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

        emitter.emit("Hello World");
      } catch (e) {
        throw Error("Something went wrong");
      }
    });

    it("subscribe check order", (done) => {
      const items: string[] = [];
      try {
        emitter.emit("0");
        const subscriber = emitter.subscribe({
          next: (data) => {
            items.push(data);
            if (items.length === 3) {
              try {
                assert.deepEqual(items, ["1", "2", "3"]);
                done();
              } catch (e) {
                done(e);
              }
            }
          },
        });
        for (let i = 1; i <= 3; i++) {
          emitter.emit(i.toString());
        }
      } catch (e) {
        throw Error("Something went wrong");
      }
    });
  });

  describe("NopeEventEmitter-Without-History", function () {
    let emitter = new NopeEventEmitter<string>({
      showCurrent: true,
    });

    beforeEach(() => {
      emitter = new NopeEventEmitter<string>({
        showCurrent: true,
      });
    });

    it("subscribe callback without inital value", (done) => {
      try {
        const subscriber = emitter.subscribe({
          next: (data) => {
            done();
          },
        });
        subscriber.pause();
        emitter.emit("Hello");
        subscriber.unpause();
        emitter.emit("World!");
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

    it("subscribe callback with setter", (done) => {
      try {
        emitter.emit("This is a Test.");

        emitter.setter = (data) => {
          return {
            valid: true,
            data: "Hello " + data,
          };
        };

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

        emitter.emit("World!");
      } catch (e) {
        throw Error("Something went wrong");
      }
    });

    it("subscribe callback with getter", (done) => {
      try {
        emitter.emit("This is a Test.");

        emitter.getter = (data) => {
          return data + "!";
        };

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

        emitter.emit("Hello World");
      } catch (e) {
        throw Error("Something went wrong");
      }
    });

    it("subscribe check order", (done) => {
      const items: string[] = [];
      try {
        emitter.emit("0");
        const subscriber = emitter.subscribe({
          next: (data) => {
            items.push(data);
            if (items.length === 3) {
              try {
                assert.deepEqual(items, ["1", "2", "3"]);
                done();
              } catch (e) {
                done(e);
              }
            }
          },
        });
        for (let i = 1; i <= 3; i++) {
          emitter.emit(i.toString());
        }
      } catch (e) {
        throw Error("Something went wrong");
      }
    });
  });

  describe("NopeEventEmitter with record", function () {
    let emitter = new NopeEventEmitter<string>({
      showCurrent: true,
      playHistory: true,
    });

    beforeEach(() => {
      emitter = new NopeEventEmitter<string>({
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
