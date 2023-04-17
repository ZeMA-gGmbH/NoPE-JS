import "reflect-metadata";
import { describe, it } from "mocha";
import { assert } from "chai";
import { sleep } from "../helpers/index.browser";
import { INopePackageLoader } from "../types";
import { INopeRpcManagerWithCallback } from "./rpcWithCallbacks";

describe("Plugins", function () {
  // Describe the required Test:
  describe("rpcCallbacks", function () {
    it("callback", async function () {
      // Adapt the Test Time
      this.timeout(4000);
      delete require.cache[require.resolve("../index.nodejs")];
      const nope = require("../index.nodejs");
      nope.plugins.installPlugins(nope as any, "rpcCallbacks", false);

      const loader: INopePackageLoader = await nope.runNopeBackend({
        skipLoadingConfig: true,
        log: "error",
      });

      await loader.dispatcher.ready.waitFor();
      try {
        let called = 0;

        async function funcWithCallback(
          param01: number,
          cb: (param: number) => Promise<number>
        ) {
          called++;
          return await cb(param01);
        }

        await loader.dispatcher.rpcManager.registerService(funcWithCallback, {
          id: "funcWithCallback",
          schema: {},
        });

        const res = await loader.dispatcher.rpcManager.performCall(
          "funcWithCallback",
          [
            0,
            async (param: number) => {
              called++;
              return param;
            },
          ]
        );

        assert(res === 0, "Value should be 0");
        assert(called === 2, "Value should be called twice.");
        assert(
          loader.dispatcher.rpcManager.services.data.getContent().length === 2
        );
      } catch (e) {
        throw e;
      }
      await loader.dispatcher.dispose();

      delete require.cache[require.resolve("../index.nodejs")];
    });
    it("delete-afterwards", async function () {
      // Adapt the Test Time
      this.timeout(4000);

      delete require.cache[require.resolve("../index.nodejs")];
      const nope = require("../index.nodejs");
      nope.plugins.installPlugins(nope as any, "rpcCallbacks", false);

      const loader: INopePackageLoader = await nope.runNopeBackend({
        skipLoadingConfig: true,
        log: "error",
      });

      await loader.dispatcher.ready.waitFor();
      try {
        let called = 0;

        async function funcWithCallback(
          param01: number,
          cb: (param: number) => Promise<number>
        ) {
          called++;
          return await cb(param01);
        }

        await loader.dispatcher.rpcManager.registerService(funcWithCallback, {
          id: "funcWithCallback",
          schema: {},
        });

        const res = await (
          loader.dispatcher.rpcManager as INopeRpcManagerWithCallback
        ).performCall(
          "funcWithCallback",
          [
            0,
            async (param: number) => {
              called++;
              return param;
            },
          ],
          {
            calledOnce: [1],
          }
        );

        assert(res === 0, "Value should be 0");
        assert(called === 2, "Value should be called twice.");
        assert(
          loader.dispatcher.rpcManager.services.data.getContent().length === 1
        );
      } catch (e) {
        throw e;
      }
      await loader.dispatcher.dispose();

      delete require.cache[require.resolve("../index.nodejs")];
    });
    it("auto-delete", async function () {
      // Adapt the Test Time
      this.timeout(4000);

      delete require.cache[require.resolve("../index.nodejs")];
      const nope = require("../index.nodejs");
      nope.plugins.installPlugins(nope as any, "rpcCallbacks", false);

      const loader: INopePackageLoader = await nope.runNopeBackend({
        skipLoadingConfig: true,
        log: "error",
      });

      await loader.dispatcher.ready.waitFor();
      try {
        let called = 0;

        async function funcWithCallback(
          param01: number,
          cb: (param: number) => Promise<number>
        ) {
          called++;
          return await cb(param01);
        }

        await loader.dispatcher.rpcManager.registerService(funcWithCallback, {
          id: "funcWithCallback",
          schema: {},
        });

        const res = await (
          loader.dispatcher.rpcManager as INopeRpcManagerWithCallback
        ).performCall(
          "funcWithCallback",
          [
            0,
            async (param: number) => {
              called++;
              return param;
            },
          ],
          {
            timeToLifeAfterCall: 100,
          }
        );

        assert(res === 0, "Value should be 0");
        assert(called === 2, "Value should be called twice.");
        assert(
          loader.dispatcher.rpcManager.services.data.getContent().length === 2
        );
        await sleep(200);
        assert(
          loader.dispatcher.rpcManager.services.data.getContent().length === 1
        );
      } catch (e) {
        throw e;
      }
      await loader.dispatcher.dispose();

      delete require.cache[require.resolve("../index.nodejs")];
    });
  });
});
