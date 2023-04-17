/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2022-01-05 17:50:44
 * @modify date 2022-01-05 17:50:44
 * @desc [description]
 */

import { expect, assert } from "chai";
import { describe, it } from "mocha";
import "reflect-metadata";
import { getLayer } from "../../communication/getLayer.nodejs";
import { exportAsNopeService, nopeMethod } from "../../decorators";
import { NopeEventEmitter } from "../../eventEmitter";
import { sleep } from "../../helpers/async";
import { NopeBaseModule } from "../../module";
import { NopeObservable } from "../../observables/nopeObservable";
import { NopeInstanceManager } from "./InstanceManager";

describe("NopeInstanceManager", function () {
  // Describe the required Test:
  let manager: NopeInstanceManager;
  manager = new NopeInstanceManager(
    {
      communicator: getLayer("event", "", false),
      logger: false,
    },
    () => new NopeEventEmitter(),
    () => new NopeObservable(),
    async () => "test",
    "test",
    undefined,
    undefined,
    manager as any
  );

  it("registering instance", async () => {
    let called = false;
    let calledService = false;

    class TestModule extends NopeBaseModule {
      // We can not provide a service.
      // @nopeMethod({
      //   id: "service",
      //   schema: {},
      // })
      // public async service() {
      //   calledService = true;
      //   return "called";
      // }

      public async dispose(): Promise<void> {
        await super.dispose();
        called = true;
      }

      public async init(p1: string, p2: string): Promise<void> {
        this.author = {
          forename: "test",
          surename: "test",
          mail: "test",
        };
        this.version = {
          date: new Date(),
          version: 1,
        };
        this.description = "test";

        assert(p1 == "p1" && p2 == "p2", "parameters where matched wrong");
        await super.init();
      }
    }

    await manager.ready.waitFor();

    // Now we register the Service
    await manager.registerConstructor(
      "TestModule",
      async (core, identifier) => {
        assert(
          identifier === "instance",
          "The identifier has not been transmitted"
        );
        return new TestModule(core);
      }
    );

    await sleep(10);

    // Check the Constructors
    const constructors = manager.constructors.extractedKey;
    expect(constructors).to.include("TestModule");
    assert(
      manager.constructors.amountOf.get("TestModule") == 1,
      "There should be one Provider for this constructor"
    );
    assert(
      manager.constructors.keyMappingReverse.get("TestModule").size == 1,
      "There should be one Provider for this constructor"
    );
    assert(
      manager.constructors.conflicts.size == 0,
      "There should be no conflict"
    );
    assert(
      manager.constructorExists("TestModule"),
      "Constructor should be known!"
    );
    assert(
      manager.constructorExists("unkown") == false,
      "Constructor should not be known!"
    );
    assert(
      Array.from(manager.constructors.keyMappingReverse.get("TestModule"))[0] ==
        "test",
      "The Provider should be 'test'"
    );

    const instance = await manager.createInstance<TestModule>({
      identifier: "instance",
      type: "TestModule",
      params: ["p1", "p2"],
    });

    assert(
      manager.instanceExists("instance", false) == true,
      "The instance should be known!"
    );
    assert(
      manager.instanceExists("instance", true) == false,
      "No external manager is present!"
    );
    assert(
      manager.internalInstances.getContent().includes("instance"),
      "The instance should be listed as internal instance."
    );
    assert(
      Array.from(manager.instances.keyMappingReverse.get("instance"))[0] ==
        "test",
      "The Provider should be 'test'"
    );

    // Now test the instance wrapper
    // assert(
    //   (await instance.service()) === "called",
    //   "The result should be called"
    // );
    // assert(calledService, "The service flag should be different now.");
    assert(
      (await instance.listEvents()).length === 0,
      "No event has been defined"
    );
    assert(
      (await instance.listProperties()).length === 0,
      "No property has been defined"
    );
    assert(
      (await instance.listMethods()).length === 0,
      "No Method should be known"
    );
    assert(
      Object.keys(instance.dynamicInstanceMethods).length === 0,
      "No Method should be known"
    );
    assert(
      Object.keys(instance.methods).length === 0,
      "No Method should be known"
    );

    await instance.dispose();

    await sleep(100);

    assert(
      !manager.instances.amountOf.has("instance"),
      "The Provider should be 'test'"
    );
  });
});
