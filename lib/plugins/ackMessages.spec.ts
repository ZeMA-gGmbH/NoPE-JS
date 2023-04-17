import "reflect-metadata";
import { describe, it } from "mocha";

describe("Plugins", function () {
  // Describe the required Test:
  describe("AckMessage", function () {
    // Adapt the Test Time
    this.timeout(4000);
    it("by-name", async function () {
      delete require.cache[require.resolve("../index.nodejs")];
      const nope = require("../index.nodejs");
      nope.plugins.installPlugins(nope as any, "ackMessages", false);

      const loader = await nope.runNopeBackend({
        skipLoadingConfig: true,
        log: "error",
      });

      await loader.dispatcher.ready.waitFor();
      const err = Error("This should not be raised!");
      try {
        await loader.dispatcher.communicator.emit(
          "hello",
          { data: "test" },
          "wont be there",
          1000
        );
        throw err;
      } catch (e) {
        if (e === err) {
          delete require.cache[require.resolve("../index.nodejs")];
          throw err;
        }
      }
      await loader.dispatcher.dispose();

      delete require.cache[require.resolve("../index.nodejs")];
    });
  });
});
