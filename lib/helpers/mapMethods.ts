/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import {
  convertData,
  deepEqual,
  rgetattr,
  rqueryAttr,
  SPLITCHAR,
} from "./objectMethods";
import { getLeastCommonPathSegment } from "./path";

const __sentinal = {
  unique: "value",
};

/**
 * Extracts the unique values of an map.
 *
 * @author M.Karkowski
 * @export
 * @template D Return Type
 * @template K The Key of the Map
 * @template V The Value of the Map
 * @param {Map<K, V>} map The Map
 * @param {string} [path=""] The Path of the Data to extract.
 * @param {string} [pathKey=null] The Path of the unique key. If set to `null` -> The Item is selected directly.
 * @return {Set<D>}
 */
export function extractUniqueValues<D, K = any, V = any>(
  map: Map<K, V>,
  path = "",
  pathKey: string = null
): Set<D> {
  if (pathKey === null) {
    pathKey = path;
  }

  if (path !== pathKey) {
    // Get the Common segment of the item.
    let commonSegment = getLeastCommonPathSegment([path, pathKey], {
      considerSingleLevel: false,
      considerMultiLevel: false,
    });

    if (commonSegment == false) {
      commonSegment = "";
    }

    const commonSegmentLength = commonSegment.split(SPLITCHAR).length;

    const _relPathContent = path
      .split(SPLITCHAR)
      .slice(commonSegmentLength)
      .join(SPLITCHAR);
    const _relPathKey = pathKey
      .split(SPLITCHAR)
      .slice(commonSegmentLength)
      .join(SPLITCHAR);

    // Now use that segment to extract the common data.
    const items = extractValues(map, commonSegment) as D[];
    const itemKeys = new Set();

    const ret: D[] = [];

    for (const item of items) {
      const key = _relPathKey ? rgetattr(item, _relPathKey) : item;
      const data = _relPathContent ? rgetattr(item, _relPathContent) : item;
      if (!itemKeys.has(key)) {
        itemKeys.add(key);

        ret.push(data);
      }
    }

    return new Set(ret);
  }

  return new Set(extractValues(map, path));
}

/**
 * Helper to extract values of the map. Therefore the path must be provided.
 * @param map
 * @param path
 * @returns
 */
export function extractValues<D, K>(map: Map<K, any>, path = ""): Array<D> {
  const s = new Array<D>();

  for (const v of map.values()) {
    if (path) {
      const data: { path: string; data: D }[] = rqueryAttr(v, path);
      data.map((item) => {
        return s.push(item.data);
      });
    } else {
      // Add the item.
      s.push(v);
    }
  }

  return s;
}

/**
 * Transform the values.
 *
 *
 * @author M.Karkowski
 * @export
 * @template ExtractedValue
 * @template ExtractedKey
 * @template OriginalKey
 * @param {Map<OriginalKey, any>} map
 * @param {string} [pathExtractedValue=""]
 * @param {string} [pathExtractedKey=null] Additional Path of a Key.
 * @return {*}  {Map<ExtractedKey, ExtractedData>}
 */
export function tranformMap<
  ExtractedKey = string,
  ExtractedValue = any,
  OriginalKey = string
