/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { SPLITCHAR } from "./objectMethods";
export const SEPARATOR = "/";
export const SINGLE_LEVEL_WILDCARD = "+";
export const MULTI_LEVEL_WILDCARD = "#";

export interface TPathCompareResult {
  /**
   * The Path to access the data. If a pattern is required to extract the
   * data, this property is set to false and the property "patternToExtractData"
   * is filled with the pattern.
   *
   * The PathToExtractData is allways false, if the path is smaller then the
   * pattern
   *
   * @example path = "a/b/c"; pattern = "a/#"; => pathToExtractData = "a/b/c"
   * @example path = "a"; pattern = "a/b/#"; => pathToExtractData = false
   *
   * @author M.Karkowski
   * @type {(string | false)}
   * @memberof TPathCompareResult
   */
  pathToExtractData: string | false;

  /**
   * The Pattern to access the data. If no pattern is required to extract the
   * data, this property is set to false and the property "pathToExtractData"
   * is filled with the defined path. If the path is longer than the pattern,
   * than we need to extract the data.
   *
   * @example path = "a/b/c"; pattern = "a/#"; => patternToExtractData = "a/#"
   * @example path = "a"; pattern = "a/b/#"; => patternToExtractData = "a/b/#"
   * @example path = "a"; pattern = "a"; => patternToExtractData = false
   * @example path = "a/b"; pattern = "a"; => patternToExtractData = false
   *
   * @author M.Karkowski
   * @type {(string | false)}
   */
  patternToExtractData: string | false;

  /**
   * True if the pattern is shorter / equals the pattern and matches.
   * This means, the path changes a child attribue of the data requested
   * by the path.
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof TPathCompareResult
   */
  affectedByChild: boolean;

  /**
   * Generally set to true if the pattern is longer then the
   * path, but they still match in the beginning. This means,
   * the parent might change the data requested with this pattern
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof TPathCompareResult
   */
  affectedByParent: boolean;

  /**
   * Generally set to true if the size pf the pattern matches then the
   * path. This means the data requested with this pattern if directly
   * changed by the path.
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof TPathCompareResult
   */
  affectedOnSameLevel: boolean;

  /**
   * Shows that there might be matcht. Just the combination of
   * affectedByChild | affectedOnSameLevel | affectedByChild
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof TPathCompareResult
   */
  affected: boolean;

  /**
   * Flag, indicating whether the pattern contains a pattern or is just
   * a regular path.
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof TPathCompareResult
   */
  containsWildcards: boolean;

  /**
   * A Flag showing, that the pattern contains more segments than
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof TPathCompareResult
   */
  patternLengthComparedToPathLength: ">" | "=" | "<";
}

export type TcomparePatternAndPathFunc = (
  pattern: string,
  path: string,
  options?: {
    matchTopicsWithoutWildcards?: boolean;
  }
) => TPathCompareResult;

/**
 * Helper to generate a Result.
 *
 * @author M.Karkowski
 * @export
 * @param {Partial<TPathCompareResult>} [res={}]
 * @return {*}  {TPathCompareResult}
 */
export function generateResult(
  res: Partial<TPathCompareResult> = {}
): TPathCompareResult {
  let defaultResult: TPathCompareResult = {
    affected: false,
    affectedByChild: false,
    affectedByParent: false,
    affectedOnSameLevel: false,
    containsWildcards: false,
    patternToExtractData: false,
    patternLengthComparedToPathLength: "=",
    pathToExtractData: false,
  };
  defaultResult = Object.assign(defaultResult, res);
  defaultResult.affected =
    defaultResult.affectedByChild ||
    defaultResult.affectedByParent ||
    defaultResult.affectedOnSameLevel;
  return Object.assign(defaultResult, res);
}

/**
 * Matches the given path, with the pattern and determines, if the path might affect
 * the given pattern.
 *
 * @example path = "a/b/c"; pattern = "a/#"; => totalPath = "a/b/c"; diffPath = "b/c"
 * @author M.Karkowski
 * @export
 * @param {string} pathPattern The pattern to test
 * @param {string} contentPath The path to use as basis
 * @return {TPathCompareResult}
 */
