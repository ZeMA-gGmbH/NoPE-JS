/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-07-27 15:45:00
 * @modify date 2021-07-27 15:45:00
 * @desc [description]
 */

import { ArgumentParser } from "argparse";
import * as inquirer from "inquirer";
import "reflect-metadata";
import { start } from "repl";
import {
  getLayer,
  layerDefaultParameters,
  validLayers,
} from "../communication/getLayer.nodejs";
import { getDispatcher } from "../dispatcher/getDispatcher";
import { dynamicSort } from "../helpers/arrayMethods";
import { objectToMap, SPLITCHAR } from "../helpers/objectMethods";
import { convertPath } from "../helpers/path";
import { padString, replaceAll } from "../helpers/stringMethods";
import { createInteractiveMenu } from "../index.nodejs";
import { getNopeLogger } from "../logger/index.browser";
import { LoggerLevels } from "../logger/nopeLogger";
import {
  ICommunicationBridge,
  INopeModuleDescription,
  INopeObserver,
} from "../types/nope";
import main from "./runNopeBackend";

inquirer.registerPrompt("search-list", require("inquirer-search-list"));

/**
 * Helper to parse JSON-Input.
 *
 * @author M.Karkowski
 * @return {*}
 */
async function getJsonInput() {
  let data: any = null;
  while (data == null) {
    data = (
      await inquirer.prompt([
        {
          type: "input",
          message: "Please enter valid JSON.",
          name: "data",
        },
      ])
    ).data;
    try {
      return JSON.parse(data);
    } catch (e) {
      data = null;
    }
  }

  return JSON.parse(data);
}

