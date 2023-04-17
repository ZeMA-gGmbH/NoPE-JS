/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { rgetattr } from "./objectMethods";

/**
 * Sorts a List based on the given property
 * Usage :
 * ```javascript
 *  a = [{a : 1, b: 2}, {a : 2, b: 1}];
 *  b = a.sort(dynamicSort('b'))
 *  b => [{a : 2, b: 1}, {a : 1, b: 2}]
 * ```
 * @export
 * @param {string} _property Property Name / Path to Sort the List
 * @returns
 */
export function dynamicSort(_property: string, reverse = false): any {
  const _sortOrder = reverse ? -1 : 1;

  return function (a, b) {
    const _a = rgetattr(a, _property);
    const _b = rgetattr(b, _property);
    if (typeof _a === "number" && typeof _b === "number") {
      const result = _a < _b ? -1 : _a > _b ? 1 : 0;
      return result * _sortOrder;
    } else if (typeof _a === "number") {
      return 1 * _sortOrder;
    } else if (typeof _b === "number") {
      return -1 * _sortOrder;
    } else if (typeof _a === "string" && typeof _b === "string") {
      return _a < _b ? -1 : _a > _b ? 1 : 0;
    }

    return 0;
  };
}

/**
 * Extracts the Data of the given List
 *
 * # Example:
 *
 * ```javascript
 * const list = [{"id":1, "data":"a"},{"id":2, "data":"b"}]
 * const res = extractListElement(list, "data") // => ["a","b"]
 * ```
 *
 * @export
 * @param {Array<any>} list List, where data should be extracted
 * @param {string} path path pointing to the Data in the List
 * @returns {Array<any>} List only containing the Elements.
 */
export function extractListElement(list: Array<any>, path: string): Array<any> {
  // Define Function to extract the Properties.
  function _extract(_property) {
    const _ret = rgetattr(_property, path);
    /** Returns the Value if it is in the Element */
    if (_ret) {
      return _ret;
    }
  }

  return list.map(_extract);
}

/**
 * Converts a List to Set.
 *
 * @export
 * @template T
 * @param {Array<T>} list The list as input
 * @returns {Set<T>} The Set
 */
export function toSet<T>(list: Array<T>): Set<T> {
  const _ret = new Set<T>();

  for (const item of list) {
    _ret.add(item);
  }

  return _ret;
}

/**
 * Extracts the first Element if Possible, which includes the Operand
 *
 * # Example
 *
 * ```javascript
 * const a = [{path:'hallo'}, {path:'hallo2'}]
 * const res = getElement(a, 'hallo2', 'path') // => {path:'hallo2'}
 * ```
 *
 * @export
 * @template T
 * @param {Array<T>} list The list which is considered
 * @param {*} operand The Element which should looked for
 * @param {string} [path=''] The where the Element should be found
 * @returns {(T | null)}
 */
export function getElement<T>(
  list: Array<T>,
  operand: any,
  path = ""
): T | null {
  /** Iterate through the List an get the requested Element if possible */
  for (const _element of list) {
    /** Compare the Requested value with the value of the List-Item */
    if (operand === rgetattr(_element, path)) {
      return _element;
    }
  }
  return null;
}

/**
 * Function that will compare two arrays, if they are equal.
 *
 * # Example:
 *
 * ```javascript
 * const a = [1,2,3,4,5]
 * arraysEqual(a, [1,2,3,4]) // => false;
 * arraysEqual(a, [1,2,3,4,5]) // => true;
 * arraysEqual(a, [1,2,3,5,4], false) // => true;
 * ```
 *
 * @param a Array Element A
 * @param b Array Element B
 * @param considerOrder Flag to enable/disable Order checking
 */
export function arraysEqual(
  a: Array<any>,
  b: Array<any>,
  considerOrder = true
): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  let _a = a;
  let _b = b;

  if (!considerOrder) {
    _a = a.concat().sort();
    _b = b.concat().sort();
  }

  for (let i = 0; i < _a.length; ++i) {
    if (_a[i] !== _b[i]) return false;
  }
  return true;
}

