/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

export const SPLITCHAR = "/";
import { getLeastCommonPathSegment } from "./path";
import {
  comparePatternAndPath,
  containsWildcards,
  MULTI_LEVEL_WILDCARD,
} from "./pathMatchingMethods";

const _sentinel = new Object();

/**
 * Function to recurvely get an Attribute of the Object.
 *
 * @export
 * @example data = [{a:1},{a:2}]; rgetattr(data, "0/a") -> 0; rgetattr(data,"hallo", "default") -> "default"
 * @param {*} _data Data, where the item should be received
 * @param {string} _path The path to extract
 * @param {*} [_default=_sentinel] Default Object, if nothing else is provided
 * @returns {*} The extracted data.
 */
export function rgetattr<T = any>(
  _data: any,
  _path: string,
  _default: any = _sentinel,
  _SPLITCHAR: string = SPLITCHAR
): T | null {
  // Extract the Path
  let _obj = _data;

  if (_path.length > 0) {
    /** Check if there is a Substring available perform the normal method */
    if (_path.indexOf(_SPLITCHAR) !== -1) {
      for (const attr of _path.split(_SPLITCHAR)) {
        /** Access a Map */
        if (_obj instanceof Map) {
          _obj = _obj.get(attr);
        } else {
          /** Array or default Object */
          _obj = _obj[attr];
        }

        if ((_obj == null || _obj == undefined) && _default === _sentinel) {
          return null;
        } else if (_obj == null || _obj == undefined) {
          return _default;
        }
      }
    } else {
      /** Otherwise just return the Element */
      if (_obj[_path] == null || _obj[_path] == undefined) {
        if (_default == _sentinel) {
          return null;
        }

        return _default;
      }

      return _obj[_path];
    }
  }
  return _obj;
}

/**
 * Helper to query data from an object.
 * @example data = [{a:1},{a:2}]; rqueryAttr(data, "+/a") -> [{path: "0/a", data: 0},{path: "1/a", data: 1}]
 * @param data The data
 * @param query The query to use.
 * @returns Returns an array
 */
export function rqueryAttr<T>(
  data: any,
  query: string
): {
  path: string;
  data: T;
}[] {
  if (!containsWildcards(query)) {
    const _sentinel = {
      id: Date.now(),
    };
    const extractedData = rgetattr<T>(data, query, _sentinel);

    if (extractedData === (_sentinel as any)) {
      return [];
    }

    return [{ path: query, data: extractedData }];
  }

  let ret: {
    path: string;
    data: T;
  }[] = [];

  const multiLevel = query.includes(MULTI_LEVEL_WILDCARD);
  // Determine the max depth
  const maxDepth = multiLevel ? Infinity : query.split(SPLITCHAR).length;

  // get the flatten object
  const map = flattenObject(data, {
    maxDepth,
    onlyPathToSimpleValue: false,
  });

  // Iterate over the items and use our
  // path matcher to extract the matching items.
  for (const [path, value] of map.entries()) {
    const r = comparePatternAndPath(query, path);

    if (r.affectedOnSameLevel || (multiLevel && r.affectedByChild)) {
      ret.push({
        path,
        data: value,
      });
    }
  }

  return ret;
}

/**
 * Helper to query data from an object.
 *
 * props is defined as followed:
 * ```typescript
 * props: {
 *     key: string;
 *     query: string;
 * }[]
 * ```
 *
 * @example Example 1:
 *
 * ```javascript
 *
 *  const data = { "deep": { "nested": "test" } };
 *  const result = convert_data(data, [
 *      {
 *          "key": "result",
 *          "query": "deep/nested",
 *      },
 *  ]);
 *
 *  // ==> result = [{"result": "test"}]
 * ```
 *
 * @example Example 2:
 *
 * ```javascript
 * data = {
 *     "array": [
 *     {
 *         "data1": 0,
 *         "data2": "a",
 *     },
 *     {
 *         "data1": 1,
 *         "data2": "a",
 *     },
 *     ],
 *     "not": { "nested": "hello" }
 * }
 *
 * let result = convert_data(data, [
 *     {
 *         "key": "a",
 *         "query": "array/+/data1",
 *     },
 *     {
 *         "key": "b",
 *         "query": "array/+/data2",
 *     },
 * ])
 *
 * // ==> result = [{"a": 0, "b": "a"}, {"a": 1, "b": "a"}]
 * ```
 *
 * @param data The data
 * @param query The query to use.
 * @returns Returns an array
 */
