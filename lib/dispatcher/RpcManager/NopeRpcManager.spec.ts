/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2022-01-05 17:50:44
 * @modify date 2022-01-05 17:50:44
 * @desc [description]
 */

import { expect, assert } from "chai";
import { beforeEach, describe, it } from "mocha";
import "reflect-metadata";
import { getLayer } from "../../communication/getLayer.nodejs";
import { sleep } from "../../helpers/async";
import { NopeObservable } from "../../observables/nopeObservable";
import { NopeRpcManager } from "./NopeRpcManager";

describe("NopeRpcManager", function () {
  // Describe the required Test:
  let manager = new NopeRpcManager(
    {
      communicator: getLayer("event", "", false),
      logger: false,
    },
    () => new NopeObservable(),
    async () => "test",
    "test"
  );

  describe("serviceHandeling", function () {
    beforeEach((done) => {
      // Create a new Observer
      manager = new NopeRpcManager(
        {
          communicator: getLayer("event", "", false),
          logger: false,
        },
        () => new NopeObservable(),
        async () => "test",
        "test"
      );

      manager.ready.waitFor().then(() => done());
    });

    const helloworld = async (greetings: string) => {
      return "Hello " + greetings + "!";
    };

    const delay = async (greetings: string) => {
      await sleep(1000);
      return "Hello " + greetings + "!";
    };

    it("registering service", async () => {
      await manager.ready.waitFor();
      // Now we register the Service
      await manager.registerService(helloworld, {
        id: "helloworld",
        schema: {
          description: "Hello World Service",
        },
      });

      await sleep(10);
      // Get the Services
      const services = manager.services.extractedKey;
      expect(services).to.include("helloworld");

      assert(
        manager.services.amountOf.get("helloworld") == 1,
        "There should be one Provider for this service"
      );
      assert(
        manager.services.keyMappingReverse.get("helloworld").size == 1,
        "There should be one Provider for this service"
      );
      assert(
        manager.services.conflicts.size == 0,
        "There should be no conflict"
      );
      assert(manager.serviceExists("helloworld"), "Service should be known!");
      assert(
        manager.serviceExists("helloworld2") == false,
        "Service should not be known!"
      );
      assert(
        Array.from(manager.services.keyMappingReverse.get("helloworld"))[0] ==
          "test",
        "The Provider should be 'test'"
      );
    });

    it("call service", async () => {
      await manager.ready.waitFor();

      await manager.registerService(helloworld, {
        id: "helloworld",
        schema: {
          description: "Hello World Service",
        },
      });

      await sleep(10);

      const result = await manager.performCall("helloworld", ["Mocha"]);
      expect(result).to.equal("Hello Mocha!", "result is not matching");
    });

    it("call service via methodInterface", async () => {
      await manager.ready.waitFor();

      await manager.registerService(helloworld, {
        id: "helloworld",
        schema: {
          description: "Hello World Service",
        },
      });

      await sleep(10);

      const result = await manager.methodInterface.helloworld("Mocha");
      expect(result).to.equal("Hello Mocha!", "result is not matching");
    });

    it("call service with a timeout", async () => {
      await manager.ready.waitFor();

      await manager.registerService(delay, {
        id: "helloworld",
        schema: {
          description: "Hello World Service",
        },
      });

      await sleep(10);

      const err = Error("Error not thrown");

      try {
        const result = await manager.methodInterfaceWithOptions.helloworld(
          {
            timeout: 50,
          },
          "Mocha"
        );
        throw err;
      } catch (e) {
        if (e == err) {
          throw err;
        }
      }
    });

    it("multi-call", async () => {
      await manager.ready.waitFor();

      await manager.registerService(helloworld, {
        id: "helloworld_00",
        schema: {
          description: "Hello World Service",
        },
      });
      await manager.registerService(helloworld, {
        id: "helloworld_01",
        schema: {
          description: "Hello World Service",
        },
      });

      await sleep(10);

      const result: string[] = await manager.performCall(
        ["helloworld_00", "helloworld_01"],
        ["test"]
      );

      expect(result.length).to.eq(2);
    });
  });

  describe("RpcManager Communication", function () {
    let caller = new NopeRpcManager(
      {
        communicator: getLayer("event", "", false),
        logger: false,
      },
      () => new NopeObservable(),
      async () => "test",
      "caller"
    );

    beforeEach(() => {
      const communicator = getLayer("event", "", false);

      if (manager) {
        manager.dispose();
      }

      // Create a new Observer
      manager = new NopeRpcManager(
        {
          communicator,
          logger: false,
        },
        () => new NopeObservable(),
        async () => "test",
        "test"
      );

      if (caller) {
        caller.dispose();
      }

      caller = new NopeRpcManager(
        {
          communicator,
          logger: false,
        },
        () => new NopeObservable(),
        async () => "test",
        "caller"
      );
    });

    const helloworld = async (greetings: string) => {
      return "Hello " + greetings + "!";
    };

    const delay = async (greetings: string) => {
      await sleep(1000);
      return "Hello " + greetings + "!";
    };

    it("registering service - static id", async () => {
      await manager.ready.waitFor();
      await caller.ready.waitFor();

      await manager.registerService(helloworld, {
        id: "helloworld",
        schema: {
          description: "Hello World Service",
        },
      });

      await sleep(10);
      // Get the Services
      const services = caller.services.extractedKey;

      expect(caller.services.extractedKey).to.include("helloworld");
      assert(
        caller.services.amountOf.get("helloworld") == 1,
        "There should be one Provider for this service"
      );
      assert(
        caller.services.keyMappingReverse.get("helloworld").size == 1,
        "There should be one Provider for this service"
      );
      assert(
        caller.services.conflicts.size == 0,
        "There should be no conflict"
      );
      assert(caller.serviceExists("helloworld"), "Service should be known!");
      assert(
        caller.serviceExists("helloworld2") == false,
        "Service should not be known!"
      );
      assert(
        Array.from(caller.services.keyMappingReverse.get("helloworld"))[0] ==
          "test",
        "The Provider should be 'test'"
      );
    });

    it("registering service - dynamic id", async () => {
      await manager.ready.waitFor();
      await caller.ready.waitFor();

      const r = await manager.registerService(helloworld, {
        schema: {},
      });

      assert((r as any).id !== "helloworld", "There should be an dynamic id");

      await sleep(10);
      // Get the Services
      const services = caller.services.extractedKey;

      expect(services).to.include((r as any).id);
    });

    it("call service", async () => {
      await manager.ready.waitFor();
      await caller.ready.waitFor();

      await manager.registerService(helloworld, {
        id: "helloworld",
        schema: {
          description: "Hello World Service",
        },
      });

      await sleep(10);

      const result = await caller.performCall("helloworld", ["Mocha"]);
      expect(result).to.equal("Hello Mocha!", "result is not matching");
    });

    it("call service via methodInterface", async () => {
      await manager.ready.waitFor();
      await caller.ready.waitFor();

      await manager.registerService(helloworld, {
        id: "helloworld",
        schema: {
          description: "Hello World Service",
        },
      });

      await sleep(10);

      const result = await caller.methodInterface.helloworld("Mocha");
      expect(result).to.equal("Hello Mocha!", "result is not matching");
    });

    it("call service with a timeout", async () => {
      await manager.ready.waitFor();
      await caller.ready.waitFor();

      await manager.registerService(delay, {
        id: "helloworld",
        schema: {
          description: "Hello World Service",
        },
      });

      await sleep(10);

      const err = Error("Error not thrown");

      try {
        const result = await caller.methodInterfaceWithOptions.helloworld(
          {
            timeout: 50,
          },
          "Mocha"
        );
        throw err;
      } catch (e) {
        if (e == err) {
          throw err;
        }
      }
    });

    it("providing multiple providers", async () => {
      await manager.ready.waitFor();
      await caller.ready.waitFor();

      await manager.registerService(delay, {
        id: "helloworld",
        schema: {
          description: "Hello World Service",
        },
      });

      await caller.registerService(delay, {
        id: "helloworld",
        schema: {
          description: "Hello World Service",
        },
      });

      await sleep(10);

      expect(manager.services.extractedKey).to.include("helloworld");
      assert(
        manager.services.amountOf.get("helloworld") == 2,
        "There should be two Provider for this service"
      );
      assert(
        manager.services.keyMappingReverse.get("helloworld").size == 2,
        "There should be two Provider for this service"
      );
      assert(
        manager.services.conflicts.size == 0,
        "There should be no conflict"
      );
      assert(manager.serviceExists("helloworld"), "Service should be known!");
      assert(
        manager.serviceExists("helloworld2") == false,
        "Service should not be known!"
      );

      let providers = Array.from(
        manager.services.keyMappingReverse.get("helloworld")
      );

      assert(providers.includes("test"), "The Provider should be 'test'");
      assert(providers.includes("caller"), "The Provider should be 'test'");

      expect(caller.services.extractedKey).to.include("helloworld");
      assert(
        caller.services.amountOf.get("helloworld") == 2,
        "There should be two Provider for this service"
      );
      assert(
        caller.services.keyMappingReverse.get("helloworld").size == 2,
        "There should be two Provider for this service"
      );
      assert(
        caller.services.conflicts.size == 0,
        "There should be no conflict"
      );
      assert(caller.serviceExists("helloworld"), "Service should be known!");
      assert(
        caller.serviceExists("helloworld2") == false,
        "Service should not be known!"
      );

      providers = Array.from(
        caller.services.keyMappingReverse.get("helloworld")
      );

      assert(providers.includes("test"), "The Provider should be 'test'");
      assert(providers.includes("caller"), "The Provider should be 'test'");

      const err = Error("Error not thrown");

      try {
        const result = await caller.methodInterfaceWithOptions.helloworld(
          {
            timeout: 50,
          },
          "Mocha"
        );
        throw err;
      } catch (e) {
        if (e == err) {
          throw err;
        }
      }
    });
  });
});
