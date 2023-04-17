/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2022-01-18 13:42:41
 * @modify date 2022-01-18 13:42:43
 * @desc [description]
 */

const { readFileSync, writeFileSync } = require("fs");

const version = readFileSync("./contribute/VERSION", { encoding: "utf-8" });
const package = JSON.parse(readFileSync("./package.json", { encoding: "utf-8" }));

package.description = "NoPE Runtime for the Browser";
delete package.main;
delete package.browser;
delete package.bin;

package.name = "nope-js-browser"
package.browser = "build/nope.js";
package.main = "build/nope.js";
package.version = version;

package.files = [
  "build/**/*",
  "dist-browser/**/*"
];

writeFileSync("./package.json", JSON.stringify(package, undefined, 2), { encoding: "utf-8" });