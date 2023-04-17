/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

/**
 * Helper Function to varify the given string.
 * Removes every char which doesn't match a variable name.
 * (a-z, A-Z, 0-9).
 *
 * If `str` starts with an invalid char, (like a number),
 * an underscore is added.
 * @param {string} str the Stirng
 * @returns {string} the adapted name
 */
export function varifyString(str: string): string {
  // Regex to test if the first char is correct.
  const firstCharCorrect = new RegExp("^[_a-zA-Z]", "i");

  const ret = str.replaceAll(new RegExp("[^a-zA-Z0-9]", "g"), "_");

  if (firstCharCorrect.test(ret)) {
    return ret;
  }

  return "_" + ret;
}

/**
 * Replaces all Chars in a String
 * @param str base string
 * @param value the value which should be replaced, Or an array containing the value and replacer
 * @param replacement the value which is used as replacement
 */
export function replaceAll(
  str: string,
  value: string | Array<[string, string] | string>,
  replacement: string = null
): string {
  if (Array.isArray(value)) {
    for (const data of value) {
      if (Array.isArray(data)) {
        str = replaceAll(str, data[0], data[1]);
      } else if (replacement !== null) {
        str = replaceAll(str, data, replacement);
      } else {
        throw Error(
          "Please provide an arry containing a replace or an in replacement."
        );
      }
    }

    return str;
  }

  if (replacement === null) {
    throw Error("Please provide an arry or an in replacement.");
  }

  return str.split(value).join(replacement);
}

/**
 * Function to Pad a String.
 * @param num The Number to pad
 * @param size the amount of zeros to add
 * @param maxLength The max length of the number.
 */
export function padString(
  num: number,
  size: number,
  maxLength = false
): string {
  let _size = size;
  if (typeof maxLength === "boolean" && maxLength) {
    _size = Math.ceil(Math.log10(size));
  }

  let s = num + "";
  while (s.length < _size) {
    s = "0" + s;
  }
  return s;
}

/**
 * Inserts a String in the String
 * @param str base string
 * @param index index where the content should be inserted
 * @param content the content to insert
 */
export function insert(str: string, index: number, content: string): string {
  if (index > 0) {
    return str.substring(0, index) + content + str.substring(index, str.length);
  } else {
    return content + str;
  }
}

/**
 * Helper to capitalize the First letter of a string;
 * @param str The string;
 * @returns
 */
export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Function to Camelize a String
 * @param str The String,
 * @param char A, used to determine "new words"
 */
export function camelize(str: string, char = "_"): string {
  return replaceAll(str, char, " ")
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index == 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
}

/**
 * Function to convert a text to underscore writing (snake-case)
 * @param str The String to convert.
 * @param leadingToSmall If set to true, the function ensures, that the name is converted without a leading underscore.
 * @returns
 */
export function underscore(str: string, leadingToSmall = false) {
  let result = str.replace(/([A-Z])/g, " $1");
  result = result.split(" ").join("_").toLowerCase();

  if (leadingToSmall && result.startsWith("_")) {
    result = result.slice(1);
  }

  return result;
}

/**
 * Helper to limit the string to a specific length. the rest is reduced by the limitChars
 *
 * @author M.Karkowski
 * @export
 * @param {string} str The string to work with
 * @param {number} length The max length including the limitChars
 * @param {string} [limitChars="..."] The chars which should be used to express limiting
 * @return {*}  {{
 *   isLimited: boolean,
 *   original: string,
 *   limited: string,
 * }}
 */
export function limitString(
  str: string,
  length: number,
  limitChars = "..."
): {
  isLimited: boolean;
  original: string;
  limited: string;
} {
  if (str.length > length) {
    return {
      isLimited: true,
      original: str,
      limited: str.slice(0, length - limitChars.length) + limitChars,
    };
  } else {
    return {
      isLimited: false,
      original: str,
      limited: str,
    };
  }
}

/**
 * Helper to insert new lines after a given amount of time.
 * @param str
 * @param maxLength
 * @returns
 */
export function insertNewLines(str: string, maxLength = 100) {
  // now we try to  split the string
  const splitted = str.split(" ");

  const ret: string[] = [];

  let length = 0;

  for (const word of splitted) {
    console.log("test");
    length += word.length + 1;
    ret.push(word);

    if (length > maxLength) {
      ret.push("\n");
      length = 0;
    }
  }

  return ret;
}
