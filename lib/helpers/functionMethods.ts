const RE_EXTRACT_ARGS = /(^[a-z_](?=(=>|=>{)))|((^\([^)].+\)|\(\))(?=(=>|{)))/g;
const RE_VALUE_PARAMS = /(?<=[`"'])([^\`,].+?)(?=[`"'])/g;

/**
 * Helper to extrat the code of the function:
 *
 * @example
 * ```javascript
 * function func(betterMakeSure, itWorksWith, longVariables = 'too') {}
 *
 * const r = extractArgumentsPartFromFunction(func);
 *
 * // => r  = (betterMakeSure,itWorksWith,longVariables='too')
 *
 * ```
 * @param func
 * @returns
 */
export function _extractArgumentsPartFromFunction(func): string {
  /**
   * Based on the given sources:
   *
   * Source: https://stackoverflow.com/questions/42899083/get-function-parameter-length-including-default-params
   * Source: https://stackblitz.com/edit/web-platform-jaxz82?file=script.js
   *
   * added the async related errors.
   */

  let fnStr = func
    .toString()
    .replace("async", "")
    .replace(RegExp(`\\s|function|${func.name}`, `g`), ``);
  fnStr = (fnStr.match(RE_EXTRACT_ARGS) || [fnStr])[0].replace(
    RE_VALUE_PARAMS,
    ``
  );
  return !fnStr.startsWith(`(`) ? `(${fnStr})` : fnStr;
}

/**
 * Helper to count all arguments of an function (including the optional ones.)
 * @param func The function, where we want to count the parameters
 * @returns
 */
export function countAllArguments(func) {
  /**
   * The source of the code:
   * Source: https://stackoverflow.com/questions/42899083/get-function-parameter-length-including-default-params
   * Source: https://stackblitz.com/edit/web-platform-jaxz82?file=script.js
   */

  const params = _extractArgumentsPartFromFunction(func);

  if (params === "()") return 0;

  let [commaCount, bracketCount, bOpen, bClose] = [
    0,
    0,
    [...`([{`],
    [...`)]}`],
  ];
  [...params].forEach((chr) => {
    bracketCount += bOpen.includes(chr) ? 1 : bClose.includes(chr) ? -1 : 0;
    commaCount += chr === "," && bracketCount === 1 ? 1 : 0;
  });
  return commaCount + 1;
}

/**
 * Helper to count the arguments.
 * @param func The function ot be analysed
 * @returns
 */
export function countArguments(func): {
  optional: number;
  static: number;
  total: number;
} {
  const usedArguments = countAllArguments(func);
  return {
    optional: usedArguments - func.length,
    static: func.length,
    total: usedArguments,
  };
}

/**
 * Helper to fill provided arguments for the function.
 * @param func The function ot be analysed
 * @param providedArg The allready provided args
 * @param argsToFill The Arguments to fill
 * @param fromEnd A Flag to toggle, whether the arguments should be filled from the end or the beginning.
 */
export function fillOptionalArguments(
  func,
  providedArg: any[],
  argsToFill: any[],
  fromEnd = true
) {
  const argumentOptions = countArguments(func);

  if (argsToFill.length > argumentOptions.optional) {
    // More arguments provided as possible => give a warning
  }

  if (
    argumentOptions.optional > 0 &&
    argumentOptions.total > providedArg.length
  ) {
    // Fill the arguments
    const left = argumentOptions.total - providedArg.length;
    for (let i = 0; i < left; i++) {
      providedArg.push(undefined);
    }

    // Now we cann fill some arguments.
    const sourceOffset =
      left >= argsToFill.length ? 0 : argsToFill.length - left;
    for (let i = 0; i < argsToFill.length; i++) {
      let idxToWrite = 0;

      if (fromEnd) {
        idxToWrite = argumentOptions.total - argsToFill.length + i;
      } else {
        idxToWrite = argumentOptions.total - left + i;
      }

      providedArg[idxToWrite] = argsToFill[sourceOffset + i];
    }
  }

  return providedArg;
}
