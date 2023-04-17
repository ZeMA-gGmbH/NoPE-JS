import "reflect-metadata";
import { assert } from "chai";
import { describe, it } from "mocha";
import { availablePlugins } from "./index";
import { allPlugins, installPlugins, plugin } from "./plugin";

describe("PluginSystem", function () {
  // Describe the required Test:

  it("List Plugins", function () {
    assert(allPlugins().length == 3, "There Should be to Plugins");
  });
  describe("load single Plugins", function () {
    it("by-name", function () {
      delete require.cache[require.resolve("../index.nodejs")];
      const nope = require("../index.nodejs");
      installPlugins(nope, "hello", false);
      delete require.cache[require.resolve("../index.nodejs")];
    });
    it("by-path", function () {
      delete require.cache[require.resolve("../index.nodejs")];
      const nope = require("../index.nodejs");
      installPlugins(nope, "plugins.availablePlugins.hello", false);
      delete require.cache[require.resolve("../index.nodejs")];
    });
    it("by-plugin", function () {
      delete require.cache[require.resolve("../index.nodejs")];
      const nope = require("../index.nodejs");
      installPlugins(nope, availablePlugins.hello, false);
      delete require.cache[require.resolve("../index.nodejs")];
    });
    it("dynamic-plugin", function () {
      delete require.cache[require.resolve("../index.nodejs")];
      const nope = require("../index.nodejs");
      const extend = plugin("generateId", (org) => {
        return [
          {
            adapted: (...args) => {
              return org(...args);
            },
            name: "generateId",
            path: "generateId",
          },
        ];
      });
      installPlugins(nope, extend, false);
      delete require.cache[require.resolve("../index.nodejs")];
    });
  });
  describe("load single Plugins", function () {
    it("single-list-item", function () {
      delete require.cache[require.resolve("../index.nodejs")];
      const nope = require("../index.nodejs");
      installPlugins(nope, ["hello"], false);
      delete require.cache[require.resolve("../index.nodejs")];
    });
    it("by-path", function () {
      delete require.cache[require.resolve("../index.nodejs")];
      const nope = require("../index.nodejs");
      installPlugins(
        nope,
        ["hello", "plugins.availablePlugins.hello", availablePlugins.hello],
        false
      );
      delete require.cache[require.resolve("../index.nodejs")];
    });
  });
});
