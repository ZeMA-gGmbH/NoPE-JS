/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { assert, expect } from "chai";
import { describe, it } from "mocha";
import {
  convertData,
  deepClone,
  flattenObject,
  rgetattr,
  rqueryAttr,
} from "./objectMethods";

describe("objectMethods", function () {
  // Describe the required Test:

  describe("deepClone", function () {
    it("clone number", function () {
      const data = 1;
      let clone = deepClone(data);

      clone = 2;
      assert.notDeepEqual(
        data,
        clone,
        "Elements have the same identity, but should be differend"
      );
    });
    it("clone string", function () {
      const data = "test";
      let clone = deepClone(data);

      clone = "fail";
      assert.notDeepEqual(
        data,
        clone,
        "Elements have the same identity, but should be differend"
      );
    });
    it("clone boolean", function () {
      const data = true;
      let clone = deepClone(data);

      clone = false;
      assert.notDeepEqual(
        data,
        clone,
        "Elements have the same identity, but should be differend"
      );
    });
    it("clone null", function () {
      const data = null;
      let clone: any = deepClone(data);

      clone = false;
      assert.notDeepEqual(
        data,
        clone,
        "Elements have the same identity, but should be differend"
      );
    });
    it("clone undefined", function () {
      const data = undefined;
      let clone: any = deepClone(data);

      clone = false;
      assert.notDeepEqual(
        data,
        clone,
        "Elements have the same identity, but should be differend"
      );
    });
    it("clone array", function () {
      const data = [0, 1, 2];
      const clone = deepClone(data);

      assert.notStrictEqual(
        data,
        clone,
        "Elements have the same identity, but should be differend"
      );
      clone.pop();
      assert.notDeepEqual(
        data,
        clone,
        "Elements have the same identity, but should be differend"
      );
    });
    it("clone nested object", function () {
      const data = { deep: { nested: "test" } };
      const clone = deepClone(data);

      assert.notStrictEqual(
        data,
        clone,
        "Elements have the same identity, but should be differend"
      );
      clone.deep.nested = "changed";
      assert.notDeepEqual(
        data,
        clone,
        "Elements have the same identity, but should be differend"
      );
    });
  });

  describe("flattenObject", function () {
    it("convert", function () {
      const data = { deep: { nested: "test" } };
      const result = flattenObject(data);
      assert.isTrue(result.has("deep/nested"), "Key is missing");
      expect(result.get("deep/nested")).to.equal("test");
    });
    it("limit the depth to 1", function () {
      const data = { deep: { nested: "test" } };
      let result = flattenObject(data, {
        maxDepth: 1,
        onlyPathToSimpleValue: false,
      });
      assert.isTrue(result.has("deep"), "Key is missing");
      assert.isFalse(
        result.has("deep/nested"),
        "Key is present, which should not be the case"
      );
      assert.deepEqual(
        result.get("deep"),
        { nested: "test" },
        "Object are not matching"
      );

      result = flattenObject(data, {
        maxDepth: 1,
        onlyPathToSimpleValue: true,
      });
      expect(result.size).be.equal(0);
    });
    it("adding a prefix", function () {
      const data = { deep: { nested: "test" } };
      const result = flattenObject(data, {
        prefix: "test",
      });
      assert.isTrue(result.has("test/deep/nested"), "Key is missing");
      assert.deepEqual(
        result.get("test/deep/nested"),
        "test",
        "Object are not matching"
      );
    });
  });

  describe("rgettattr", function () {
    it("pull empty data", function () {
      let data = {};
      let result = rgetattr(data, "test", "default");
      assert.isTrue(
        result === "default",
        "we expected 'default' but got: " + result.toString()
      );

      result = rgetattr(data, "test", null);
      assert.isTrue(result === null, "we expected 'null' but got: " + result);
    });

    it("pull data", function () {
      let data = { deep: { nested: "test" } };
      let result = rgetattr(data, "deep/nested", null);
      assert.isTrue(result === "test", "we expected 'test' but got: " + result);
    });
  });

  describe("rgettattrQuery", function () {
    it("query empty data", function () {
      let data = {};
      let result = rqueryAttr(data, "test/+");
      assert.isTrue(
        result.length === 0,
        "we expected 0 entries but got: " + result.length.toString()
      );
    });

    it("query data - single", function () {
      let data = { deep: { nested: "test" } };
      let result = rqueryAttr(data, "deep/nested");
      assert.isTrue(
        result.length === 1,
        "we expected 1 entries but got: " + result.length.toString()
      );
      assert.isTrue(
        result[0].path === "deep/nested",
        "we expected the path to be 'deep/nested', but got" + result[0].path
      );
      assert.isTrue(
        result[0].data === "test",
        "we expected the data to be 'test', but got" + result[0].data
      );
    });

    it("query data - singlelevel-wildcard", function () {
      let data = {
        deep: { nested_01: { nested_02: "test_01" }, nested_03: "test_02" },
        not: { nested: "hello" },
      };
      let result = rqueryAttr(data, "deep/+");
      assert.isTrue(
        result.length === 2,
        "we expected 2 entries but got: " + result.length.toString()
      );
      const pathes = result.map((item) => item.path);
      assert.isTrue(
        pathes.includes("deep/nested_01") && pathes.includes("deep/nested_03"),
        `we expected the "deep/nested_01" and "deep/nested_03" have been found, but got` +
          pathes.toString()
      );
    });

    it("query data-array - singlelevel-wildcard", function () {
      let data = {
        array: [
          {
            data: 0,
          },
          {
            data: 1,
          },
        ],
        not: { nested: "hello" },
      };
      let result = rqueryAttr(data, "array/+/data");
      assert.isTrue(
        result.length === 2,
        "we expected 2 entries but got: " + result.length.toString()
      );
      const items = result.map((item) => item.data);
      assert.isTrue(
        items.includes(1) && items.includes(0),
        `we expected the data contains "0" and "1", but got` + items.toString()
      );
    });

    it("query data - multilevel-wildcard", function () {
      let data = {
        deep: { nested_01: { nested_02: "test_01" }, nested_03: "test_02" },
        not: { nested: "hello" },
      };

      let result = rqueryAttr(data, "deep/#");
      const pathes = result.map((item) => item.path);
      assert.isTrue(
        result.length === 3,
        "we expected 3 entries but got: " + pathes.toString()
      );
      assert.isTrue(
        pathes.includes("deep/nested_01") &&
          pathes.includes("deep/nested_01/nested_02") &&
          pathes.includes("deep/nested_03"),
        `we expected the "deep/nested_01" and "deep/nested_01/nested_02" and "deep/nested_03" have been found, but got` +
          pathes.toString()
      );
    });
  });

  describe("convertData", function () {
    it("query empty data", function () {
      let data = {};
      let result = convertData(data, [
        {
          key: "result",
          query: "a/b",
        },
      ]);
      assert.isTrue(
        result.length === 0,
        "we expected 0 entries but got: " +
          result.length.toString() +
          "\n" +
          JSON.stringify(result)
      );
    });

    it("query data - single", function () {
      let data = { deep: { nested: "test" } };
      let result = convertData<{ result: string }>(data, [
        {
          key: "result",
          query: "deep/nested",
        },
      ]);
      assert.isTrue(
        result.length === 1,
        "we expected 1 entries but got: " +
          result.length.toString() +
          "\n" +
          JSON.stringify(result)
      );
      assert.isTrue(
        result[0].result === "test",
        "we expected the path to be 'test', but got" +
          result[0] +
          "\n" +
          JSON.stringify(result)
      );
    });

    it("query data - singlelevel-wildcard", function () {
      let data = { deep: { nested: "test" } };
      let result = convertData<{ result: string }>(data, [
        {
          key: "result",
          query: "deep/+",
        },
      ]);
      assert.isTrue(
        result.length === 1,
        "we expected 1 entries but got: " +
          result.length.toString() +
          "\n" +
          JSON.stringify(result)
      );
      assert.isTrue(
        result[0].result === "test",
        "we expected the path to be 'test', but got" +
          result[0] +
          "\n" +
          JSON.stringify(result)
      );
    });

    it("query data-array - singlelevel-wildcard", function () {
      let data = {
        array: [
          {
            data1: 0,
            data2: "a",
          },
          {
            data1: 1,
            data2: "a",
          },
        ],
        not: { nested: "hello" },
      };
      let result = convertData<{ a: number; b: string }>(data, [
        {
          key: "a",
          query: "array/+/data1",
        },
        {
          key: "b",
          query: "array/+/data2",
        },
      ]);
      assert.isTrue(
        result.length === 2,
        "we expected 2 entries but got: " +
          result.length.toString() +
          "\n" +
          JSON.stringify(result)
      );
      const items = result.map((item) => item.a);
      assert.isTrue(
        items.includes(1) && items.includes(0),
        `we expected the data contains "0" and "1", but got` +
          items.toString() +
          "\n" +
          JSON.stringify(result)
      );
    });
    it("query data-array - test exception", function () {
      let data = {
        array: [
          {
            data1: 0,
            data2: "a",
          },
          {
            data1: 1,
            data2: "a",
          },
        ],
        not: { nested: "hello" },
      };
      try {
        let result = convertData<{ a: number; b: string }>(data, [
          {
            key: "a",
            query: "array/+/data1",
          },
          {
            key: "b",
            query: "array/+/data2",
          },
        ]);
        assert.isTrue(false, "Failed to raise exception");
      } catch (e) {}
    });
  });
});