export async function interact(
  additionalArguments: {
    help: string;
    type: "string" | "number";
    name: string | string;
    defaultValue?: any;
  }[] = []
): Promise<void> {
  const parser = new ArgumentParser({
    // version: "1.0.0",
    add_help: true,
    description: "Command Line interface, interact with items.",
  });

  for (const arg of additionalArguments) {
    parser.add_argument(arg.name, {
      help: arg.help,
      default: arg.defaultValue,
      type: arg.type,
    });
  }

  parser.add_argument("-s", "--server", {
    help: "The Server to Use.",
    default: "localhost",
    type: "str",
    dest: "uri",
  });

  parser.add_argument("-p", "--port", {
    help: "The Port the Connector",
    default: 7000,
    type: "int",
    dest: "port",
  });

  parser.add_argument("-c", "--channel", {
    help:
      "The Communication Channel, which should be used. Possible Values are: " +
      // Display all Options:
      Object.getOwnPropertyNames(validLayers)
        .map((item) => '"' + item + '"')
        .join(", "),
    default: "io-client",
    type: "str",
    dest: "channel",
  });

  parser.add_argument("-l", "--log", {
    help:
      'Specify the Logger Level. Defaults to "info". Valid values are: ' +
      LoggerLevels.join(", "),
    default: "info",
    type: "str",
    dest: "log",
  });

  const args = parser.parse_args();

  if (!Object.getOwnPropertyNames(validLayers).includes(args.channel)) {
    console.error(
      "Invalid Channel. Please use the following values. " +
        Object.getOwnPropertyNames(validLayers)
          .map((item) => '"' + item + '"')
          .join(", ")
    );
    return;
  }

  if (args.channel === "io-client") {
    args.params = "http://" + args.uri + ":" + args.port.toString();
  } else if (args.channel === "mqtt") {
    args.params = "mqtt://" + args.uri + ":" + args.port.toString();
  } else {
    // Assign the Default Setting for the Channel.
    args.params = layerDefaultParameters[args.channel];
  }

  // Define a Logger
  const logger = getNopeLogger("nope-interact-tool");

  try {
    logger.info(
      "Connecting to http://" + args.uri + ":" + args.port.toString()
    );

    const loader = await main(
      additionalArguments,
      {
        skipLoadingConfig: true,
        channel: args.channel,
        channelParams: args.params,
        id: "nope-interact-tool",
        useBaseServices: true,
      },
      true
    );

    const dispatcher = loader.dispatcher;

    await dispatcher.ready.waitFor();
    await dispatcher.connectivityManager.emitBonjour();

    logger.info("Connected to http://" + args.uri + ":" + args.port.toString());

    const dataSubscriptions: { [index: string]: INopeObserver } = {};
    const eventSubscriptions: { [index: string]: INopeObserver } = {};

    await createInteractiveMenu([
      {
        name: "inspect -       Operations to inspect the NoPE-System",
        value: "inspect",
        type: "menu",
        items: [
          {
            name: "dispatchers -            Show available Dispatchers",
            value: "show-dispatchers",
            type: "item",
            async onSelect() {
              // Show  the hosts:
              console.log("The following dispatchers has been found:");
              for (const dispatcherId of dispatcher.connectivityManager.dispatchers.data.getContent()) {
                console.log(" *\t", dispatcherId);
              }
            },
          },
          {
            name: "hosts -                  Show available Hosts",
            value: "show-hosts",
            type: "item",
            async onSelect() {
              // Show  the hosts:
              console.log("The following host has been found:");
              for (const host of dispatcher.connectivityManager
                .getAllHosts()
                .sort()) {
                console.log(" *\t", host);
              }
            },
          },
          {
            name: "instances -              Show available Instances",
            value: "show-instances",
            type: "item",
            async onSelect() {
              if (
                dispatcher.instanceManager.instances.data.getContent().length >
                0
              ) {
                console.log("The following instances are available:");

                const length =
                  dispatcher.instanceManager.instances.data.getContent().length;
                for (const [
                  idx,
                  instance,
                ] of dispatcher.instanceManager.instances.data
                  .getContent()
                  .sort(dynamicSort("identifier"))
                  .entries()) {
                  console.log(
                    ` ${padString(idx + 1, length + 1, true)}.\t${
                      instance.identifier
                    }<${instance.type}>`
                  );
                }
              } else {
                console.log("No instances has been found.");
              }
            },
          },
          {
            name: "types -                  Show the types of the instances.",
            value: "show-instance-types",
            type: "item",
            async onSelect() {
              if (
                dispatcher.instanceManager.instances.data.getContent().length >
                0
              ) {
                const types = new Set<string>();
                const typesAmount: { [index: string]: number } = {};
                dispatcher.instanceManager.instances.data
                  .getContent()
                  .map((item) => {
                    types.add(item.type);
                    typesAmount[item.type] = (typesAmount[item.type] || 0) + 1;
                  });
                console.log("The following types has been found:");
                for (const [idx, t] of [...types].sort().entries()) {
                  console.log(
                    ` ${padString(idx + 1, types.size + 1, true)}.\t<${t}>:${
                      typesAmount[t]
                    }`
                  );
                }
              } else {
                console.log("No instance available");
              }
            },
          },
          {
            name: "constructors -           Show available Constructors",
            value: "show-constructors",
            type: "item",
            async onSelect() {
              if (
                dispatcher.instanceManager.constructors.data.getContent()
                  .length > 0
              ) {
                console.log("The following constructors are available:");
                const length =
                  dispatcher.instanceManager.constructors.data.getContent()
                    .length;

                const ctorIds = dispatcher.rpcManager.services.data
                  .getContent()
                  .map((service) => service.id);
                for (const [idx, id] of ctorIds.entries()) {
                  console.log(
                    ` ${padString(idx + 1, length + 1, true)}.\t${id}`
                  );
                }
              } else {
                console.log("No constructor are available.");
              }
            },
          },
          {
            name: "services -               Show available Services",
            value: "show-services",
            type: "item",
            async onSelect() {
              if (dispatcher.rpcManager.services.data.getContent().length > 0) {
                console.log("The following services are available:");
                const length =
                  dispatcher.rpcManager.services.data.getContent().length;

                const serviceIds = dispatcher.rpcManager.services.data
                  .getContent()
                  .map((service) => service.id);
                for (const [idx, id] of serviceIds.entries()) {
                  console.log(
                    ` ${padString(idx + 1, length + 1, true)}.\t${id}`
                  );
                }
              } else {
                console.log("No services are available.");
              }
            },
          },
          {
            name: "base-services -          Show available Services",
            value: "show-base-services",
            type: "item",
            async onSelect() {
              const baseServices: string[] = Object.getOwnPropertyNames(
                dispatcher["services"] || {}
              );
              if (baseServices.length > 0) {
                console.log("The following base services are available:");
                const length = baseServices.length;
                for (const [idx, id] of baseServices.entries()) {
                  console.log(
                    ` ${padString(idx + 1, length + 1, true)}.\t${id}`
                  );
                }
              } else {
                console.log("No services are available.");
              }
            },
          },
          {
            name: "events -                 Show subscribed Events",
            value: "show-subscribed-events",
            type: "item",
            async onSelect() {
              // Filter the hosts:
              if (dispatcher.eventDistributor.emitters.subscribers.length > 0) {
                console.log("The following events are susbcribed:");
                const subscribers =
                  dispatcher.eventDistributor.emitters.subscribers;
                const length = subscribers.length;
                for (const [idx, events] of subscribers.sort().entries()) {
                  console.log(
                    ` ${padString(idx + 1, length + 1, true)}.\t${events}`
                  );
                }
              } else {
                console.log(
                  "No event has been subscribed has been subscribed."
                );
              }
            },
          },
          {
            name: "events -                 Show published Events",
            value: "show-published-events",
            type: "item",
            async onSelect() {
              // Show the published events.
              if (dispatcher.eventDistributor.emitters.publishers.length > 0) {
                console.log("The following event emitters are registered:");
                const publishers =
                  dispatcher.eventDistributor.emitters.publishers;
                const length = publishers.length;
                for (const [idx, events] of publishers.sort().entries()) {
                  console.log(
                    ` ${padString(idx + 1, length + 1, true)}.\t${events}`
                  );
                }
              } else {
                console.log("No known event emitter are registered.");
              }
            },
          },
          {
            name: "show-subscribed-data -   Show subscribed data listeners",
            value: "show-subscribed-data",
            type: "item",
            async onSelect() {
              if (dispatcher.dataDistributor.emitters.subscribers.length > 0) {
                console.log("The following events are susbcribed:");
                const subscribers =
                  dispatcher.eventDistributor.emitters.subscribers;
                const length = subscribers.length;
                for (const [idx, events] of subscribers.sort().entries()) {
                  console.log(
                    ` ${padString(idx + 1, length + 1, true)}.\t${events}`
                  );
                }
              } else {
                console.log("No known data-hooks are known.");
              }
            },
          },
          {
            name: "show-published-data -    Show available data emitters",
            value: "show-published-data",
            type: "item",
            async onSelect() {
              if (dispatcher.dataDistributor.emitters.publishers.length > 0) {
                console.log("The following event emitters are registered:");
                const publishers =
                  dispatcher.eventDistributor.emitters.publishers;
                const length = publishers.length;
                for (const [idx, events] of publishers.sort().entries()) {
                  console.log(
                    ` ${padString(idx + 1, length + 1, true)}.\t${events}`
                  );
                }
              } else {
                console.log("No known publishing properties are registered.");
              }
            },
          },
        ],
      },
      {
        type: "menu",
        name: "execute -       Operations to execute a service of the NoPE-System, or create an instance.",
        value: "execute",
        items: [
          {
            name: "execute-service -      Execute a service",
            value: "execute-service",
            type: "item",
            async onSelect() {
              let services = dispatcher.rpcManager.services.data
                .getContent()
                .map((service) => service.id);
              services = services.filter(
                (service) =>
                  !dispatcher.instanceManager.constructorServices
                    .getContent()
                    .includes(service)
              );

              if (services.length > 0) {
                const service = (
                  await inquirer.prompt([
                    {
                      type: "search-list",
                      message: "Select the operation service to perform",
                      name: "service",
                      choices: services.sort(),
                    },
                  ])
                ).service;

                const description =
                  dispatcher.rpcManager.services.simplified.get(service);

                if (description.schema) {
                  const text = replaceAll(
                    JSON.stringify(description.schema, undefined, 4),
                    "\n",
                    "\n\t"
                  );
                  console.log(
                    `The schema of "${service}" is definend as follows:\n\t${text}`
                  );

                  console.log(
                    "Please enter the parameters based on the schema"
                  );
                } else {
                  console.log(
                    "The Service you have selected did not provide any schema. That is bad practice. Please contact the Author :("
                  );

                  console.log(
                    "Please enter the parameters (which is hard now ...) for the Method. "
                  );
                }

                const parameters = await getJsonInput();

                console.log("You have provided the following parameters.");
                console.log(parameters);

                try {
                  const result = await dispatcher.rpcManager.performCall(
                    service,
                    parameters,
                    {
                      timeout: 5,
                    }
                  );

                  console.log("Received the following result:");
                  console.log("\n> ", result, "\n");
                } catch (e) {
                  console.error("An Error occurd during the call");
                  console.error(e);
                }
              } else {
                console.error("No services are available.");
              }
            },
          },
          {
            name: "execute-base-service - Execute a service",
            value: "execute-base-service",
            type: "item",
            async onSelect() {
              const services: string[] = Object.getOwnPropertyNames(
                dispatcher["services"] || {}
              );

              if (services.length > 0) {
                const service = (
                  await inquirer.prompt([
                    {
                      type: "search-list",
                      message: "Select the operation service to perform",
                      name: "service",
                      choices: services.sort(),
                    },
                  ])
                ).service;

                const func = dispatcher["services"][service];

                console.log(`The schema of "${service}" is not know.`);

                console.log("Please enter the paramters based on the schema");

                const parameters = await getJsonInput();

                console.log(parameters);

                try {
                  const result = await func(...parameters);

                  console.log("Received the following result:");
                  console.log("\n> ", result, "\n");
                } catch (e) {
                  console.error("An Error occurd during the call");
                  console.error(e);
                }
              } else {
                console.error("No services are available.");
              }
            },
          },
          {
            name: "execute-instance -     Execute a service of a instance",
            value: "execute-instance",
            type: "item",
            async onSelect() {
              if (
                dispatcher.instanceManager.instances.data.getContent().length >
                0
              ) {
                const instanceName = (
                  await inquirer.prompt([
                    {
                      type: "search-list",
                      message: "Select the instance",
                      name: "instance",
                      choices: dispatcher.instanceManager.instances.data
                        .getContent()
                        .sort(dynamicSort("identifier"))
                        .map((item) => {
                          return {
                            name: item.identifier + "<" + item.type + ">",
                            value: item.identifier,
                          };
                        }),
                    },
                  ])
                ).instance;
                const instanceDescription =
                  dispatcher.instanceManager.getInstanceDescription(
                    instanceName
                  ) as INopeModuleDescription;

                if (instanceDescription) {
                  const service = (
                    await inquirer.prompt([
                      {
                        type: "search-list",
                        message: "Select the instance",
                        name: "service",
                        choices: Object.keys(
                          instanceDescription.methods
                        ).sort(),
                      },
                    ])
                  ).service;

                  try {
                    // No Parameters are required
                    logger.info("Generating Accessor");
                    const instance =
                      await dispatcher.instanceManager.createInstance({
                        identifier: instanceDescription.identifier,
                        type: instanceDescription.type,
                        params: [],
                      });
                    logger.info("Accessor Generated");
                    // Now we know, which service we are trying to call.
                    if (
                      instanceDescription.methods[service].schema?.inputs
                        ?.length == 0
                    ) {
                      try {
                        // Now we execute the service
                        const serviceResult = await instance[service]();
                        logger.info("executed: ", instanceName + "." + service);
                        logger.info("result=", serviceResult);
                      } catch (e) {
                        logger.error(
                          "Failed to execute ",
                          instanceName + "." + service
                        );
                        logger.error(e);
                      }
                    } else {
                      logger.info(
                        "Please Enter the parameters. Enter them as JSON-Array:"
                      );
                      console.log(
                        "\n\nSchema-Defintion:\n----------------------------\n\n",
                        JSON.stringify(
                          instanceDescription.methods[service].schema?.inputs ||
                            [],
                          undefined,
                          4
                        )
                      );

                      const input = await getJsonInput();
                      // Now we execute the service
                      const serviceResult = await instance[service](...input);
                      logger.info("executed: ", instanceName + "." + service);
                      logger.info("result=", serviceResult);
                    }
                  } catch (e) {
                    logger.error("Failed to create an accessor");
                  }
                } else {
                  console.log(
                    "No services for the instance found :(. They might not be defined."
                  );
                }
              } else {
                console.log("No instance are available.");
              }
            },
          },
          {
            name: "create-instance -      Creates a new instance",
            value: "create-instance",
            type: "item",
            async onSelect() {
              let ctors =
                dispatcher.instanceManager.constructors.data.getContent();

              if (ctors.length > 0) {
                const type = (
                  await inquirer.prompt([
                    {
                      type: "search-list",
                      message: "Select a constructor-type",
                      name: "type",
                      choices: ctors.sort(),
                    },
                  ])
                ).type;

                const identifier = (
                  await inquirer.prompt([
                    {
                      type: "input",
                      message:
                        "Please enter an identifier. Use only valid names.",
                      name: "identifier",
                    },
                  ])
                ).identifier;

                console.log("Please enter the paramters based on the schema");
                const params = await getJsonInput();

                await dispatcher.instanceManager.createInstance({
                  identifier,
                  type,
                  params,
                });
              } else {
                console.log("No services are available.");
              }
            },
          },
        ],
      },
      {
        name: "data -          Operations to work with data of the NoPE-System",
        value: "data",
        type: "menu",
        items: [
          {
            name: "show-data -          show current data",
            value: "show-data",
            type: "item",
            async onSelect() {
              let path = "";
              let assembledPath = "";
              let finished = true;

              while (finished) {
                const data = dispatcher.dataDistributor.pullData(
                  assembledPath,
                  {}
                );
                const choices = Object.getOwnPropertyNames(data).sort();

                choices.push("-> Select Path");

                if (choices.length === 0) {
                  break;
                }

                path = (
                  await inquirer.prompt([
                    {
                      type: "search-list",
                      message: "Select the data to show.",
                      name: "dataPath",
                      choices,
                    },
                  ])
                ).dataPath;

                if (path === "-> Select Path") {
                  break;
                }

                if (assembledPath.length > 0) {
                  assembledPath += SPLITCHAR;
                }

                assembledPath += path;
              }

              // Filter the hosts:
              if (assembledPath) {
                const data = dispatcher.dataDistributor.pullData(
                  assembledPath,
                  {}
                );
                // Now render the content
                console.group();
                console.log(data);
                console.groupEnd();
              } else {
                logger.warn("No data present.");
              }
            },
          },
          {
            name: "set-available-data - manipulate already existing data.",
            value: "set-available-data",
            type: "item",
            async onSelect() {
              let path = "";
              let assembledPath = "";
              let finished = true;

              while (finished) {
                const data = dispatcher.dataDistributor.pullData(
                  assembledPath,
                  {}
                );
                const choices = Object.getOwnPropertyNames(data).sort();

                choices.push("-> Select Path");

                if (choices.length === 0) {
                  break;
                }

                path = (
                  await inquirer.prompt([
                    {
                      type: "search-list",
                      message: "Select the data to show.",
                      name: "dataPath",
                      choices,
                    },
                  ])
                ).dataPath;

                if (path === "-> Select Path") {
                  break;
                }

                if (assembledPath.length > 0) {
                  assembledPath += SPLITCHAR;
                }

                assembledPath += path;
              }

              if (assembledPath) {
                const data = await getJsonInput();

                try {
                  // Dont gets an update.
                  await dispatcher.dataDistributor.pushData(
                    assembledPath,
                    data,
                    {
                      sender: "nope-cli",
                    }
                  );
                } catch (e) {
                  logger.warn("failed to update the data");
                  logger.error(e);
                }
              } else {
                logger.warn("No Preset data available use 'set-data'");
              }
            },
          },
          {
            name: "set-data -           manipulate / add data manually",
            value: "set-data",
            type: "item",
            async onSelect() {
              // Show all Elements / Properties
              let dataPath = (
                await inquirer.prompt([
                  {
                    type: "input",
                    name: "dataPath",
                    message:
                      "Enter the data path. Please use '/' as seperator or valid js-notation",
                  },
                ])
              ).dataPath;

              dataPath = convertPath(dataPath);

              const data = await getJsonInput();

              try {
                // Dont gets an update.
                dispatcher.dataDistributor.patternBasedPush(dataPath, data, {
                  sender: "nope-cli",
                });
              } catch (e) {
                logger.warn("failed to update the data");
                logger.error(e);
              }
            },
          },
        ],
      },
      {
        name: "subscriptions - Listen to events or data-changes or unsubscribe them.",
        value: "subscriptions",
        type: "menu",
        items: [
          {
            name: "subscribe-data -         add a listener for data changes",
            value: "subscribe-data",
            type: "item",
            async onSelect() {
              const pathes =
                dispatcher.dataDistributor.publishers.data.getContent();

              let dataPath: string = null;

              if (pathes.length > 0) {
                // Show all Elements / Properties
                dataPath = (
                  await inquirer.prompt([
                    {
                      type: "search-list",
                      message: "Select the data to subscribe.",
                      name: "dataPath",
                      choices: Array.from(pathes.keys()).sort(),
                    },
                  ])
                ).dataPath;
              } else {
                dataPath = (
                  await inquirer.prompt([
                    {
                      type: "input",
                      name: "dataPath",
                      message:
                        "Enter the data path. Please use '/' as seperator or valid js-notation",
                    },
                  ])
                ).dataPath;
              }

              if (dataSubscriptions[dataPath] !== undefined) {
                console.log("Already subscribed!");
                return;
              }

              dataSubscriptions[dataPath] =
                dispatcher.dataDistributor.registerSubscription(
                  dataPath,
                  (content, rest) => {
                    try {
                      logger.info(
                        `data on '${dataPath}' changed to =`,
                        content
                      );
                    } catch (e) {
                      logger.warn("failed to update the data");
                      logger.error(e);
                    }
                  }
                );
            },
          },
          {
            name: "unsubscribe-from-data -  add a listener for data changes",
            value: "unsubscribe-data",
            type: "item",
            async onSelect() {
              const pathes = Object.getOwnPropertyNames(dataSubscriptions);
              let dataPath: string = null;

              if (pathes.length > 0) {
                // Show all Elements / Properties
                dataPath = (
                  await inquirer.prompt([
                    {
                      type: "search-list",
                      message: "Select the data to unsubscribe.",
                      name: "dataPath",
                      choices: pathes.sort(),
                    },
                  ])
                ).dataPath;

                dataSubscriptions[dataPath].unsubscribe();
                delete dataSubscriptions[dataPath];
              } else {
                console.log("No data listeners are known!");
              }
            },
          },
          {
            name: "subscribe-event -        add a listener for emitted events",
            value: "subscribe-event",
            type: "item",
            async onSelect() {
              const pathes =
                dispatcher.eventDistributor.publishers.data.getContent();

              let dataPath: string = null;

              if (pathes.length > 0) {
                // Show all Elements / Properties
                dataPath = (
                  await inquirer.prompt([
                    {
                      type: "search-list",
                      message: "Select the event to subscribe.",
                      name: "dataPath",
                      choices: pathes.sort(),
                    },
                  ])
                ).dataPath;
              } else {
                dataPath = (
                  await inquirer.prompt([
                    {
                      type: "input",
                      name: "dataPath",
                      message:
                        "Enter the path of the event to listen on. Please use '/' as seperator or valid js-notation",
                    },
                  ])
                ).dataPath;
              }

              if (eventSubscriptions[dataPath] !== undefined) {
                console.log("Already subscribed!");
                return;
              }

              eventSubscriptions[dataPath] =
                dispatcher.dataDistributor.registerSubscription(
                  dataPath,
                  (content, rest) => {
                    try {
                      logger.info(
                        `event on '${dataPath}'. Event-Data=`,
                        content
                      );
                    } catch (e) {
                      logger.warn("failed to update the data");
                      logger.error(e);
                    }
                  }
                );
            },
          },
          {
            name: "unsubscribe-from-event - add a listener for data changes",
            value: "unsubscribe-data",
            type: "item",
            async onSelect() {
              const pathes = Object.getOwnPropertyNames(eventSubscriptions);
              let dataPath: string = null;

              if (pathes.length > 0) {
                // Show all Elements / Properties
                dataPath = (
                  await inquirer.prompt([
                    {
                      type: "search-list",
                      message: "Select the data to unsubscribe.",
                      name: "dataPath",
                      choices: pathes.sort(),
                    },
                  ])
                ).dataPath;

                eventSubscriptions[dataPath].unsubscribe();
                delete eventSubscriptions[dataPath];
              } else {
                console.log("No data listeners are known!");
              }
            },
          },
        ],
      },
      {
        name: "repl -          switch to repl mode",
        value: "repl",
        type: "item",
        async onSelect() {
          const interactiveConsole = start({});
          // Assing the context
          interactiveConsole.context.dispatcher = dispatcher;
          interactiveConsole.context.nope = require("../index.nodejs");

          // Promise, that will be finished on exiting the interactive console.
          const promise = new Promise((resolve) => {
            interactiveConsole.once("exit", resolve);
          });
          await promise;
        },
      },
    ]);
  } catch (e) {
    logger.error("Something went wrong");
    logger.error(e);
  }
}

// If requested As Main => Perform the Operation.
if (require.main === module) {
  interact();
}
