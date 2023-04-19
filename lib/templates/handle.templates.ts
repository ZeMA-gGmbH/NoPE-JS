/**
 * Helper file to perform all releated task to create a project,
 * add services and modules to it.
 */

import {
  FOLDER_SPLIT,
  listFiles,
  createPath,
  createFile,
  replaceAll,
  insert,
  underscore,
  camelize,
} from "../helpers/index.nodejs";
import { copyFile, readFile } from "fs/promises";
import { join, relative, resolve } from "path";
import * as handlebars from "handlebars";
import { existsSync } from "fs";
import { getNopeLogger, ILogger } from "../index.browser";
import { simpleGit } from "simple-git";

const dirName = join(__dirname, "..", "..", "lib", "templates");
const INSERT_MARKER = " !! Insert-Marker: Don't remove this line !!";

function firstup(str: string) {
  str = camelize(str);
  return str[0].toUpperCase() + str.slice(1);
}
function toService(str: string) {
  str = firstup(str);
  if (str.endsWith("Service")) {
    return str;
  }
  return str + "Service";
}
function toModule(str: string) {
  str = firstup(str);
  if (str.endsWith("Module")) {
    return str;
  }
  return str + "Module";
}
function toInterface(str: string) {
  str = toModule(str);
  return "I" + str;
}

handlebars.registerHelper("underscore", function (str: string) {
  return underscore(str, true);
});
handlebars.registerHelper("firstup", firstup);
handlebars.registerHelper("now", function () {
  const now = new Date();
  return (
    now.getDay().toString() +
    "." +
    now.getMonth().toString() +
    "." +
    now.getFullYear().toString()
  );
});
handlebars.registerHelper("toService", toService);
handlebars.registerHelper("toModule", toModule);
handlebars.registerHelper("toInterface", toInterface);

export interface IProjectFile {
  type: "python" | "typescript";
  version: string;
  name: string;
  dirName: string;
  path: string;
  modules: {
    name: string;
    properties: string[];
    events: string[];
    methods: string[];
  }[];
  services: {
    name: string;
  }[];
  description: string;
  author: {
    forename: string;
    surename: string;
    mail: string;
  };
  depencies: string[];
  git?: {
    repo: string;
    created: boolean;
  };
  currentNopeVersion: "1.6.8";
}

export function generateDefaultProject(): IProjectFile {
  return {
    type: "python",
    version: "1.0",
    name: "name",
    dirName: "",
    path: "",
    modules: [],
    services: [],
    description: "",
    author: {
      forename: "",
      surename: "",
      mail: "",
    },
    depencies: [],
    currentNopeVersion: "1.6.8",
  };
}

/**
 * Helper to define the relevant project files.
 * @returns
 */
async function _getProjectTemplates(type: "python" | "typescript") {
  const files = await listFiles(join(dirName, "projects", type), ".handlebars");
  const projectFiles = files.filter((item) => {
    return !item.includes("modules" + FOLDER_SPLIT);
  });

  return projectFiles;
}

async function _getProjectFilesToCopy(type: "python" | "typescript") {
  const files = await listFiles(join(dirName, "projects", type));
  const filesToCopy = files.filter((item) => {
    const isTemplate = item.includes(".handlebars");
    return !isTemplate;
  });
  return filesToCopy;
}

function _relativePath(
  settings: IProjectFile,
  type: "projects" | "services" | "modules",
  path: string,
  dataForTemplate: any
): string {
  const templatePath =
    dirName + FOLDER_SPLIT + type + FOLDER_SPLIT + settings.type;
  const file = path.slice(templatePath.length);
  const fileTemplate = replaceAll(
    file,
    FOLDER_SPLIT,
    "__FOLDER_SPLITTING_CHAR__"
  );
  const render = handlebars.compile(fileTemplate);
  const result = render(dataForTemplate);
  const ret = replaceAll(result, "__FOLDER_SPLITTING_CHAR__", FOLDER_SPLIT);
  return ret;
}

async function _writeTemplate(
  path: string,
  templateFile: string,
  projectSettings: IProjectFile,
  type: "projects" | "services" | "modules",
  dataForTemplate: any,
  logger: ILogger = null
) {
  const render = handlebars.compile(
    await readFile(templateFile, { encoding: "utf-8" })
  );

  let filePath =
    path + _relativePath(projectSettings, type, templateFile, dataForTemplate);

  if (templateFile.endsWith(".extend.handlebars")) {
    filePath = filePath.slice(0, filePath.length - ".extend".length);
  }

  filePath = filePath.slice(0, filePath.length - ".handlebars".length);

  const content = render(dataForTemplate);

  if (templateFile.endsWith(".extend.handlebars") && existsSync(filePath)) {
    const text = await readFile(filePath, { encoding: "utf-8" });
    const idxToInsert = text.includes(INSERT_MARKER)
      ? text.indexOf(INSERT_MARKER) + INSERT_MARKER.length
      : text.length;
    const contentToStore = insert(text, idxToInsert, "\n".repeat(1) + content);
    await createFile(filePath, contentToStore);
    if (logger) logger.info("updated\t", filePath);
  } else {
    await createFile(join(filePath), content);
    if (logger) logger.info("created\t", filePath);
  }
}