export function comparePatternAndPath(
  pathPattern: string,
  contentPath: string,
  options: {
    matchTopicsWithoutWildcards?: boolean;
  } = {
    matchTopicsWithoutWildcards: false,
  }
): TPathCompareResult {
  if (containsWildcards(contentPath)) {
    throw Error(
      "The Path is invalid. The path should not contain pattern-related chars '#' or '+'."
    );
  }
  if (!patternIsValid(pathPattern)) {
    throw Error("The Pattern is invalid.");
  }
  if (!patternIsValid(contentPath)) {
    throw Error("The Path is invalid.");
  }

  const _containsWildcards = containsWildcards(pathPattern);
  const patternSegments = pathPattern.split(SEPARATOR);
  const contentPathSegments = contentPath.split(SEPARATOR);

  const patternLength = patternSegments.length;
  const contentPathLength = contentPathSegments.length;

  // Define the Char for the comparer
  let patternLengthComparedToPathLength: ">" | "=" | "<" = "=";
  if (patternLength > contentPathLength)
    patternLengthComparedToPathLength = ">";
  else if (patternLength < contentPathLength)
    patternLengthComparedToPathLength = "<";

  // If both, the pattern and the path are equal => return the result.
  if (pathPattern === contentPath) {
    return generateResult({
      affectedOnSameLevel: true,
      pathToExtractData: contentPath,
      patternLengthComparedToPathLength,
    });
  }

  // If the Path is not realy defined.
  if (contentPath === "") {
    return generateResult({
      affectedByParent: true,
      patternToExtractData: _containsWildcards ? pathPattern : false,
      pathToExtractData: _containsWildcards ? false : pathPattern,
      patternLengthComparedToPathLength: ">",
      containsWildcards: _containsWildcards,
    });
  }
  if (pathPattern === "") {
    return generateResult({
      affectedByChild: true,
      pathToExtractData: "",
      patternLengthComparedToPathLength: "<",
    });
  }

  if (options.matchTopicsWithoutWildcards) {
    if (contentPath.startsWith(pathPattern)) {
      // Path is longer then the Pattern;
      // => A Change is performed by "Child",
      if (_containsWildcards) {
        return generateResult({
          affectedByChild: true,
          pathToExtractData: contentPath,
          patternLengthComparedToPathLength: patternLengthComparedToPathLength,
          containsWildcards: _containsWildcards,
        });
      } else {
        return generateResult({
          affectedByChild: true,
          pathToExtractData: pathPattern,
          patternLengthComparedToPathLength: patternLengthComparedToPathLength,
          containsWildcards: _containsWildcards,
        });
      }
    } else if (pathPattern.startsWith(contentPath)) {
      // Pattern is longer then the path;
      // => A Change might be initated by
      // the super element

      // The PathToExtractData is allways false, if the path is smaller then the
      // pattern

      if (_containsWildcards) {
        return generateResult({
          affectedByParent: true,
          patternToExtractData: pathPattern,
          patternLengthComparedToPathLength: patternLengthComparedToPathLength,
          containsWildcards: _containsWildcards,
        });
      } else {
        return generateResult({
          affectedByParent: true,
          // No Pattern is used.
          pathToExtractData: pathPattern,
          patternLengthComparedToPathLength: patternLengthComparedToPathLength,
          containsWildcards: _containsWildcards,
        });
      }
    }
  }
  let partialPath = "";

  // Iterate over the Segments.
  for (let i = 0; i < patternLength; i++) {
    // Store the current Pattern Segment
    const currentPattern = patternSegments[i];

    // We need to know, if there is SINGLE_LEVEL_WILDCARD or MULTI_LEVEL_WILDCARD
    // there fore we will extract the Wildlevels.
    const patternChar = currentPattern[0];
    const currentPath = contentPathSegments[i];

    if (currentPath === undefined) {
      // Our Pattern is larger then our contentPath.
      // So we dont know, whether we will get some
      // data. Therefore we have to perform a query
      // later ==> Set The Path / Pattern.

      if (_containsWildcards) {
        // But we contain Patterns.
        // So we are not allowed to build a
        // diff object.
        return generateResult({
          affectedByParent: true,
          patternToExtractData: pathPattern,
          patternLengthComparedToPathLength: patternLengthComparedToPathLength,
          containsWildcards: _containsWildcards,
        });
      } else if (patternLengthComparedToPathLength === ">") {
        // Fixing: it is possible to have a longer
        return generateResult({
          affectedByParent: true,
          pathToExtractData: pathPattern,
          patternLengthComparedToPathLength: patternLengthComparedToPathLength,
          containsWildcards: _containsWildcards,
        });
      } else {
        throw Error("Implementation Error! This should not happen.");
      }
    } else if (currentPath == currentPattern) {
      // The Patterns Match
      // We now store the correct path of our segment.
      partialPath =
        partialPath.length > 0
          ? `${partialPath}${SEPARATOR}${currentPath}`
          : currentPath;
    } else if (patternChar === MULTI_LEVEL_WILDCARD) {
      // We know, that MULTI_LEVEL_WILDCARDs are only at the end of the
      // pattern. So it might happen, that:
      // a)   our length of the pattern is the same length as the content path
      // b)   our length of the pattern is smaller then length as the content path
      //
      // Our statement before alread tested, that either case a) or b) fits. Otherwise
      // another ifstatement is valid and we wont enter this statement here.

      // // We add the segment to testedCorrectPath
      // testedCorrectPath = testedCorrectPath.length > 0 ? `${testedCorrectPath}${SEPARATOR}${currentPath}` : currentPath;

      if (patternLengthComparedToPathLength == "=") {
        // Case a)
        return generateResult({
          affectedOnSameLevel: true,
          pathToExtractData: contentPath,
          patternLengthComparedToPathLength,
          containsWildcards: _containsWildcards,
        });
      } else if (patternLengthComparedToPathLength == "<") {
        // Case b)
        return generateResult({
          affectedByChild: true,
          pathToExtractData: contentPath,
          patternLengthComparedToPathLength,
          containsWildcards: _containsWildcards,
        });
      } else {
        throw Error("Implementation Error!");
      }
    } else if (patternChar === SINGLE_LEVEL_WILDCARD) {
      // Store the correct path.
      partialPath =
        partialPath.length > 0
          ? `${partialPath}${exports.SEPARATOR}${currentPath}`
          : currentPath;
    } else if (
      patternChar !== SINGLE_LEVEL_WILDCARD &&
      currentPattern !== currentPath
    ) {
      return generateResult({
        patternLengthComparedToPathLength: patternLengthComparedToPathLength,
        containsWildcards: _containsWildcards,
      });
    }
  }

  const diff = contentPath.slice(partialPath.length + 1);

  return generateResult({
    affectedOnSameLevel: diff.length == 0,
    affectedByChild: diff.length >= 1,
    pathToExtractData: partialPath,
    patternLengthComparedToPathLength,
    containsWildcards: _containsWildcards,
  });
}

/**
 * Determines, whether the given string contains a single level card or not.
 *
 * @author M.Karkowski
 * @export
 * @param {string} str String to check
 * @return {*}  {boolean}
 */
export function containsWildcards(str: string): boolean {
  return (
    str.includes(SINGLE_LEVEL_WILDCARD) || str.includes(MULTI_LEVEL_WILDCARD)
  );
}

/**
 * Function to test if a pattern is valid
 *
 *
 * @author M.Karkowski
 * @export
 * @param {string} str
 * @return {*}  {boolean}
 */
export function patternIsValid(str: string): boolean {
  if (str === "") {
    return true;
  }

  const splitted = str.split(SPLITCHAR);
  const lastIndex = splitted.length - 1;
  return splitted
    .map((value, idx) => {
      if (value) {
        if (value === MULTI_LEVEL_WILDCARD) {
          return idx === lastIndex;
        }
        return true;
      }
      return false;
    })
    .reduce((prev, current) => {
      return prev && current;
    }, true);
}
