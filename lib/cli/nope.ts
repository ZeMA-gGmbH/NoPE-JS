/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { readFile } from "fs/promises";
import {
  readInWriteUiFileArgs,
  writeUiFile,
  main as uploadUi,
} from "../ui/helpers.nodejs";
import { createService } from "./createService";
import { generateDefaultPackageConfig } from "./generateDefaultPackageConfig";
import { interact } from "./interact";
import { project } from "./projectHelper";
import { repl } from "./repl";
import { main as runMain } from "./runNopeBackend";
import { join } from "path";

/**
 * Main Function.
 *
 * @export
 */
export async function main() {
  const args: {
    mode:
      | "run"
      | "project"
      | "none"
      | "conf"
      | "help"
      | "service"
      | "repl"
      | "scan-ui"
      | "upload-ui"
      | "version"
      | "interact";
    params: string[];
  } = {
    mode: (process.argv[2] as any) || "none",
    params: process.argv.slice(3),
  };

  const additionalArg: any = {
    help: "Command to run the backend",
    name: args.mode,
    type: "str",
  };

  const showLog = () => {
    console.log(`NoPE - Command Line Interface.

Please select the option you want. Therefore add one of the following options:
    \x1b[4mhelp\x1b[0m      Show this help.
    \x1b[4mconf\x1b[0m      Generates a new configuration file which will used in \x1b[4mrun\x1b[0m.  
    \x1b[4mrun\x1b[0m       Start a NoPE-Backend.
    \x1b[4mproject\x1b[0m   Helper to create a new Project or add new items to a project.  
    \x1b[4mscan-ui\x1b[0m   Scans and extracts the provided uis.  
    \x1b[4mupload-ui\x1b[0m Uploads the determined ui-file
    \x1b[4mservice\x1b[0m   Generate Helper Files to provide windows/linux-services for your configuration. (autorun)      
    \x1b[4mrepl\x1b[0m      Opens an interactive console (REPL).   
    \x1b[4minteract\x1b[0m  Opens an interactive tool, to inspect the current environment.
    \x1b[4mversion\x1b[0m   Shows the current version    

Have fun using NoPE :)

      *-*,
  ,*\\\/|\`| \\
  \\'  | |'| *,
   \\ \`| | |/ )
    | |'| , /
    |'| |, /
 ___|_|_|_|___
[_____________]
 |           |
 |  This is  |
 |   NoPE!   |
 | Sometimes |
 |   itchy!  |
 |___________|
 
 `);
  };

  switch (args.mode) {
    default:
      showLog();
      break;
    case "help":
      showLog();
      break;
    case "none":
      showLog();
      break;
    case "run":
      additionalArg.help = "Command to run the backend";
      await runMain([additionalArg]);
      break;
    case "project":
      additionalArg.help =
        "Helper to create a new Project or add new items to a project.";
      await project([additionalArg]);
      break;
    case "conf":
      additionalArg.help = "Command to generate the Config of the backend";
      await generateDefaultPackageConfig([additionalArg]);
      break;
    case "service":
      additionalArg.help = "Command to generate the Service Files";
      await createService([additionalArg]);
      break;
    case "repl":
      await repl([additionalArg]);
      break;
    case "scan-ui":
      additionalArg.help =
        "Command to readin the UI-Files and store them in a config";
      await writeUiFile(readInWriteUiFileArgs([additionalArg]));
      break;
    case "upload-ui":
      additionalArg.help = "to upload the determined ui-config.";
      await uploadUi([additionalArg]);
      break;
    case "interact":
      additionalArg.help = "tool for live system interaction.";
      await interact([additionalArg]);
      break;
    case "version":
      const dirName = join(__dirname, "..", "..");
      const packageJson = JSON.parse(
        (await readFile(join(dirName, "package.json"))).toString("utf-8")
      );
      const version = packageJson.version;
      console.log(version);
      break;
  }
}

export default main;

// If requested As Main => Perform the Operation.
if (require.main === module) {
  main().catch((e) => console.error(e));
}
