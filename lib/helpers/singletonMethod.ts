/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

const NOPE_SYMBOL = Symbol.for("nope");
const SINGLETONS_SYMBOL = Symbol.for("singletons");

/**
 * Function to get a singleton. To create the singleton, the parameter *create* is used. This will be called once.
 * The singleton will be stored as *global* variable and can be accessed by the identifier
 *
 * @author M.Karkowski
 * @export
 * @template T The Type of the singleton
 * @param {string} identifier Identifier to access the singleton
 * @param {() => T} create The Callback which is used to create the instance.
 * @return An object, containing the key **instances**, where you'll find the instance and an helper function **setInstance** to redefine the instance
 */
export function getSingleton<T>(
  identifier: string,
  create: () => T
): {
  instance: T;
  setInstance: (value: T) => void;
} {
  if (!global[NOPE_SYMBOL]) {
    global[NOPE_SYMBOL] = {
      singletons: {},
    };
  }

  if (!global[NOPE_SYMBOL][SINGLETONS_SYMBOL]) {
    global[NOPE_SYMBOL][SINGLETONS_SYMBOL] = {};
  }

  // Extract all
  const globalSingletons = Object.getOwnPropertyNames(
    global[NOPE_SYMBOL][SINGLETONS_SYMBOL]
  );

  // create a unique, global symbol name
  // -----------------------------------
  const IDENTIFIER_DISPATCHER_CONTAINER = identifier;

  // check if the global object has this symbol
  // add it if it does not have the symbol, yet
  // ------------------------------------------
  const hasContainer =
    globalSingletons.indexOf(IDENTIFIER_DISPATCHER_CONTAINER) > -1;

  if (!hasContainer) {
    global[NOPE_SYMBOL][SINGLETONS_SYMBOL][IDENTIFIER_DISPATCHER_CONTAINER] =
      create();
  }

  const ret: {
    instance: T;
    setInstance: (value: T) => void;
  } = {
    instance:
      global[NOPE_SYMBOL][SINGLETONS_SYMBOL][IDENTIFIER_DISPATCHER_CONTAINER],
    setInstance: (value: T) => {
      global[NOPE_SYMBOL][SINGLETONS_SYMBOL][IDENTIFIER_DISPATCHER_CONTAINER] =
        value;
    },
  };

  // define the singleton API
  // ------------------------
  Object.defineProperty(ret, "instance", {
    get: function () {
      return global[NOPE_SYMBOL][SINGLETONS_SYMBOL][
        IDENTIFIER_DISPATCHER_CONTAINER
      ];
    },
  });

  // ensure the API is never changed
  // -------------------------------
  Object.freeze(ret);

  return ret;
}
