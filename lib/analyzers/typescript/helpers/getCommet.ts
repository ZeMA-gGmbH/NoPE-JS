/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-11-06 08:51:48
 * @modify date 2020-11-09 15:39:04
 * @desc [description]
 */

import { parse } from "comment-parser";

/**
 * Helper function to generate a comment.
 *
 * @export
 * @param {string} comment
 * @param {string} [type]
 * @return {*}
 */
export function getComment(comment: string, type?: string) {
  const parsed = parse(comment);

  if (parsed) {
    if (type === undefined || type === null) {
      return parsed.length > 0 ? parsed[0].description : "not provided";
    }

    const result = parsed.length > 0 ? parsed[0] : null;

    if (result) {
      for (const tag of result.tags) {
        if (tag.type == type) {
          return tag.description;
        }
      }
    }
  }
  return "not provided";
}
