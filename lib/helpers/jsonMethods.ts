/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

const BEGIN_STR = "____Function_beginn/(";
const END_STR = ")/__Function_end";

/**
 * Function to stringify an Object. This Function will stringify Functions as well.
 * @param obj The Object.
 */
export function stringifyWithFunctions(obj, ...args) {
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === "function") {
        let str: string = value.toString();

        // Todo Parse Arrow-Functions Correctly!
        // Details here: https://zendev.com/2018/10/01/javascript-arrow-functions-how-why-when.html
        // Difference Cases For:
        // 1) (a, b) => a + b;
        // 2) array => array[0];
        // 3) (a, b) => (a + b);
        // 4) (name, description) => ({name: name, description: description})
        // ....
        const isAsync = str.startsWith("async ");

        if (isAsync) {
          str = str.slice("async ".length);
        }

        if (!str.startsWith("function") && !str.startsWith("(")) {
          const name = str.slice(0, str.indexOf("=>"));
          const func = str.slice(str.indexOf("=>(") + 3, str.length - 2);
          str = "function(" + name + "){ return " + func + "; }";
        }

        if (isAsync) {
          return BEGIN_STR + "async " + str + END_STR;
        }

        return BEGIN_STR + str + END_STR;
      }
      return value;
    },
    ...args
  );
}

/**
 * Function to parse a JSON String, in which methods should be available.
 * @param json A String containing the json Object
 * @param scope An Scope to use during parsing.
 * @returns
 */
export function parseWithFunctions(
  json: string,
  scope: { [index: string]: any } = {}
) {
  return JSON.parse(json, (key, value) => {
    if (
      typeof value === "string" &&
      value.startsWith(BEGIN_STR) &&
      value.endsWith(END_STR)
    ) {
      const _value = value.substring(
        BEGIN_STR.length,
        value.length - END_STR.length
      );
      try {
        return eval("(" + _value + ")").bind(scope);
      } catch (e) {
        console.log("Failed Parsing function", "\n" + _value);
        console.error(e);
      }
    }
    return value;
  });
}

/**
 * Function to stringify an Object. This Function is able to stringify Functions as well. Use the Flag withFunctions
 * @param obj The Object.
 * @param withFunctions Flag to Turn on / off the parsing of functions
 */
export function stringify(obj: any, withFunctions = false): string {
  if (withFunctions) {
    return stringifyWithFunctions(obj);
  }
  return JSON.stringify(obj);
}

/**
 * Function to parse a JSON String. This Function is able to parse Functions as well. Use the Flag withFunctions
 * @param json A String containing the json Object
 * @param withFunctions Flag to Turn on / off the parsing of functions
 */
export function parse(json: string, withFunctions = false): any {
  if (withFunctions) {
    return parseWithFunctions(json);
  }
  return JSON.parse(json);
}
