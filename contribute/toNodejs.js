/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2022-01-18 13:42:45
 * @modify date 2022-01-18 13:42:48
 * @desc [description]
 */

const { readFileSync, writeFileSync } = require("fs");

const version = readFileSync("./contribute/VERSION", { encoding: "utf-8" });
const package = JSON.parse(readFileSync("./package.json", { encoding: "utf-8" }));

package.description = "NoPE Runtime for Nodejs. For Browser-Support please use nope-browser";
delete package.main;
delete package.browser;

package.bin = {
  "nope-js": "./bin/nope"
};

package.name = "nope-js-node"
package.main = "dist-nodejs/index.nodejs.js";
package.version = version;
package.files = [
  "dist-nodejs/**/*",
  "lib/**/*",
  "bin/*"
];

writeFileSync("./package.json", JSON.stringify(package, undefined, 2), { encoding: "utf-8" });