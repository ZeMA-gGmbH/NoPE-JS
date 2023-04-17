import { rgetattr, rsetattr, getType } from "../helpers/objectMethods";
import { union } from "../helpers/setMethods";
import { getNopeLogger } from "../logger/index.browser";
import { getSingleton } from "../helpers/singletonMethod";

let COUNTER = 0;
const SPLITCHAR = ".";
const PLUGIN_STORE = getSingleton("nope.plugins", () => {
  return new Map<string, Plugin>();
});

const ABORT_INSPECTION_TESTERS = [
  (item) => {
    const type = typeof item;

    const not = [
      "string",
      "number",
      "bigint",
      "boolean",
      "symbol",
      "undefined",
      "function",
    ];

    return not.includes(type);
  },
  (item) => Array.isArray(item),
];

function shouldAbort(item) {
  for (const test of ABORT_INSPECTION_TESTERS) {
    if (test(item)) {
      return true;
    }
  }
  return false;
}

function recursiveForEachModule(
  obj: any,
  prefix: string = "",
  map: Map<string, any> = null,
  splitchar: string = SPLITCHAR,
  maxDepth = Infinity,
  level = 0
): any {
  if (map === null) {
    map = new Map();
  }

  map.set(prefix, obj);

  if (level > maxDepth) {
    return map;
  }

  if (shouldAbort(obj)) {
    return map;
  }

  // Create an Array with the Keys.
  const keys = Object.getOwnPropertyNames(obj);

  // If there are Keys => It is a List or a Default Object
  if (keys.length > 0) {
    for (const _key of keys) {
      // Define the variable, containing the path
      const path = prefix === "" ? _key : prefix + splitchar + _key;
      map = recursiveForEachModule(
        obj[_key],
        path,
        map,
        splitchar,
        maxDepth,
        level + 1
      );
    }
  }

  return map;
}

/**
 * Flattens an Object to a Map.
 *
 * For Instance:
 *
 *      data = {a : { b : { c : 1, d: "hallo"}}}
 *
 *      // Normal Call
 *      res = flatteObject(data)
 *      => res = {"a.b.c":1,"a.b.d":"hallo"}
 *
 *      // With a Selected prefix 'additional.name'
 *      res = flatteObject(data,{prefix:'additional.name'})
 *      => res = {"additional.name.a.b.c":1,"additional.name.a.b.d":"hallo"}
 *
 * @export
 * @param {*} lib The Data that should be converted
 * @param {string} [prefix=''] An additional prefix.
 * @returns {Map<string, any>} The flatten Object
 */
function flattenLibrary(
  lib: any,
  options: {
    prefix?: string;
    splitchar?: string;
    maxDepth?: number;
  } = {}
): Map<string, any> {
  const optionsToUse = Object.assign(
    {
      prefix: "",
      splitchar: SPLITCHAR,
      maxDepth: Infinity,
    },
    options
  );

  return recursiveForEachModule(
    lib,
    optionsToUse.prefix,
    new Map(),
    options.splitchar,
    options.maxDepth,
    0
  );
}

/**
 * Helper to list the occourence of a lib.
 * @param lib the lib to look for.
 * @param options
 * @returns
 */
function listOccourence(
  lib,
  options: {
    splitchar?: string;
    maxDepth?: number;
  } = {}
) {
  const optionsToUse = Object.assign(
    {
      splitchar: SPLITCHAR,
      maxDepth: Infinity,
    },
    options
  );

  const flattend = flattenLibrary(lib, optionsToUse);

  const occourence = new Map<string, Set<string>>();

  for (const key of flattend.keys()) {
    const split = key.split(optionsToUse.splitchar);
    const last = split[split.length - 1];

    if (!occourence.has(last)) {
      occourence.set(last, new Set());
    }

    occourence.get(last).add(key);
  }

  return {
    flattend,
    occourence,
  };
}

/**
 * Helper to install an addon.
 * @param library
 * @param item
 * @param replacer
 * @returns
 */
function implementChanges(library, item: string | any, replacer) {
  const { occourence, flattend } = listOccourence(library);
  const failed = new Array<{ error: any; destination: string }>();
  if (occourence.has(item)) {
    for (const destination of occourence.get(item)) {
      try {
        rsetattr(library, destination, replacer, SPLITCHAR);
      } catch (error) {
        failed.push({
          error,
          destination,
        });
      }
    }
  }

  return library;
}

export type Plugin = ExtendFunction & {
  install: (lib: string | NodeModule) => Set<string>;
  base: string[];
  pluginName: string;
};

/**
 * Helper to test if the plugin in is type plugin.
 * @param plug the Plugin to test.
 * @returns {boolean} the test if it is a plugin.
 */
export function isPlugin(plug: Plugin): plug is Plugin {
  if (typeof plug !== "function") {
    return false;
  }
  if ((plug as Plugin).install === undefined) {
    return false;
  }
  if ((plug as Plugin).pluginName === undefined) {
    return false;
  }
  return true;
}

