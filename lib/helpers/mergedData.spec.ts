/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { assert, expect } from "chai";
import { describe, it } from "mocha";
import { extractUniqueValues } from "./mapMethods";
import { MapBasedMergeData, MergeData } from "./mergedData";

describe("mergedData", function () {
  // Describe the required Test:
  it("data subscription", function (done) {
    const m = new Map<string, string>();
    const d = new MergeData(m, (m) => extractUniqueValues(m));
    m.set("a", "b");
    m.set("b", "b");

    d.update();

    d.data.subscribe((result) => {
      assert.isTrue(
        result.length === 1,
        "Exactly one element different data has been added"
      );
      assert.isTrue([...result][0] === "b", "Element is element");
      done();
    });
  });

  it("data subscription. Update called twice", function (done) {
    const m = new Map<string, string>();
    const d = new MergeData(m, (m) => extractUniqueValues(m));
    m.set("a", "b");
    m.set("b", "b");
    d.update(m);
    d.data.subscribe((result) => {
      assert.isTrue(
        result.length === 1,
        "Exactly one element different data has been added"
      );
      assert.isTrue([...result][0] === "b", "Element is element");
      done();
    });
    d.update(m);
  });

  it("onchange subscription: added", function (done) {
    const m = new Map<string, string>();
    const d = new MergeData(m, (m) => extractUniqueValues(m));
    m.set("a", "b");
    m.set("b", "b");

    d.onChange.subscribe((result) => {
      assert.isTrue(
        result.added.length === 1,
        "Exactly one element has been added"
      );
      assert.isTrue([...result.added][0] === "b", "Element is element");
      done();
    });

    d.update(m);
  });

  it("onchange subscription: removed", function (done) {
    const m = new Map<string, string>();
    const d = new MergeData(m, (m) => extractUniqueValues(m));
    m.set("a", "b");
    m.set("b", "b");

    d.onChange.subscribe((result) => {
      assert.isTrue(
        result.removed.length === 0,
        "No element has been removed!"
      );
      done();
    });

    d.update(m);
  });
});

describe("MapBasedMergeData", function () {
  // Describe the required Test:
  it("data handeling - flat data", function (done) {
    const m = new Map<string, string>();
    const d = new MapBasedMergeData(m);
    m.set("a", "b");
    m.set("b", "b");

    d.update();

    expect([...d.keyMappingReverse.keys()]).contains("b");

    done();
  });

  it("data handeling - multiple data array", function (done) {
    const m = new Map<string, string[]>();
    const d = new MapBasedMergeData(m, "+");
    m.set("a", ["a", "b"]);
    m.set("b", ["c", "b"]);

    d.update();

    expect([...d.keyMappingReverse.keys()]).contains("b");

    done();
  });

  // Describe the required Test:
  it("data subscription - simple data", function (done) {
    const m = new Map<string, string>();
    const d = new MapBasedMergeData(m);
    m.set("a", "b");
    m.set("b", "b");

    d.update();

    d.data.subscribe((result) => {
      assert.isTrue(
        result.length === 1,
        "Exactly one element different data has been added"
      );
      assert.isTrue([...result][0] === "b", "Element is element");
      done();
    });
  });

  it("data subscription - array data", function (done) {
    const m = new Map<string, string[]>();
    const d = new MapBasedMergeData(m, "+");
    m.set("a", ["a", "b"]);
    m.set("b", ["c", "b"]);

    d.update();

    d.data.subscribe((result) => {
      assert.isTrue(
        result.length === 3,
        "The Element contains 3 different items."
      );

      expect([...result]).to.contain("a");
      expect([...result]).to.contain("b");
      expect([...result]).to.contain("c");
      done();
    });
  });

  it("data subscription - nested data", function (done) {
    const m = new Map<string, { key: string; data: string }>();
    const d_1 = new MapBasedMergeData<
      string,
      { key: string; data: string },
      string,
      { key: string; data: string }
    >(m, "", "key");
    m.set("a", { key: "keyA", data: "dataA" });
    m.set("b", { key: "keyB", data: "dataB" });

    d_1.update();

    assert.isTrue(
      d_1.amountOf.size === 2,
      "The Element contains 3 different items."
    );

    expect([...d_1.keyMapping.keys()]).to.contain("a");
    expect([...d_1.keyMappingReverse.keys()]).to.contain("keyA");
    expect([...d_1.simplified.keys()]).to.contain("keyA");

    const d_2 = new MapBasedMergeData<
      string,
      { key: string; data: string },
      string,
      string
    >(m, "data", "key");
    d_2.update();

    expect([...d_2.keyMapping.keys()]).to.contain("a");
    expect([...d_2.keyMappingReverse.keys()]).to.contain("keyA");
    expect([...d_2.simplified.keys()]).to.contain("keyA");

    done();
  });

  // it("data subscription - nested data array", function (done) {
  //   const m = new Map<string, { key: string; data: string }[]>();
  //   const d_1 = new MapBasedMergeData<
  //     string,
  //     { key: string; data: string }[],
  //     string,
  //     { key: string; data: string }
  //   >(m, "", "key");
  //   m.set("a", [
  //     { key: "keyA", data: "dataA" },
  //     { key: "keyB", data: "dataB" },
  //   ]);
  //   m.set("b", [{ key: "keyC", data: "dataC" }]);

  //   d_1.update();

  //   assert.isTrue(
  //     d_1.amountOf.size === 2,
  //     "The Element contains 3 different items."
  //   );

  //   expect([...d_1.keyMapping.keys()]).to.contain("a");
  //   expect([...d_1.keyMappingReverse.keys()]).to.contain("keyA");
  //   expect([...d_1.simplified.keys()]).to.contain("keyA");
  //   expect([...d_1.keyMappingReverse.values()]).to.contain("keyA");

  //   const d_2 = new MapBasedMergeData<
  //     string,
  //     { key: string; data: string },
  //     string,
  //     string
  //   >(m, "data", "key");
  //   d_2.update();

  //   expect([...d_1.keyMapping.keys()]).to.contain("a");
  //   expect([...d_1.keyMappingReverse.keys()]).to.contain("keyA");
  //   expect([...d_1.simplified.keys()]).to.contain("keyA");
  //   expect([...d_1.keyMappingReverse.keys()]).to.contain("dataB");

  //   done();
  // });

  it("data subscription. Update called twice", function (done) {
    const m = new Map<string, string>();
    const d = new MapBasedMergeData(m);
    m.set("a", "b");
    m.set("b", "b");
    d.update(m);
    d.data.subscribe((result) => {
      assert.isTrue(
        result.length === 1,
        "Exactly one element different data has been added"
      );
      assert.isTrue([...result][0] === "b", "Element is element");
      done();
    });
    d.update(m);
  });

  it("onchange subscription: added", function (done) {
    const m = new Map<string, string>();
    const d = new MapBasedMergeData(m);
    m.set("a", "b");
    m.set("b", "b");

    d.onChange.subscribe((result) => {
      assert.isTrue(
        result.added.length === 1,
        "Exactly one element has been added"
      );
      assert.isTrue([...result.added][0] === "b", "Element is element");
      done();
    });

    d.update(m);
  });

  it("onchange subscription: removed", function (done) {
    const m = new Map<string, string>();
    const d = new MapBasedMergeData(m);
    m.set("a", "b");
    m.set("b", "b");

    d.onChange.subscribe((result) => {
      assert.isTrue(
        result.removed.length === 0,
        "No element has been removed!"
      );
      done();
    });

    d.update(m);
  });
});
