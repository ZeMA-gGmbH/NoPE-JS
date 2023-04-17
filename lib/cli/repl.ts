/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-07-27 15:45:00
 * @modify date 2021-07-27 15:45:00
 * @desc [description]
 */

import { start } from "repl";
import main from "./runNopeBackend";

/**
 * Starts an interactive console with the loaded dispatcher.
 */
export async function repl(
  additionalArguments: {
    help: string;
    type: "string" | "number";
    name: string | string;
    defaultValue?: any;
  }[] = []
) {
  const loader = await main(
    additionalArguments,
    {
      // skipLoadingConfig: true
    },
    true
  );

  const interactiveConsole = start({});
  // Assing the context
  interactiveConsole.context.dispatcher = loader.dispatcher;
  interactiveConsole.context.loader = loader;
  interactiveConsole.context.nope = require("../index.nodejs");

  // Promise, that will be finished on exiting the interactive console.
  const promise = new Promise((resolve) => {
    interactiveConsole.once("exit", resolve);
  });
  await promise;
  await loader.dispatcher.dispose();
}

// If requested As Main => Perform the Operation.
if (require.main === module) {
  repl().catch(console.error);
}
