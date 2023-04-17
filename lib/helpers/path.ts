/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { SPLITCHAR } from "./objectMethods";
import {
  MULTI_LEVEL_WILDCARD,
  SINGLE_LEVEL_WILDCARD,
} from "./pathMatchingMethods";
import { replaceAll, varifyString } from "./stringMethods";

/**
 * Converts the path to a correct path.
 * @param {string} path
 * @returns {string} The Path
 */
export function convertPath(path: string): string {
  return replaceAll(path, [".", "[", ["]", ""]], SPLITCHAR);
}

/**
 * Helper to convert the segments of a path to a valid var name.
 *
 * @param {string} path The Path to adapt
 * @returns {string} The Adapted path.
 */
export function varifyPath(path: string): string {
  // We devided the Path in its segments and make shure, that these segments are
  // called correctly.
  return path
    .split(SPLITCHAR)
    .map((item) => varifyString(item))
    .join(SPLITCHAR);
}

/**
 * Returns the least common segmet of all pathes, included in the pathes array.
 *
 * The Following options are available.
 *
 * "considerSingleLevel":boolean -> allows "singlelevel"-wildcards in the segments
 * "considerMultiLevel":boolean -> allows "multilevel"-wildcards in the segments
 *
 * @param pathes The Segments to compare
 * @param opts Additional Options.
 * @returns
 */
export function getLeastCommonPathSegment(
  pathes: string[],
  opts: {
    considerSingleLevel?: boolean;
    considerMultiLevel?: boolean;
  } = {}
): string | false {
  let currentPath = pathes.pop();

  while (pathes.length > 0) {
    let next = pathes.pop();

    currentPath = _getLeastCommonPathSegment(currentPath, next, opts) as string;

    if (!currentPath) {
      return currentPath;
    }
  }

  return currentPath;
}

function _getLeastCommonPathSegment(
  path01: string,
  path02: string,
  opts: {
    considerSingleLevel?: boolean;
    considerMultiLevel?: boolean;
  } = {}
) {
  const p1 = convertPath(path01).split(SPLITCHAR);
  const p2 = convertPath(path02).split(SPLITCHAR);

  const ret: string[] = [];

  let idx = 0;
  const max = Math.min(p1.length, p2.length);

  while (idx < max) {
    if (p1[idx] == p2[idx]) {
      // Add the Item.
      ret.push(p1[idx]);
    } else if (opts.considerSingleLevel) {
      if (p1[idx] === SINGLE_LEVEL_WILDCARD) {
        // Add the Item.
        ret.push(p2[idx]);
      } else if (p2[idx] === SINGLE_LEVEL_WILDCARD) {
        // Add the Item.
        ret.push(p1[idx]);
      } else {
        break;
      }
    } else if (opts.considerMultiLevel) {
      if (p1[idx] === MULTI_LEVEL_WILDCARD) {
        // Add the Item.
        ret.push(...p2.slice(idx));
        break;
      } else if (p2[idx] === MULTI_LEVEL_WILDCARD) {
        // Add the Item.
        ret.push(...p1.slice(idx));
        break;
      } else {
        break;
      }
    } else {
      break;
    }

    idx += 1;
  }

  if (ret.length) {
    return ret.join(SPLITCHAR);
  }

  return false;
}