export async function createProject(
  projectSettings: IProjectFile,
  dir: string,
  logger: ILogger = null
) {
  const path = await createPath(join(dir, projectSettings.name));
  const filesToCopy = await _getProjectFilesToCopy(projectSettings.type);

  const promises = filesToCopy.map(async (file) => {
    const dest = await createFile(
      path + _relativePath(projectSettings, "projects", file, projectSettings),
      ""
    );
    await copyFile(file, dest);
    if (logger) logger.info("created\t", dest);
  });
  await promises;

  // now we render the files.

  for (const templateFile of await _getProjectTemplates(projectSettings.type)) {
    await _writeTemplate(
      path,
      templateFile,
      projectSettings,
      "projects",
      projectSettings,
      logger
    );
  }

  projectSettings.path = resolve(process.cwd(), path);

  await createFile(
    join(path, "nope.json"),
    JSON.stringify(projectSettings, undefined, 4)
  );

  const git = simpleGit(path);

  // or await each step individually
  await git.init();

  const files = await listFiles(path);
  const filesToCommit = files
    .filter((file) => !file.includes(FOLDER_SPLIT + ".git" + FOLDER_SPLIT))
    .map((file) => relative(path, file));
  // await git.add(files);
  await git.add(filesToCommit);
  await git.commit("initial commit");

  if (projectSettings.git?.repo) {
    await git.addRemote("origin", projectSettings.git.repo);
  }

  if (logger) logger.info("created\t", join(path, "nope.json"));
}

export async function addServiceToProject(
  projectSettings: IProjectFile,
  service: { name: string },
  logger: ILogger = null
) {
  let path = join(projectSettings.path, projectSettings.name);

  // List the relevant templates.
  const templates = await listFiles(
    join(dirName, "services", projectSettings.type),
    ".handlebars"
  );
  const settings = Object.assign({}, service, { project: projectSettings });

  for (const templateFile of templates) {
    await _writeTemplate(
      path,
      templateFile,
      projectSettings,
      "services",
      settings,
      logger
    );
  }

  const files = await listFiles(
    join(dirName, "services", projectSettings.type)
  );
  const filesToCopy = files.filter((item) => {
    const isTemplate = item.includes(".handlebars");
    return !isTemplate;
  });
  const promises = filesToCopy.map(async (file) => {
    const dest = await createFile(
      path + _relativePath(projectSettings, "services", file, settings),
      ""
    );
    await copyFile(file, dest);
    if (logger) logger.info("created\t", dest);
  });
  await promises;

  projectSettings.services.push(service);

  await createFile(
    join(projectSettings.path, "nope.json"),
    JSON.stringify(projectSettings, undefined, 4)
  );
}

export async function addModuleToProject(
  projectSettings: IProjectFile,
  module: IProjectFile["modules"][0],
  logger: ILogger = null
) {
  let path = join(projectSettings.path, projectSettings.name);

  // List the relevant templates.
  const templates = await listFiles(
    join(dirName, "modules", projectSettings.type),
    ".handlebars"
  );
  const settings = Object.assign({}, module, {
    project: projectSettings,
  });

  for (const templateFile of templates) {
    await _writeTemplate(
      path,
      templateFile,
      projectSettings,
      "modules",
      settings,
      logger
    );
  }

  const files = await listFiles(join(dirName, "modules", projectSettings.type));
  const filesToCopy = files.filter((item) => {
    const isTemplate = item.includes(".handlebars");
    return !isTemplate;
  });
  const promises = filesToCopy.map(async (file) => {
    const dest = await createFile(
      path + _relativePath(projectSettings, "modules", file, settings),
      ""
    );
    await copyFile(file, dest);
    if (logger) logger.info("created\t", dest);
  });
  await promises;

  projectSettings.modules.push(module);

  await createFile(
    join(projectSettings.path, "nope.json"),
    JSON.stringify(projectSettings, undefined, 4)
  );
}

if (require.main === module) {
  const logger = getNopeLogger("tool");
  async function main() {
    const settings: IProjectFile = {
      author: {
        mail: "m.karkowski@zema.de",
        forename: "Martin",
        surename: "Karkowski",
      },
      depencies: [],
      description: "Minimal Description for the Test",
      modules: [],
      path: "./temp/",
      services: [
        {
          name: "createDatabase",
        },
      ],
      name: "testPython",
      dirName: "test_python",
      version: "1.0",
      type: "python",
      currentNopeVersion: "1.6.8",
    };

    await createProject(settings, "../temp", logger);
    await addServiceToProject(
      settings,
      {
        name: "deleteDatabase",
      },
      logger
    );
    await addModuleToProject(
      settings,
      {
        methods: ["sayHello", "getTime"],
        name: "HelloWorld",
        events: [],
        properties: ["lastGreetingMessage"],
      },
      logger
    );

    // Now create a Typescript folder:
    settings.type = "typescript";
    settings.name = "testNodejs";
    settings.name = "testNodejs";
    settings.path = "./temp/";
    await createProject(settings, "./temp", logger);

    await addServiceToProject(
      settings,
      {
        name: "deleteDatabase",
      },
      logger
    );
    await addModuleToProject(
      settings,
      {
        methods: ["sayHello", "getTime"],
        name: "HelloWorld",
        events: [],
        properties: ["lastGreetingMessage"],
      },
      logger
    );
  }

  main().catch(console.error);
}
