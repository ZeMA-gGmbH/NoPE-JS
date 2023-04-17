/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { assert } from "chai";
import { describe, it } from "mocha";
import { getLeastCommonPathSegment } from "./path";

describe("path", function () {
  // Describe the required Test:

  describe("getLeastCommonPathSegment", function () {
    it("equal pathes", function () {
      assert.equal(
        "a/b",
        getLeastCommonPathSegment(["a/b", "a/b"]),
        `getLeastCommonPathSegment(["a/b", "a/b"])`
      );

      assert.equal(
        "a/b",
        getLeastCommonPathSegment(["a/b", "a/b/c"]),
        `getLeastCommonPathSegment("a/b", "a/b/c")`
      );

      assert.equal(
        "a/b",
        getLeastCommonPathSegment(["a/b/c", "a/b", "a/b/d"]),
        `getLeastCommonPathSegment("a/b/c", "a/b")`
      );

      assert.equal(
        "a",
        getLeastCommonPathSegment(["a/b", "a/+"]),
        `getLeastCommonPathSegment(["a/b", "a/+"])`
      );

      assert.isFalse(
        getLeastCommonPathSegment(["c/a", "a/+"]),
        "Pathes should be different"
      );
    });

    it("equal pathes - singlelevel", function () {
      assert.equal(
        "a/b",
        getLeastCommonPathSegment(["a/b", "a/b"], {
          considerSingleLevel: true,
        }),
        `getLeastCommonPathSegment(["a/b", "a/b"], { considerSingleLevel: true })`
      );

      assert.equal(
        "a/b",
        getLeastCommonPathSegment(["a/b", "a/+"], {
          considerSingleLevel: true,
        }),

        `getLeastCommonPathSegment(["a/b", "a/+"], { considerSingleLevel: true })`
      );

      assert.equal(
        "a/b/c",
        getLeastCommonPathSegment(["a/b/c", "a/+/c"], {
          considerSingleLevel: true,
        }),

        `getLeastCommonPathSegment(["a/b/c", "a/+/c"], { considerSingleLevel: true })`
      );

      assert.equal(
        "a/b/c",
        getLeastCommonPathSegment(["+/b/c", "a/+/c"], {
          considerSingleLevel: true,
        }),

        `getLeastCommonPathSegment(["+/b/c", "a/+/c"], { considerSingleLevel: true })`
      );

      assert.equal(
        "a/b/c",
        getLeastCommonPathSegment(["+/+/+", "a/b/c"], {
          considerSingleLevel: true,
        }),
        `getLeastCommonPathSegment("+/+/+", "a/b/c", { considerSingleLevel: true })`
      );

      assert.equal(
        "a/b/c",
        getLeastCommonPathSegment(["+/b/+", "a/+/c"], {
          considerSingleLevel: true,
        }),
        `getLeastCommonPathSegment(["+/b/+", "a/+/c"], { considerSingleLevel: true })`
      );

      assert.equal(
        "a/+/c",
        getLeastCommonPathSegment(["+/+/+", "a/+/c"], {
          considerSingleLevel: true,
        }),
        `getLeastCommonPathSegment(["+/+/+", "a/+/c"], { considerSingleLevel: true })`
      );
    });

    it("equal pathes - multilevel", function () {
      assert.equal(
        "a/b",
        getLeastCommonPathSegment(["a/b", "a/b"], { considerMultiLevel: true }),
        `getLeastCommonPathSegment(["a/b", "a/b"], { considerMultiLevel: true }) == false`
      );

      assert.equal(
        "a",
        getLeastCommonPathSegment(["a/b", "a/+"], { considerMultiLevel: true }),
        `getLeastCommonPathSegment(["a/b", "a/+"], { considerMultiLevel: true })`
      );

      assert.equal(
        "a",
        getLeastCommonPathSegment(["a/b/c", "a/+/c"], {
          considerMultiLevel: true,
        }),
        `getLeastCommonPathSegment(["a/b/c", "a/+/c"], { considerMultiLevel: true })`
      );

      assert.equal(
        false as any,
        getLeastCommonPathSegment(["+/b/c", "a/+/c"], {
          considerMultiLevel: true,
        }),
        `getLeastCommonPathSegment(["+/b/c", "a/+/c"], { considerMultiLevel: true })`
      );

      assert.equal(
        false as any,
        getLeastCommonPathSegment(["+/+/+", "a/b/c"], {
          considerMultiLevel: true,
        }),
        `getLeastCommonPathSegment(["+/+/+", "a/b/c"], { considerMultiLevel: true })`
      );

      assert.equal(
        false as any,
        getLeastCommonPathSegment(["+/b/+", "a/+/c"], {
          considerMultiLevel: true,
        }),

        `getLeastCommonPathSegment(["+/b/+", "a/+/c"], { considerMultiLevel: true })`
      );

      assert.equal(
        "a/b/c",
        getLeastCommonPathSegment(["#", "a/b/c"], {
          considerMultiLevel: true,
        }),
        `getLeastCommonPathSegment(["#", "a/b/c"], { considerMultiLevel: true })`
      );

      assert.equal(
        "a/b/c",
        getLeastCommonPathSegment(["a/#", "a/b/c"], {
          considerMultiLevel: true,
        }),
        `getLeastCommonPathSegment(["a/#", "a/b/c"], { considerMultiLevel: true })`
      );

      assert.equal(
        "a/b",
        getLeastCommonPathSegment(["a/#", "a/b", "a/b/c"], {
          considerMultiLevel: true,
        }),
        `getLeastCommonPathSegment(["a/#", "a/b"], { considerMultiLevel: true })`
      );
    });
  });
});
