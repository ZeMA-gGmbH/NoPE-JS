import { assert } from "chai";
import { describe, it } from "mocha";
import {
  countAllArguments,
  countArguments,
  fillOptionalArguments,
  _extractArgumentsPartFromFunction,
} from "./functionMethods";

describe("functionMethods", function () {
  // Describe the required Test:
  describe("countArguments - static functions", function () {
    function test1() {
      console.log("test");
    }

    function test2(a, b, c) {
      console.log("test");
    }

    function test3(a, b, c = "hello") {
      console.log("test");
    }

    function test4(a, b, c = "with, comma") {
      console.log("test");
    }

    function test5(a, b, c = "with escaped ' quote and, comma") {
      console.log("test");
    }

    function test6(
      a,
      b,
      c = "with escaped ' quote and, comma",
      d = 'and double " quotes, too!'
    ) {
      console.log("test");
    }

    function test7(
      a,
      b,
      c = "testFuncCalls".substr(1, 2),
      d = "or maybe (string parenthesis)",
      e = Math.sqrt(Math.pow(5, 2))
    ) {
      console.log("test");
    }

    function test8(betterMakeSure, itWorksWith, longVariables = "too") {
      console.log("test");
    }

    function test9(single) {
      console.log("test");
    }

    function test10(single = "default") {
      console.log("test");
    }

    function test11(a, b, c = { objects: true, test: "," }) {
      console.log("test");
    }

    function test12(a, b, arrays = [true, 2, "three, "]) {
      console.log("test");
    }

    function test13(a = "endingEmptyParenths".toString()) {
      console.log("test");
    }

    function test14(singleInDouble = "'", b = 1) {
      console.log("test");
    }

    function test15(doubleInSingle = '"', b = 1) {
      console.log("test");
    }

    function test16(doubleInSingle = '"', b = 1, ...args) {
      console.log("test");
    }

    function test17(p1: (p1, p2) => {}, p2) {
      console.log("test");
    }

    function test18(p1: (p1, p2) => {}, p2 = null) {
      console.log("test");
    }

    function test19(p1: (p1, p2) => number = (a, b) => 1, p2 = null) {}

    const tests = [
      [test1, 0, 0],
      [test2, 3, 0],
      [test3, 2, 1],
      [test4, 2, 1],
      [test5, 2, 1],
      [test6, 2, 2],
      [test7, 2, 2],
      [test8, 2, 1],
      [test9, 1, 0],
      [test10, 0, 1],
      [test11, 2, 1],
      [test12, 2, 1],
      [test13, 0, 1],
      [test14, 0, 2],
      [test15, 0, 2],
      [test16, 0, 3],
      [test17, 2, 0],
      [test18, 1, 1],
      [test19, 0, 2],
    ];
    let idx = 1;
    for (const [func, s, o] of tests) {
      it(`correct counting of test${idx++}`, function () {
        const res = countArguments(func);
        assert.equal(
          res.static,
          s,
          `Expecting static - parameters to ${s} to match ${res.static}`
        );
        assert.equal(
          res.optional,
          o,
          `Expecting ${o} to match ${res.optional}`
        );
      });
    }
  });

  describe("countArguments - arrow functions", function () {
    const tests = [
      [/* 1*/ function empty() {}, 0],
      [/* 2*/ function simple(a, b, c) {}, 3],
      [/* 3*/ function withString(a, b, c = "hello") {}, 3],
      [/* 4*/ function withStringAndComma(a, b, c = "with, comma") {}, 3],
      [
        /* 5*/ function withEscapedStuffInStringValue(
          a,
          b,
          c = "with escaped ' quote and, comma"
        ) {},
        3,
      ],
      [
        /* 6*/ function withEscapedStuffAndCommaInStringValue(
          a,
          b,
          c = "with escaped ' quote and, comma",
          d = 'and double " quotes, too!'
        ) {},
        4,
      ],
      [
        /* 7*/ function withParenthesisInStringValues(
          a,
          b,
          c = "testFuncCalls".slice(1, 2),
          d = "or maybe (string parenthesis)",
          e = Math.sqrt(Math.pow(5, 2))
        ) {},
        4,
      ],
      [
        /* 8*/ function (betterMakeSure, itWorksWith, longVariables = "too") {},
        3,
      ],
      [/* 9*/ function (single) {}, 1],
      [/*10*/ function (single = "default") {}, 1],
      [/*11*/ function (a, b, c = { objects: true, test: "," }) {}, 3],
      [/*12*/ function (a, b, arrays = [true, 2, "three, "]) {}, 3],
      [/*13*/ function (a = "endingEmptyParenths".toString()) {}, 1],
      [/*14*/ function (singleInDouble = "'", b = 1) {}, 2],
      [/*15*/ function (doubleInSingle = '"', b = 1) {}, 2],
      [/*16*/ () => {}, 0],
      [/*17*/ (_ = 23) => {}, 1],
      [/*18*/ (a) => {}, 1],
      [/*19*/ (...a) => {}, 1],
      [
        /*20*/ (a) => {
          return a;
        },
        1,
      ],
      [/*21*/ (b = 1, a = {}) => {}, 2],
      [/*22*/ (b = 1, a = [1, 2, 3]) => {}, 2],
      // [/*23*/ function (foo, bar) {}.bind(null), 2], // 23 }'
      [/*24*/ (a) => a, 1],
      [/*25*/ (b, c, a = [1, 2, 4].map((v) => "x,y")) => `hello`, 3],
      [/*26*/ (_ = 42) => console.log("test"), 1],
      // [
      //   /*27*/ (a = `\(42\)`, b = `"blablabla,\",\"foo,\",\"bar"`) =>
      //     console.log("test"),
      //   2,
      // ],
      [
        /*28*/ (a = `([42, 43]\``, b = `"blablabla, foo(, \`\'bar:))"`) =>
          console.log("test"),
        2,
      ],
      [
        /*29*/ (
          a = `\([42, 43]\)`,
          b = function (a, b, c = "foo, also: bar") {
            let x = [a, b];
            return x;
          }
        ) => console.log("test"),
        2,
      ],
      [
        /*30*/ (
          a = {
            x: 'some" comma\'s, unclosed brackets, }},[, (, and escapes and whatnot"\\',
          },
          b
        ) => console.log("test"),
        2,
      ],
    ];
    for (const [func, all] of tests) {
      it(`correct counting of: ${_extractArgumentsPartFromFunction(
        func
      )}`, function () {
        const res = countArguments(func);
        assert.equal(
          res.total,
          all,
          `Expecting static - parameters to ${all} to match ${res.total}`
        );
      });
    }
  });

  describe("auto-fill", function () {
    function test(p1, p2, p3 = null, p4 = null) {
      return [p1, p2, p3, p4];
    }

    const tests: Array<[any[], any[], boolean, any[]]> = [
      [[0, 1], [], false, [0, 1, undefined, undefined]],
      [[0, 1], [2], false, [0, 1, 2, undefined]],
      [[0, 1], [3], true, [0, 1, undefined, 3]],
      [[0, 1], [2, 3], false, [0, 1, 2, 3]],
      [[0, 1], [2, 3], true, [0, 1, 2, 3]],
    ];

    for (const params of tests) {
      it(`auto assigning parameters of: ${params.slice(0, 3)}`, function () {
        const p = fillOptionalArguments(test, params[0], params[1], params[2]);
        const r = params[3];
        assert.deepEqual(
          p,
          r,
          `Expecting static - parameters to ${p} to match ${r}`
        );

        const res = r.map((item) => {
          if (item === undefined) {
            return null;
          } else return item;
        });

        assert.deepEqual(
          (test as any)(...p),
          res,
          `Expecting the result to be equal ${p} to match ${res}`
        );
      });
    }
  });
});
