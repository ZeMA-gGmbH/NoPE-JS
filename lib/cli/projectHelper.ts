/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { ArgumentParser } from "argparse";
import { readFileSync } from "fs";
import * as inquirer from "inquirer";
import { createFile, createInteractiveMenu } from "../index.nodejs";
import { getNopeLogger } from "../logger/index.browser";
import {
  addModuleToProject,
  addServiceToProject,
  createProject,
  generateDefaultProject,
  IProjectFile,
} from "../templates/handle.templates";

inquirer.registerPrompt("search-list", require("inquirer-search-list"));

export async function project(
  additionalArguments: {
    help: string;
    type: "string" | "number";
    name: string | string;
    defaultValue?: any;
  }[] = []
): Promise<void> {
  const parser = new ArgumentParser({
    add_help: true,
    description:
      "Command Line interface, to create new \x1b[4mnope\x1b[0m projects. Additionally the tool allows the user to add \x1b[4mservices\x1b[0m (stateless) or \x1b[4mmodules\x1b[0m",
  });

  for (const arg of additionalArguments) {
    parser.add_argument(arg.name, {
      help: arg.help,
      default: arg.defaultValue,
      type: arg.type,
    });
  }

  parser.add_argument({
    help:
      "The valid operations: " +
      // Display all Options:
      ["create", "edit"].map((item) => '"' + item + '"').join(", "),
    default: "create",
    type: "str",
    dest: "mode",
  });

  const args = parser.parse_args();

  // Define a Logger
  const logger = getNopeLogger("nope-project-tool");

  try {
    let project: IProjectFile = null;
    switch (args.mode) {
      case "create":
        project = await inquirer.prompt([
          {
            type: "input",
            message: "Please choose a Project name",
            name: "name",
          },
          {
            type: "input",
            message: "Please enter a short textual description of the Project.",
            name: "description",
          },
          {
            type: "search-list",
            message: "Select the project type",
            name: "type",
            choices: ["python", "typescript"],
          },
          {
            type: "input",
            message: "Please enter your \x1b[4mforename\x1b[0m",
            name: "author.forename",
          },
          {
            type: "input",
            message: "Please enter your \x1b[4msurename\x1b[0m",
            name: "author.surename",
          },
          {
            type: "input",
            message: "Please enter your \x1b[4mmail\x1b[0m",
            name: "author.mail",
          },
          {
            type: "input",
            message: "Please enter your \x1b[4mgit-repo\x1b[0m, if available.",
            name: "git.repo",
          },
        ]);

        project = Object.assign(generateDefaultProject(), project);
        await createProject(project, "./", logger);
        return;
    }

    try {
      project = JSON.parse(readFileSync("./nope.json", { encoding: "utf-8" }));
    } catch (e) {
      logger.error(
        "Failed to read 'nope.json'. Are you shure it exist? Are you shure it is valid json?"
      );
      return;
    }

    function renderInstance() {
      console.log("The following instances are defined:");

      let index = 0;

      for (const mod of project.modules) {
        console.log("\t", index.toString() + ".", "\t", mod.name);
        for (const event of mod.events) {
          console.log("\t\t+ events:  ", "'" + event + "'");
        }
        for (const prop of mod.properties) {
          console.log("\t\t+ propery: ", "'" + prop + "'");
        }
        for (const method of mod.methods) {
          console.log("\t\t+ method:  ", "'" + method + "'");
        }
        console.log();
        index++;
      }
    }

    function renderServices() {
      console.log("The following services are defined:");

      let index = 0;

      for (const service of project.services) {
        console.log("\t", index.toString() + ".", "\t", service.name);
        index++;
      }
    }

    await createInteractiveMenu(
      [
        {
          name: "inspect -                    Show the current configurations",
          value: "inspect",
          type: "menu",
          items: [
            {
              name: "instances -              Show the defined Instances",
              value: "show-instances",
              type: "item",
              async onSelect() {
                renderInstance();
              },
            },
            {
              name: "services -               Show the defined services",
              value: "show-services",
              type: "item",
              async onSelect() {
                renderServices();
              },
            },
          ],
        },
        {
          type: "menu",
          name: "add -                        Adds a service or module",
          value: "add",
          items: [
            {
              type: "item",
              name: "service",
              value: "service",
              async onSelect() {
                const name = (
                  await inquirer.prompt([
                    {
                      type: "input",
                      message: "Please choose a Project name",
                      name: "name",
                    },
                  ])
                ).name;

                await addServiceToProject(project, { name }, logger);
                process.exit(0);
              },
            },
            {
              type: "item",
              name: "module",
              value: "module",
              async onSelect() {
                const module: IProjectFile["modules"][0] =
                  await inquirer.prompt([
                    {
                      type: "input",
                      message:
                        "Please choose a name for the Module. The convention is \x1b[4mcamel-case\x1b[0m. (e.g. 'Robot')",
                      name: "name",
                    },
                    {
                      type: "input",
                      message:
                        "Please provide a short description of your module.",
                      name: "description",
                    },
                    {
                      type: "input",
                      message:
                        "Please enter the 'events' which should be created. separate using ',' (e.g. 'onCollision')",
                      name: "events",
                    },
                    {
                      type: "input",
                      message:
                        "Please enter the 'properties' which should be created. separate using ',' (e.g. 'speed,target')",
                      name: "properties",
                    },
                    {
                      type: "input",
                      message:
                        "Please enter the 'methods' which should be created. separate using ',' (e.g. 'moveTo,stop')",
                      name: "methods",
                    },
                  ]);

                for (const item of ["events", "properties", "methods"]) {
                  module[item] = (module[item] as any as string)
                    .split(",")
                    .filter((item) => item.length > 0);
                }

                logger.info("Creating the Following 'module'\n", module);

                await addModuleToProject(project, module, logger);
                process.exit(0);
              },
            },
          ],
        },
      ],
      {
        async exitCallback() {
          await createFile(
            "./nope.json",
            JSON.stringify(project, undefined, 4)
          );
        },
      }
    );
  } catch (e) {
    logger.error("Something went wrong");
    logger.error(e);
  }
}

// If requested As Main => Perform the Operation.
if (require.main === module) {
  project();
}