export function convertData<T>(
  data: any,
  props: {
    key: string;
    query: string;
  }[]
): T[] {
  const ret: {
    [index: string]: {
      path: string;
      data: any;
    }[];
  } = {};

  const commonPattern = getLeastCommonPathSegment(
    props.map((item) => {
      return item.query;
    })
  );

  props.map((prop) => {
    ret[prop.key] = rqueryAttr(data, prop.query);
  });

  const helper: { [index: string]: { [index: string]: any } } = {};

  for (const prop of props) {
    // get the item
    const items = ret[prop.key];

    for (const [idx, item] of items.entries()) {
      if (commonPattern !== false) {
        const result = comparePatternAndPath(commonPattern, item.path);

        if (result.pathToExtractData) {
          if (helper[result.pathToExtractData] === undefined) {
            helper[result.pathToExtractData] = {};
          }
          helper[result.pathToExtractData][prop.key] = item.data;
        }
      } else {
        if (helper[idx] === undefined) {
          helper[idx] = {};
        }

        helper[idx][prop.key] = item.data;
      }
    }
  }

  return Object.getOwnPropertyNames(helper).map((key) => {
    return helper[key] as T;
  });
}

/**
 * Function to Set recursely a Attribute of an Object
 *
 * @author M.Karkowski
 * @export
 * @param {*} _data The Object, where the data should be stored
 * @param {string} _path The Path of the Attribute. All are seprated by a the splitchar. (Defaults to'.' => For Instance 'a/b/0/a/c')
 * @param {*} _value The Value which should be Stored in the Attribute.
 * @param {string} [_SPLITCHAR=SPLITCHAR] The Splitchar to use. Defaults to "/"
 */
export function rsetattr(
  _data: any,
  _path: string,
  _value: any,
  _SPLITCHAR: string = SPLITCHAR
): void {
  let _obj = _data;

  const _ptrs = _path.split(_SPLITCHAR);

  _ptrs.slice(0, -1).forEach(function (attr: string, idx: number) {
    // Adapt the Object by going through a loop
    let _sub = _obj[attr];

    if (_sub === undefined || _sub === null) {
      // _obj is an Array and it doesnt contain the index

      // Extract the Next Element:
      const _next = _ptrs[idx + 1];

      const _next_is_int = isInt(_next);

      if (Array.isArray(_obj)) {
        if (_next_is_int) {
          _obj[attr] = new Array<any>();
        } else {
          _obj[attr] = {};
        }
      } else {
        if (_next_is_int) {
          _obj[attr] = [];
        } else {
          _obj[attr] = {};
        }
      }
      _sub = _obj[attr];
    }

    _obj = _sub;
  });
  _obj[_ptrs[_ptrs.length - 1]] = _value;
}

/**
 * Checks whether the Value is an Integer
 *
 * @export
 * @param {*} value Value to be checked
 * @returns {boolean} Result
 */
export function isInt(value: any): boolean {
  return parseInt(value) === value;
}

/**
 * Checks whether the Value is a Float
 *
 * @export
 * @param {*} value Value to be checked
 * @returns {boolean} Result
 */
export function isFloat(value: any): boolean {
  return !isNaN(Number(value));
}

/**
 * Copys the Object. Creates a Deep-Copy
 * of the Function
 *
 * @export
 * @param {*} value The value which should be copied
 * @returns {*} A Copy of the Value
 */
export function copy<T>(value: T): T {
  // TODO RING
  // const _copy = {};

  // /** Perform a Recursevly Foreach an Set an Attribute. */
  // recursiveForEach(value, '', (path: string, _data: any) => {
  //     rsetattr(_copy, path, _data);
  // });

  // return _copy;
  return JSON.parse(JSON.stringify(value));
}

/**
 * Function Converts a Object to a Map.
 *
 * @export
 * @param {*} _obj The Object which should be converted.
 * @returns {Map<string,any>}
 */
export function objectToMap(_obj: any): Map<string, any> {
  /** Define the Returntype */
  const _ret = new Map<string, any>();

  /** Iterate through all properties of the Object */
  for (const _prop of Object.getOwnPropertyNames(_obj)) {
    /** If isnt a function it could be added */
    if (typeof _obj !== "function") {
      _ret.set(_prop, _obj[_prop]);
    }
  }

  /** Return the Result */
  return _ret;
}

/**
 * Checks whether the Value is an Object
 *
 * @export
 * @param {*} value Data to Test
 * @returns {boolean} Flag showing whether the Presented Data is an Object
 */
export function isObject(value: any): boolean {
  /** Verify whether the value contains some data. */
  if (value) {
    if (typeof value === "object" && !Array.isArray(value)) {
      return Object.keys(value).length > 0;
    }
  }
  return false;
}

/**
 * Checks whether the Value is an Object
 *
 * @export
 * @param {*} value Data to Test
 * @returns {boolean} Flag showing whether the Presented Data is an Object
 */
export function isObjectOrArray(value: any): boolean {
  /** Verify whether the value contains some data. */
  return isObject(value) || Array.isArray(value);
}

