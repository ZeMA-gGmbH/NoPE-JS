/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { assert, expect } from "chai";
import { describe, it } from "mocha";
import {
  comparePatternAndPath,
  containsWildcards,
  generateResult,
  patternIsValid,
  TPathCompareResult,
} from "./pathMatchingMethods";

describe("pathMatchingMethods", function () {
  // Describe the required Test:

  describe("comparePatternAndPath", function () {
    describe("pattern test", function () {
      const functionTests: {
        // Name of the Test
        desc: string;
        args?: [];
        path: string;
        pattern: string;
        expectedResult: TPathCompareResult;
      }[] = [
        {
          desc: "simple matching topics",
          pattern: "test",
          path: "test",
          expectedResult: generateResult({
            pathToExtractData: "test",
            affectedOnSameLevel: true,
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "topics should match",
          pattern: "test1",
          path: "test2",
          expectedResult: generateResult({
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "simple root topic compare topics",
          pattern: "test",
          path: "",
          expectedResult: generateResult({
            pathToExtractData: "test",
            affectedByParent: true,
            patternLengthComparedToPathLength: ">",
          }),
        },
        {
          desc: "match with multilevel wildcard",
          pattern: "test/#",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedByChild: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "<",
          }),
        },
        {
          desc: "match with multilevel wildcard and same length",
          pattern: "test/test/#",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedOnSameLevel: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "match with singlelevel wildcard",
          pattern: "test/+/test",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedOnSameLevel: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "match with singlelevel wildcard as first element in pattern",
          pattern: "+/test/test",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedOnSameLevel: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "match with singlelevel wildcard as last element in pattern",
          pattern: "test/test/+",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedOnSameLevel: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "match with multiple singlelevel wildcards in pattern",
          pattern: "test/+/+",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedOnSameLevel: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "match with singlelevel and multilevel wildcard in pattern",
          pattern: "+/#",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedByChild: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "<",
          }),
        },
        {
          desc: "match with multilevel wildcard in pattern",
          pattern: "test/#",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedByChild: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "<",
          }),
        },
        {
          desc: "pattern is longer than path",
          pattern: "test/test/test/#",
          path: "test",
          expectedResult: generateResult({
            patternToExtractData: "test/test/test/#",
            affectedByParent: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: ">",
          }),
        },
      ];

      for (const test of functionTests) {
        it(test.desc, function () {
          let result: any = null;
          try {
            result = comparePatternAndPath(test.pattern, test.path);
            expect(result).to.deep.equal(test.expectedResult);
          } catch (e) {
            const delta: string[] = [];

            for (const [key, value] of Object.entries(test.expectedResult)) {
              if (result[key] !== value) {
                delta.push(
                  `- "${key}": expected: ${value}; got: ${result[key]}"`
                );
              }
            }

            throw Error(
              `Failed with Test "${test.desc}".\nexpected=\t${JSON.stringify(
                test.expectedResult
              )}\nresult=  \t${JSON.stringify(result)}\n${delta.join("\n")}`
            );
          }
        });
      }

      const errorTests: {
        // Name of the Test
        desc: string;
        path: string;
        pattern: string;
      }[] = [
        {
          desc: "invalid pattern",
          pattern: "test//",
          path: "test",
        },
        {
          desc: "invalid pattern",
          pattern: "test/#/a",
          path: "test",
        },
        {
          desc: "invalid path",
          pattern: "test/a",
          path: "test//a",
        },
        {
          desc: "invalid path",
          pattern: "test/a",
          path: "test/+",
        },
        {
          desc: "invalid path",
          pattern: "test/a",
          path: "test/#",
        },
        {
          desc: "invalid path",
          pattern: "test/a",
          path: "test/+/#",
        },
      ];

      for (const test of errorTests) {
        it(test.desc, function () {
          const error = new Error("A Error should be thrown");
          try {
            const result = comparePatternAndPath(test.pattern, test.path);
            throw error;
          } catch (e) {
            if (e == error) {
              throw e;
            }
          }
        });
      }
    });

    describe("pattern without wildcard symbols", function () {
      const functionTests: {
        // Name of the Test
        desc: string;
        args?: [];
        path: string;
        pattern: string;
        expectedResult: TPathCompareResult;
      }[] = [
        {
          desc: "simple matching topics",
          pattern: "test",
          path: "test",
          expectedResult: generateResult({
            pathToExtractData: "test",
            affectedOnSameLevel: true,
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "topics should match",
          pattern: "test1",
          path: "test2",
          expectedResult: generateResult({
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "simple root topic compare topics",
          pattern: "test",
          path: "",
          expectedResult: generateResult({
            pathToExtractData: "test",
            affectedByParent: true,
            patternLengthComparedToPathLength: ">",
          }),
        },
        {
          desc: "match with multilevel wildcard",
          pattern: "test/#",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedByChild: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "<",
          }),
        },
        {
          desc: "match with multilevel wildcard and same length",
          pattern: "test/test/#",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedOnSameLevel: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "match with singlelevel wildcard",
          pattern: "test/+/test",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedOnSameLevel: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "match with singlelevel wildcard as first element in pattern",
          pattern: "+/test/test",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedOnSameLevel: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "match with singlelevel wildcard as last element in pattern",
          pattern: "test/test/+",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedOnSameLevel: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "match with multiple singlelevel wildcards in pattern",
          pattern: "test/+/+",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedOnSameLevel: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "=",
          }),
        },
        {
          desc: "match with singlelevel and multilevel wildcard in pattern",
          pattern: "+/#",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedByChild: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "<",
          }),
        },
        {
          desc: "match with multilevel wildcard in pattern",
          pattern: "test/#",
          path: "test/test/test",
          expectedResult: generateResult({
            pathToExtractData: "test/test/test",
            affectedByChild: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: "<",
          }),
        },
        {
          desc: "pattern is longer than path",
          pattern: "test/test/test/#",
          path: "test",
          expectedResult: generateResult({
            patternToExtractData: "test/test/test/#",
            affectedByParent: true,
            containsWildcards: true,
            patternLengthComparedToPathLength: ">",
          }),
        },
        // Now the specific Tests start:
        {
          desc: "pattern is longer than path",
          pattern: "a/b",
          path: "a",
          expectedResult: generateResult({
            pathToExtractData: "a/b",
            affectedByParent: true,
            containsWildcards: false,
            patternLengthComparedToPathLength: ">",
          }),
        },
        {
          desc: "path is longer than pattern",
          pattern: "a/b",
          path: "a/b/c",
          expectedResult: generateResult({
            pathToExtractData: "a/b",
            affectedByChild: true,
            patternLengthComparedToPathLength: "<",
          }),
        },
      ];

      for (const test of functionTests) {
        it(test.desc, function () {
          let result: any = null;
          try {
            result = comparePatternAndPath(test.pattern, test.path, {
              matchTopicsWithoutWildcards: true,
            });
            expect(result).to.deep.equal(test.expectedResult);
          } catch (e) {
            throw Error(
              `Failed with Test "${test.desc}".\nexpected=\t${JSON.stringify(
                test.expectedResult
              )}\nresult=  \t${JSON.stringify(result)}`
            );
          }
        });
      }
    });
  });

  describe("containsWildcards", function () {
    it("test wildcard detection", function () {
      expect(containsWildcards("test")).to.be.false;
      expect(containsWildcards("test/#")).to.be.true;
      expect(containsWildcards("test/+")).to.be.true;
    });
  });

  describe("patternIsValid", function () {
    it("should be invalid", function () {
      expect(patternIsValid("test//#")).to.be.false;
      expect(patternIsValid("test/a/#/b")).to.be.false;
      // Leading Splitchar
      expect(patternIsValid("test/a/")).to.be.false;
    });
    it("should be valid", function () {
      assert.isTrue(
        patternIsValid("test/#"),
        "multi-level wildcard at the end should be fine"
      );
      assert.isTrue(
        patternIsValid("#"),
        "multi-level wildcard only should be fine"
      );
      assert.isTrue(patternIsValid("+"), "single-level only should be fine");
      assert.isTrue(patternIsValid("+/#"), "combined should be fine");
      assert.isTrue(patternIsValid("a/+/a/#"), "combined with char");
      assert.isTrue(patternIsValid("+/+"), "multi single-level should be fine");
      assert.isTrue(patternIsValid("a/b/c"), "chars only should be fine");
    });
  });
});