>(
  map: Map<OriginalKey, any>,
  pathExtractedValue: string,
  pathExtractedKey: string,
  equals: (a: ExtractedValue, b: ExtractedValue) => boolean = deepEqual
) {
  const keyMapping = new Map<OriginalKey, Set<ExtractedKey>>();
  const reverseKeyMapping = new Map<ExtractedKey, Set<OriginalKey>>();
  const conflicts = new Map<ExtractedKey, Set<ExtractedValue>>();
  const extractedMap = new Map<ExtractedKey, ExtractedValue>();
  const orgKeyToExtractedValue = new Map<OriginalKey, Set<ExtractedValue>>();
  const amountOf = new Map<ExtractedKey, number>();

  const props: {
    query: string;
    key: string;
  }[] = [];

  let onlyValidProps = true;

  if (typeof pathExtractedKey === "string") {
    props.push({
      key: "key",
      query: pathExtractedKey,
    });
    onlyValidProps = onlyValidProps && pathExtractedKey.length > 0;
  } else {
    onlyValidProps = false;
  }

  if (typeof pathExtractedValue === "string") {
    props.push({
      key: "value",
      query: pathExtractedValue,
    });
    onlyValidProps = onlyValidProps && pathExtractedValue.length > 0;
  } else {
    onlyValidProps = false;
  }

  // Iterate over the Entries of the Map.
  // then we will extract the data stored in the Value.
  for (const [k, v] of map.entries()) {
    let extracted: {
      key: ExtractedKey;
      value: ExtractedValue;
    }[] = [];

    if (onlyValidProps) {
      extracted = convertData<{ key: ExtractedKey; value: ExtractedValue }>(
        v,
        props
      );
    } else {
      const data: {
        key: ExtractedKey[];
        value: ExtractedValue[];
      } = {
        key: null,
        value: null,
      };

      // We migt adapt the key and the Value. Therefore we will use
      // the next if statements

      if (typeof pathExtractedKey === "string") {
        if (pathExtractedKey.length > 0) {
          data.key = rqueryAttr<ExtractedKey>(v, pathExtractedKey).map(
            (item) => item.data
          );
        } else {
          data.key = [v];
        }
      } else {
        data.key = [k] as any;
      }

      if (typeof pathExtractedValue === "string") {
        if (pathExtractedValue.length > 0) {
          data.value = rqueryAttr<ExtractedValue>(v, pathExtractedValue).map(
            (item) => item.data
          );
        } else {
          data.value = [v];
        }
      } else {
        data.value = [v] as Array<ExtractedValue>;
      }

      // For every key push the data.
      for (const key of data.key) {
        data.value.map((item) =>
          extracted.push({
            key: key,
            value: item,
          })
        );
      }
    }

    // Store the Key.
    keyMapping.set(k, new Set());
    orgKeyToExtractedValue.set(k, new Set());

    for (const item of extracted) {
      if (extractedMap.has(item.key)) {
        // If the extracted new key has already been defined,
        // we have to determine whether the stored item matches
        // the allready provided definition.
        if (!equals(extractedMap.get(item.key), item.value)) {
          // Conflict detected
          if (!conflicts.has(item.key)) {
            conflicts.set(item.key, new Set());
          }

          // Store the conflict.
          conflicts.get(item.key).add(item.value);
          conflicts.get(item.key).add(extractedMap.get(item.key));
        } else {
          // Store the determined amount.
          amountOf.set(item.key, (amountOf.get(item.key) || 0) + 1);
        }
      } else {
        // Store the item.
        extractedMap.set(item.key, item.value);

        // Store the determined amount.
        amountOf.set(item.key, (amountOf.get(item.key) || 0) + 1);
      }

      // If the reverse haven't been set ==> create it.
      if (!reverseKeyMapping.has(item.key)) {
        reverseKeyMapping.set(item.key, new Set());
      }

      // Store the mapping of new-key --> org-key.
      reverseKeyMapping.get(item.key).add(k);
      // Store the mapping of org-key --> new-key.
      keyMapping.get(k).add(item.key);
      orgKeyToExtractedValue.get(k).add(item.value);
    }
  }

  return {
    extractedMap,
    keyMapping,
    conflicts,
    keyMappingReverse: reverseKeyMapping,
    orgKeyToExtractedValue,
    amountOf,
  };
}

/**
 * Reverses the given map.
 *
 * If the path is provided, the Data is extracted based on the given path.
 * If the `pathKey`, a different Key is used.
 *
 * @author M.Karkowski
 * @export
 * @template K
 * @template V
 * @param {Map<any,any>} map
 * @param {string} [path=""]
 * @param {string} [pathKey=null]
 * @return {*}  {Map<V, Set<K>>}
 */
export function reverse<K, V>(
  map: Map<any, any>,
  path: string = "",
  pathKey: string = null
): Map<V, Set<K>> {
  const m = new Map<V, Set<K>>();

  if (pathKey === null) {
    pathKey = path;
  }

  for (const [k, v] of map.entries()) {
    let keyToUse = k;
    if (pathKey) {
      keyToUse = rgetattr(v, pathKey, __sentinal);
    }

    let valueToUse = v;
    if (path) {
      valueToUse = rgetattr(v, path, __sentinal);
    }

    if (Array.isArray(valueToUse)) {
      for (const _v of valueToUse) {
        if (!m.has(_v)) {
          m.set(_v, new Set());
        }
        m.get(_v).add(keyToUse);
      }
    } else {
      if (!m.has(valueToUse)) {
        m.set(valueToUse, new Set());
      }
      m.get(valueToUse).add(keyToUse);
    }
  }

  return m;
}