/**
 * Flattens an Object to a Map.
 *
 * For Instance:
 *
 *      data = {a : { b : { c : 1, d: "hallo"}}}
 *
 *      // Normal Call
 *      res = flatteObject(data)
 *      => res = {"a.b.c":1,"a.b.d":"hallo"}
 *
 *      // With a Selected prefix 'additional.name'
 *      res = flatteObject(data,{prefix:'additional.name'})
 *      => res = {"additional.name.a.b.c":1,"additional.name.a.b.d":"hallo"}
 *
 * @export
 * @param {*} data The Data that should be converted
 * @param {string} [prefix=''] An additional prefix.
 * @returns {Map<string, any>} The flatten Object
 */
export function flattenObject(
  data: any,
  options: {
    prefix?: string;
    splitchar?: string;
    maxDepth?: number;
    onlyPathToSimpleValue?: boolean;
  } = {}
): Map<string, any> {
  const _options = Object.assign(
    {
      prefix: "",
      splitchar: SPLITCHAR,
      onlyPathToSimpleValue: false,
      maxDepth: Infinity,
    },
    options
  );

  const _ret = new Map<string, any>();

  if (isObject(data) || Array.isArray(data)) {
    recursiveForEach(
      data,
      _options.prefix,
      (path, _data) => {
        _ret.set(path, _data);
      },
      _options.splitchar,
      _options.onlyPathToSimpleValue,
      _options.maxDepth
    );
  }
  return _ret;
}

/**
 * Function, that will iterate over an object.
 * It will call the callback on every element.
 *
 *
 * @author M.Karkowski
 * @export
 * @param {*} obj The Object to iterate
 * @param {string} [prefix=""] A prefix for the Path.
 * @param {(
 *     path: string,
 *     data: any,
 *     parent?: string,
 *     level?: number
 *   ) => void} dataCallback Callback, that will be called.
 * @param {string} [_SPLITCHAR=SPLITCHAR] The Splitchar to use, to generate the path
 * @param {boolean} [_callOnlyOnValues=true] A Flag, to start the
 * @param {*} [_maxDepth=Infinity] Determine the max Depth, after which the Iteration will be stopped.
 * @param {string} [_parent=""] For Recursive call only
 * @param {number} [_level=0] For Recursive call only
 * @return {*}  {*}
 */
export function recursiveForEach(
  obj: any,
  prefix = "",
  dataCallback: (
    path: string,
    data: any,
    parent?: string,
    level?: number
  ) => void,
  _SPLITCHAR: string = SPLITCHAR,
  _callOnlyOnValues = true,
  _maxDepth = Infinity,
  _parent = "",
  _level = 0
): any {
  if (_level > _maxDepth) {
    return;
  }

  // Create an Array with the Keys.
  let keys = Array<string>();

  // Extract the keys of an object, but only if it isnt a
  // string or function.
  if (typeof obj !== "string" && typeof obj !== "function") {
    keys = Object.getOwnPropertyNames(obj);
    if (Array.isArray(obj)) {
      keys.splice(keys.indexOf("length"), 1);
    }
  }

  let called = false;

  if (!_callOnlyOnValues) {
    // Store the Element !
    dataCallback(prefix, obj, _parent, _level);
    called = true;
  }

  // If there are Keys => It is a List or a Default Object
  if (keys.length > 0) {
    for (const _key of keys) {
      // Define the variable, containing the path
      const _str = prefix === "" ? _key : prefix + _SPLITCHAR + _key;

      if (obj[_key] !== null && obj[_key] !== undefined) {
        // Test if there exist a specific function, which will convert the
        // Object to JSON => if so, we use that function, otherwise we will
        // just proceed.
        if (typeof obj[_key].toJSON === "function") {
          const data = obj[_key].toJSON();
          // Recursive call this function.
          recursiveForEach(
            data,
            _str,
            dataCallback,
            _SPLITCHAR,
            _callOnlyOnValues,
            _maxDepth,
            prefix,
            _level + 1
          );
        } else {
          // Recursive call this function.
          recursiveForEach(
            obj[_key],
            _str,
            dataCallback,
            _SPLITCHAR,
            _callOnlyOnValues,
            _maxDepth,
            prefix,
            _level + 1
          );
        }
      }
    }
  } else if (!called) {
    // Store the Element !
    dataCallback(prefix, obj, prefix, _level);
  }
}

/**
 * Exports the used Types of an Object. The result is the
 * a Map, where the key represents the path and the value
 * represents the type of the element (stored in the path)
 *
 * @author M.Karkowski
 * @export
 * @param {*} data The Data to check
 * @param {{
 *   prefix?: string,
 *   splitchar?: string,
 *   maxDepth?: number,
 * }} [options={}]
 * @return {*}  {Map<string, string>} key = path; value = type of element;
 */