/**
 * Function which will limit the Amount of Element stored in the Array during
 * pushing a new Element. If the Maximum is exited the Elementes will be removed
 * with the FIFO Principal.
 *
 * # Example 1:
 *
 * In this example the limit will be reached.
 *
 * ```javascript
 * const a = [1,2,3,4,5]
 * limitedPush(a, 6,5) // => [2,3,4,5,6];
 * ```
 * # Example 2:
 *
 * The limit wont be excided
 *
 * ```javascript
 * const a = [1,2,3,4,5]
 * limitedPush(a, 6, 10) // => [1,2,3,4,5,6];
 * ```
 * @param array The considered Array
 * @param element The Element which should be added
 * @param maxElements The Max. Amount of Elements, which are allowed to store.
 */
export function limitedPush<T>(
  array: T[],
  element: T,
  maxElements: number
): void {
  array.push(element);

  if (array.length > maxElements) {
    array.splice(0, 1);
  }
}

/**
 * Function to count the Number of Element in an Array. A Dict with the Elements
 * as string will be returned.
 *
 * # Example:
 *
 * ```javascript
 * const a = [1,2,3,4,5,5,5]
 * countElements(a) // => Map<{1:1, 2:1,3:1,4:1,5:3}>;
 * ```
 * @param array The Array
 */
export function countElements<T>(array: Array<T>): Map<T, number> {
  const ret: Map<T, number> = new Map();

  for (const element of array) {
    ret.set(element, (ret.get(element) || 0) + 1);
  }

  return ret;
}

/**
 * Function, which will Flatten the Array.
 *
 * # Example:
 *
 * ```javascript
 * const a = [1,[2,[3,[4,[5]]]]]
 * flattenDeep(a) // => [1,2,3,4,5]
 * ```
 * @param arrayToFlatten The Array
 */
export function flattenDeep<T>(arrayToFlatten) {
  return arrayToFlatten.reduce((acc, val) => {
    return Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val);
  }, []) as T[];
}

/**
 * Function, to Test whether the Element is present in the Array
 *
 * # Example 1:
 *
 * ```javascript
 * const list = [{"id":1, "data":"a"},{"id":2, "data":"b"},{"id":3, "data":"c"}]
 * elementInArray("b", list, "data") // => true
 * elementInArray(5, list, "data") // => false
 * elementInArray("b", list, "property_not_in_data") // => false
 * ```
 *
 * # Example 2:
 *
 * ```javascript
 * const list = [{"id":1, "data":["a"]},{"id":2, "data":["b"]},{"id":3, "data":["c"]}]
 * elementInArray("b", list, "data/0") // => true
 * elementInArray("d", list, "data/0") // => false
 * elementInArray("b", list, "data")   // => false <- Path doesnt contain 'b'
 * elementInArray("b", list, "data/1") // => false <- Path wrong, no elements there
 * ```
 * @param objToTest The Object to Test
 * @param array The array to consider
 * @param path The path, under which the element will be found
 */
export function elementInArray<T>(objToTest: T, array: Array<T>, path: string) {
  const testData = rgetattr(objToTest, path, false);
  for (const [idx, element] of array.entries()) {
    if (testData === rgetattr(element, path, true)) {
      return idx;
    }
  }

  return -1;
}

/**
 * Function to ZIP to Arrays.
 *
 * # Example 1:
 *
 * ```javascript
 * const a = [1,2,3,4]
 * const b = ["a","b","c","d"]
 * zipArrays(a,b) // => [(1,"a"), (2, "b"), ...]
 * ```
 * @param arr1
 * @param arr2
 */
export function zipArrays<T, K>(arr1: T[], arr2: K[]): Array<[T, K]> {
  if (arr1.length !== arr2.length) {
    throw Error("Length of the Elements doesnt match!");
  }

  const res: Array<[T, K]> = arr1.map(function (e, i) {
    return [e, arr2[i]];
  });

  return res;
}

