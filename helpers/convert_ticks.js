/**
 * to run the 
 * https://nodejs.org/en/docs/guides/simple-profiling/
 */

const listFiles = require('../dist-nodejs/helpers/fileMethods').listFiles;
const { exec } = require("child_process");
const { promisify } = require("util")

const execAsync = promisify(exec);

async function main() {
  const tick_files = await listFiles("./", "-v8.log")

  const promises = [];

  for (const file in tick_files) {
    console.log(`converting ${file}`)
    promises.push(
      execAsync(`node --prof-process ${file} > ${file}.txt`)
    )
  }

  await Promise.all(promises)
}

main().catch(console.error)