/**
 * Function to define an extension
 */
export type ExtendFunction = (
  ...args
) => Array<{ path: string; name: string; adapted: any }>;

export function plugin(
  base: string | string[],
  extend: ExtendFunction,
  name = ""
): Plugin {
  if (!Array.isArray(base)) {
    base = [base];
  }
  if (name === "") {
    try {
      name = `anonymousPlugin${COUNTER++}@${arguments.callee.name}`;
    } catch (e) {
      name = `anonymousPlugin${COUNTER++}`;
    }
  }

  (extend as Plugin).base = base;
  (extend as Plugin).pluginName = name;
  (extend as Plugin).install = (lib: string | NodeModule) => {
    if (typeof lib == "string") {
      lib = require(lib);
    }

    const itemsToUpdate = (base as string[]).map((item) =>
      rgetattr(lib, item, false, ".")
    );

    if (itemsToUpdate.includes(false)) {
      throw Error(
        "Faild to grap some of the given base elements. Please check parameter 'base'"
      );
    }

    let modified = new Set<string>();

    // Now apply the addon:
    const adaptions = extend(...itemsToUpdate);

    if (!Array.isArray(adaptions)) {
      throw Error("Return-Type of the Plugin doesnt match.");
    }

    for (const { path, name, adapted } of adaptions) {
      lib = implementChanges(lib, path, adapted);
      modified = union(modified, checkRequireCache(name, adapted));
    }

    return modified;
  };

  // Store our Plugin as store.
  PLUGIN_STORE.instance.set(name, extend as Plugin);

  return extend as Plugin;
}

/**
 * Helper function to install Plugins.
 * @param lib The Library to modify.
 * @param plugins The Plugins install. This can be the registered names, pathes in the library or the plugin itself.
 * @param log Flag to control the log information.
 */
export function installPlugins(
  lib: string | NodeModule,
  plugins: string | Plugin | Array<Plugin | string>,
  log: boolean = true
) {
  let modified = new Set<string>();

  if (!Array.isArray(plugins)) {
    plugins = [plugins];
  }

  if (typeof lib == "string") {
    lib = require(lib);
  }

  const pluginsToUse = new Array<Plugin>();

  // In this loop we ensure that we load the correct plugin.
  for (const plug of plugins) {
    if (typeof plug === "string") {
      // The Plugin is provided as String.
      // 1. Check if the name is present:

      if (PLUGIN_STORE.instance.has(plug)) {
        pluginsToUse.push(PLUGIN_STORE.instance.get(plug));
      } else if (isPlugin(rgetattr(lib, plug, false, "."))) {
        pluginsToUse.push(rgetattr(lib, plug, false, "."));
      } else {
        const p = require(plug as string).extend;
        if (isPlugin(p)) {
          pluginsToUse.push(PLUGIN_STORE.instance.get(plug));
        } else {
          throw Error(
            "Cannot find plugin '" +
              plug +
              "'. If this is a file, make shure the plugin is exported as 'extend'"
          );
        }
      }
    } else if (isPlugin(plug)) {
      pluginsToUse.push(plug);
    }
  }

  let used_plugins_str =
    "Plugins used!\n\n" +
    "-".repeat(50) +
    "\nPLUGIN INSTALLTION REPORT:\n" +
    "-".repeat(50) +
    "\n\nInstalled the following plugins:";
  let used_bases_str = "\n\nThe following source have been modified:";
  let used_bases = new Set<string>();

  for (const plug of pluginsToUse) {
    // Store the Plugin
    used_plugins_str += "\n\t- " + plug.pluginName;
    // Store the modified elements:
    plug.base.map((item) => used_bases.add(item));
    // Update the modified sources
    modified = union(modified, plug.install(lib));
  }

  Array.from(used_bases).map((item) => (used_bases_str += "\n\t- " + item));

  const end_str = "\n\nWatchout this may change the default behavior!\n\n";

  const to_print = used_plugins_str + used_bases_str + end_str;

  if (log) {
    const logger = getNopeLogger("plugin-system", "debug");
    logger.warn(to_print);
  }
}

/**
 * Helper to list all Plugins
 * @returns List of recognized Plugins
 */
export function allPlugins() {
  return Array.from(PLUGIN_STORE.instance.keys());
}

function checkRequireCache(name: string, adapted: any) {
  const modified = new Set<string>();
  for (const absFileName in require.cache) {
    const mod = require.cache[absFileName];

    if (mod.loaded && mod.exports) {
      const exportedItems = Object.getOwnPropertyNames(mod.exports);
      if (exportedItems.includes(name)) {
        try {
          mod.exports[name] = adapted;
          modified.add(absFileName);
        } catch (e) {
          // We are not allowed to reassign
          // exported members only.
        }
      }
    }
  }

  return modified;
}