/**
 * Helper to determine the average of an array
 *
 * # Example 1:
 *
 * ```javascript
 * const a = [1,2,3,4]
 * // default behavior:
 * avgOfArray(a,"") // => 2.5
 * // if no data present at the path the default value is used:
 * avgOfArray(a,"a",1) // => 1
 * ```
 *
 * # Example 2:
 *
 * ```javascript
 * const a = [{value:1},{value:2},{value:3},{value:4}]
 * // default behavior:
 * avgOfArray(a,"value") // => 2.5
 * // if no data present at the path the default value is used:
 * avgOfArray(a,"a",1) // => 1
 * ```
 * @author M.Karkowski
 * @export
 * @param {any[]} arr The array
 * @param {string} path The path to the data.
 * @param {number} [defaultValue=0] if no data present at the path the default value is used.
 * @return {*}  {number}
 */
export function avgOfArray(arr: any[], path: string, defaultValue = 0): number {
  if (arr.length === 0) {
    return defaultValue;
  }

  const arrOfValues = arr.map((item) => {
    return rgetattr(item, path, defaultValue);
  });
  const added = arrOfValues.reduce((prev, curr) => {
    return prev + curr;
  }) as number;
  return added / arr.length;
}

/**
 * Helper to determine the minimum of an array
 *
 * # Example 1:
 *
 * ```javascript
 * const a = [1,2,3,4]
 * // default behavior:
 * minOfArray(a,"") // => 1
 * // if no data present at the path the default value is used:
 * minOfArray(a,"a",1) // => 1
 * ```
 *
 * # Example 2:
 *
 * ```javascript
 * const a = [{value:1},{value:2},{value:3},{value:4}]
 * // default behavior:
 * minOfArray(a,"value") // => 1
 * // if no data present at the path the default value is used:
 * minOfArray(a,"a",1) // => 1
 * ```
 * @param {any[]} arr The array
 * @param {string} path The path to the data.
 * @param {number} [defaultValue=0] if no data present at the path the default value is used.
 * @returns
 */
export function minOfArray<T>(
  arr: T[],
  path: keyof T | string,
  defaultValue = 0
): {
  min: number;
  index: number;
} {
  if (arr.length === 0) {
    return {
      min: defaultValue,
      index: -1,
    };
  }

  const arrOfValues = arr.map((item) => {
    return rgetattr<number>(item, path as string, defaultValue);
  });
  const min = Math.min(...arrOfValues);
  return {
    min,
    index: arrOfValues.indexOf(min),
  };
}

/**
 * Helper to determine the maximum of an array
 *
 * # Example 1:
 *
 * ```javascript
 * const a = [1,2,3,4]
 * // default behavior:
 * maxOfArray(a,"") // => 4
 * // if no data present at the path the default value is used:
 * maxOfArray(a,"a",1) // => 1
 * ```
 *
 * # Example 2:
 *
 * ```javascript
 * const a = [{value:1},{value:2},{value:3},{value:4}]
 * // default behavior:
 * maxOfArray(a,"value") // => 4
 * // if no data present at the path the default value is used:
 * maxOfArray(a,"a",1) // => 1
 * ```
 * @param {any[]} arr The array
 * @param {string} path The path to the data.
 * @param {number} [defaultValue=0] if no data present at the path the default value is used.
 * @returns
 */
export function maxOfArray(
  arr: any[],
  path: string,
  defaultValue = 0
): {
  max: number;
  index: number;
} {
  if (arr.length === 0) {
    return {
      max: defaultValue,
      index: -1,
    };
  }

  const arrOfValues = arr.map((item) => {
    return rgetattr<number>(item, path, defaultValue);
  });
  const max = Math.max(...arrOfValues);
  return {
    max: max,
    index: arrOfValues.indexOf(max),
  };
}