export function flattenObjectType(
  data: any,
  options: {
    prefix?: string;
    splitchar?: string;
    onlyPathToSimpleValue?: boolean;
    maxDepth?: number;
  } = {}
): Map<string, string> {
  // Options which will be used
  const _options = Object.assign(
    {
      prefix: "",
      onlyPathToSimpleValue: false,
      splitchar: SPLITCHAR,
      maxDepth: Infinity,
    },
    options
  );

  const _ret = new Map<string, string>();

  if (isObject(data)) {
    recursiveForEach(
      data,
      _options.prefix,
      (path, _data) => {
        _ret.set(path, typeof _data);
      },
      _options.splitchar,
      _options.onlyPathToSimpleValue,
      _options.maxDepth
    );
  }
  return _ret;
}

/**
 * Deflattens an Dict Based Object. The Object it self is represented
 * as Map, whereas the Key represents the path.
 *
 *
 * @author M.Karkowski
 * @export
 * @param {Map<string, any>} _flattenObject
 * @return {*}  {*}
 */
export function deflattenObject(
  _flattenObject: Map<string, any>,
  options: {
    prefix?: string;
    splitchar?: string;
  }
): any {
  // Options which will be used
  const _options = Object.assign(
    {
      prefix: "",
      splitchar: SPLITCHAR,
    },
    options
  );
  const _ret = {};

  _flattenObject.forEach((_val: any, _key: string) => {
    // if there is a prefix, remove it:
    if (_options.prefix !== "") {
      _key = _key.slice(_options.prefix.length);
    }
    rsetattr(_ret, _key, _val, _options.splitchar);
  });

  return _ret;
}

/**
 * Function for deeply assigning
 *
 * @export
 * @param {*} target
 * @param {*} source
 * @returns
 */
export function deepAssign(target: any, source: any) {
  const flattend = flattenObject(source);

  for (const [path, value] of flattend.entries()) {
    rsetattr(target, path, value);
  }

  return target;
}

/**
 * Function to deeply clone the given object.
 *
 * @author M.Karkowski
 * @export
 * @template T
 * @param {T} obj
 * @return {*}  {T}
 */
export function deepClone<T>(obj: T): T {
  switch (typeof obj) {
    case "object": {
      if (obj === null) {
        return null;
      }
      const clone: any = Object.assign({}, obj);
      Object.keys(clone).forEach((key) => {
        clone[key] =
          typeof obj[key] === "object" ? deepClone(obj[key]) : obj[key];
      });
      return (
        Array.isArray(obj) && obj.length
          ? (clone.length = obj.length) && Array.from(clone)
          : Array.isArray(obj)
          ? Array.from(obj)
          : clone
      ) as T;
    }
    default: {
      return obj;
    }
  }
}

/**
 * Helper to get the Type of an Object.
 * @param obj The Object
 * @returns
 */
export function getType(obj): string {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

/**
 * Compares deep a and b.
 * @param source The source item
 * @param target The target item
 * @param {number} maxDepth Max Depth, after which the test is skipped and the `onMaxDepth` value is returned
 * @param {boolean} [onMaxDepth=false] Value to return if the maxDepth is reached.
 * @returns
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a && b && typeof a == "object" && typeof b == "object") {
    if (a.constructor !== b.constructor) return false;

    let length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0; ) if (!deepEqual(a[i], b[i])) return false;
      return true;
    }

    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      for (i of a.entries()) if (!b.has(i[0])) return false;
      for (i of a.entries()) if (!deepEqual(i[1], b.get(i[0]))) return false;
      return true;
    }

    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      for (i of a.entries()) if (!b.has(i[0])) return false;
      return true;
    }

    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
      length = a.byteLength;
      if (length != b.byteLength) return false;
      for (i = length; i-- !== 0; ) if (a[i] !== b[i]) return false;
      return true;
    }

    if (a.constructor === RegExp)
      return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf)
      return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString)
      return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0; ) {
      let key = keys[i];
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a !== a && b !== b;
}

/**
 * Function to adapt the Object and only return a specific amount of elements.
 * @param obj The Object itself
 * @param properties a list of properties/pathes to keep
 */
export function keepPropertiesOfObject(
  obj: any,
  properties: { [index: string]: () => any }
): any {
  if (isObject(obj)) {
    const ret: any = {};

    const defaultObj = { error: true };

    // Iterate over the Properties, get the content of the path, clone it an put it to the
    // provided path
    Object.getOwnPropertyNames(properties).map((path) => {
      const value = rgetattr(obj, path, defaultObj);
      rsetattr(
        ret,
        path,
        value !== defaultObj
          ? typeof value === "object"
            ? deepClone(value)
            : value
          : properties[path]()
      );
    });

    // Return the Object
    return ret;
  }

  // Wrong Datatype provided.
  throw TypeError("Function can only create Objects");
}
