/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { assert, expect } from "chai";
import { describe, it } from "mocha";
import { extractUniqueValues } from "./mapMethods";

describe("mapMethods", function () {
  // Describe the required Test:

  describe("extractUniqueValues", function () {
    it("simple-map", function () {
      const m = new Map<string, string>();
      m.set("a", "b");
      m.set("b", "b");

      const result = extractUniqueValues(m);
      assert.isTrue(
        result.size === 1,
        "Elements have the same identity, but should be differend"
      );
      assert.isTrue([...result][0] === "b", "Element is element");
    });
    it("nested-map", function () {
      const m = new Map<string, { a: string }>();
      m.set("a", { a: "b" });
      m.set("b", { a: "b" });
      const result = extractUniqueValues(m, "a");

      assert.isTrue(
        result.size === 1,
        "Elements have the same identity, but should be differend"
      );
      assert.isTrue([...result][0] === "b", "Element is element");
    });
    it("nested-array", function () {
      const m = new Map<string, { a?: string[]; b?: string[] }>();
      m.set("a", { a: ["b"] });
      m.set("b", { a: ["b"] });
      m.set("b", { b: ["b"] });
      m.set("b", { a: ["c"] });
      const result = extractUniqueValues<string>(m, "a/+");

      assert.isTrue(
        result.size === 2,
        "Elements have the same identity, but should be differend"
      );
      const r = [...result].sort();
      assert.isTrue(r[0] === "b", "Element is element");
    });
    it("flat-array", function () {
      const m = new Map<string, string[]>();
      m.set("a", ["a"]);
      m.set("b", ["a", "b"]);
      const result = extractUniqueValues(m, "+");
      expect(result.size).to.equal(2);
      assert.isTrue(
        result.size === 2,
        "The Element should include 2 elements. namely 'a' and 'b'"
      );
      assert.isArray([...result], "Should be an array");
      expect([...result]).to.contain("a");
      expect([...result]).to.contain("b");
    });
    it("nested-array multiple elements", function () {
      const m = new Map<string, { a: string[] }>();
      m.set("a", { a: ["b"] });
      m.set("b", { a: ["c", "d"] });
      const result = extractUniqueValues(m, "a/+");

      assert.isTrue(
        result.size === 3,
        "Elements have the same identity, but should be differend"
      );
      assert.deepEqual(["b", "c", "d"], [...result], "Items are missing");
    });
    it("nested-object, different key", function () {
      const m = new Map<
        string,
        {
          a: {
            id: number;
            content: string;
          }[];
        }
      >();
      m.set("a", {
        a: [
          {
            content: "a",
            id: 1,
          },
          {
            content: "b",
            id: 2,
          },
        ],
      });
      m.set("b", {
        a: [
          {
            content: "c",
            id: 1,
          },
          {
            content: "d",
            id: 3,
          },
        ],
      });
      const result = extractUniqueValues<{
        id: number;
        content: string;
      }>(m, "a/+/content", "a/+/id");

      assert.isTrue(
        result.size === 3,
        "Elements have the same identity, but should be differend"
      );
      assert.deepEqual(["a", "b", "d"], [...result], "Items are missing");
    });
  });
});
