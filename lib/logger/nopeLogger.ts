/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-11-11 11:27:44
 * @modify date 2021-11-11 11:27:44
 * @desc [description]
 */

import * as Logger from "js-logger";
import { ILogger, ILoggerOpts } from "js-logger";
import { SPLITCHAR } from "../helpers/objectMethods";
import { RUNNINGINNODE } from "../helpers/runtimeMethods";

const colors = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",

  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",

  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m",
};

const colorMatching = {
  ERROR: colors.FgRed,
  WARN: colors.FgYellow,
  INFO: colors.FgWhite,
  DEBUG: colors.FgGreen,
  TRACE: colors.FgCyan,
};

const spacer = {
  ERROR: "",
  WARN: " ",
  INFO: " ",
  DEBUG: "",
  TRACE: "",
};

export const formatMsgForConsole = RUNNINGINNODE
  ? function (message, context) {
      return [
        colors.FgBlue,
        new Date().toISOString(),
        colors.Reset,
        "-",
        colorMatching[context.level.name],
        context.level.name + spacer[context.level.name],
        colors.Reset,
        "-",
        colors.BgWhite + colors.FgBlack,
        context.name,
        colorMatching[context.level.name],
        ":",
        ...message,
        colors.Reset,
      ];
    }
  : function (message, context) {
      return [
        new Date().toISOString(),
        "-",
        context.level.name + spacer[context.level.name],
        "-",
        context.name,
        ":",
        ...message,
      ];
    };

Logger.useDefaults({
  defaultLevel: (Logger as any).DEBUG,
  formatter: RUNNINGINNODE
    ? function (messages, context) {
        messages.unshift(
          colors.FgBlue,
          new Date().toISOString(),
          colors.Reset,
          "-",
          colorMatching[context.level.name],
          context.level.name + spacer[context.level.name],
          colors.Reset,
          "-",
          colors.BgWhite + colors.FgBlack,
          context.name,
          colors.Reset,
          colorMatching[context.level.name],
          ":"
        );
        messages.push(colors.Reset);
      }
    : function (messages, context) {
        messages.unshift(
          context.level.name + spacer[context.level.name],
          "-",
          context.name,
          ":"
        );
      },
});

/**
 * Contains the Valid Types of the Loger.
 */
export type LoggerLevel = "error" | "warn" | "info" | "debug" | "trace";
/**
 * Array containg the Valid Types of the Loger. see {@link LoggerLevel}
 */
export const LoggerLevels = ["error", "warn", "info", "debug", "trace"];

const order: { [K in LoggerLevel]: number } = {
  error: 8,
  warn: 5,
  info: 3,
  debug: 2,
  trace: 1,
};

const mapping: { [K in LoggerLevel]: any } = {
  error: (Logger as any).ERROR,
  warn: (Logger as any).WARN,
  info: (Logger as any).INFO,
  debug: (Logger as any).DEBUG,
  trace: (Logger as any).TRACE,
};

const reverseOrder: { [index: number]: LoggerLevel } = {};
Object.getOwnPropertyNames(order).map((key: LoggerLevel) => {
  reverseOrder[order[key]] = key;
});

const reverseMapping: any = {};
Object.getOwnPropertyNames(mapping).map((key: LoggerLevel) => {
  reverseMapping[mapping[key]] = key;
});

function _selectLevel(master: LoggerLevel, slave: LoggerLevel) {
  const masterLevel = order[master];
  const slaveLevel = order[slave];

  return reverseOrder[Math.max(masterLevel, slaveLevel)];
}

/**
 * Helper Function, to create a Logger.
 * Therefore it uses a specific Level and a Lable of the
 * Logger
 *
 * @export
 * @param {LoggerLevel} level The Level, which should be rendered
 * @param {string} [label=''] An Lable for the Logger. Every Message beginns with that lable.
 * @return {*} Returns a Logger.
 */
function _getLogger(level: LoggerLevel, label = ""): ILogger {
  const logger = Logger.get(label);
  logger.setLevel(mapping[level]);
  return logger;
}

/**
 * Tests if the Logger is enabled for the level, or extracts the level.
 *
 * @param {ILogger} logger The logger
 * @param {LoggerLevel} [lvl] if provided tests if the lvl matches the logger. otherwise returns the current level
 * @return {(boolean | LoggerLevel)}
 */
export function enabledFor(
  logger: ILogger,
  lvl?: LoggerLevel
): boolean | LoggerLevel {
  if (lvl) {
    return logger.enabledFor(mapping[lvl]);
  }
  return logger.getLevel().name as LoggerLevel;
}

/**
 * Enables the Logger for the desired Level.
 *
 * @param {ILogger} logger The logger
 * @param {LoggerLevel} lvl The level to use
 * @return {void}
 */
export function enableFor(logger: ILogger, lvl: LoggerLevel): void {
  return logger.setLevel(mapping[lvl]);
}

/**
 * Helper to test if the message would be logged.
 * @param loggerLevel The Level of the logger
 * @param messageLevel The Level of the Message
 * @returns
 */
export function shouldLog(
  loggerLevel: LoggerLevel,
  messageLevel: LoggerLevel
): boolean {
  return order[messageLevel] >= order[loggerLevel];
}

/**
 * The Nope-Logger. It consits o
 */
export class NopeLogger {
  protected _logger: ILogger;
  protected _loggers: Map<string, ILogger>;

  /**
   * Sets the Level of the logger. Sets all logger to the defined value.
   *
   * @author M.Karkowski
   * @memberof NopeLogger
   */
  set level(value: LoggerLevel) {
    if (!this.isLocked) {
      this._level = value;
      this.setLoglevel("core" + SPLITCHAR, value);
    }
  }

  /**
   * Returns the general logger-level.
   *
   * @author M.Karkowski
   * @type {LoggerLevel}
   * @memberof NopeLogger
   */
  get level(): LoggerLevel {
    return this._level;
  }

  /**
   * Helper to readout the level
   *
   * @author M.Karkowski
   * @type {LoggerLevel}
   * @memberof NopeLogger
   */
  public _level: LoggerLevel = "debug";

  /**
   * Creates a sublogger with the given name and the
   * level.
   *
   * @author M.Karkowski
   * @param {string} [name=""] The name of the logger
   * @param {LoggerLevel} [level=this.level] The level of the logger.
   * @return {ILogger} The Logger
   * @memberof NopeLogger
   */
  getLogger(name = "", level: LoggerLevel = this.level): ILogger {
    if (!this._loggers.has(name)) {
      this._loggers.set(
        name,
        _getLogger(_selectLevel(this.level, level), name)
      );
    }
    return this._loggers.get(name) as ILogger;
  }

  /**
   * Helper function, to update the Logger Defaults. Therefore you should checkout the [description](https://www.npmjs.com/package/js-logger)
   *
   * @param {ILoggerOpts} defaults
   * @memberof NopeLogger
   */
  setDefaults(defaults: ILoggerOpts): void {
    Logger.useDefaults(defaults);
  }

  /**
   * Rewrites the Stream of the Logger to the
   * given handler. Watch out, only one handler
   * is active.
   *
   * @param {(msg, context) => void} handler
   * @memberof NopeLogger
   */
  setHandler(handler: (msg, context) => void): void {
    Logger.setHandler(handler);
  }

  /**
   * Function to determine the Logger Level
   * @param loggerGroup The specified group, which should be addressed
   * @param level The Level to Set
   */
  setLoglevel(loggerGroup: string, level: LoggerLevel): void {
    if (!loggerGroup.startsWith("core" + SPLITCHAR)) {
      loggerGroup = "core" + SPLITCHAR + loggerGroup;
    }

    if (!loggerGroup.endsWith(SPLITCHAR)) {
      loggerGroup += SPLITCHAR;
    }

    /** Iterate over all Loggers and close the unused Loggers */
    for (let [name, logger] of this._loggers.entries()) {
      if (!name.startsWith("core" + SPLITCHAR)) {
        name = "core" + SPLITCHAR + name;
      }

      if (!name.endsWith(SPLITCHAR)) {
        name += SPLITCHAR;
      }

      if (name == loggerGroup || name.startsWith(loggerGroup)) {
        /** Update the Level */
        logger.setLevel(mapping[level]);
      }
    }
  }

  /**
   * Function, to check, whether a specific logger is enabled for logging the given log level
   *
   * @author M.Karkowski
   * @param {string} loggerName Name of the Logger
   * @param {LoggerLevel} level The Log-Level to Test
   * @return {boolean} Result of the Test.
   * @memberof NopeLogger
   */
  isLogging(loggerName: string, level: LoggerLevel): boolean {
    return (
      order[reverseMapping[this.getLogger(loggerName).getLevel().name]] >=
      order[level]
    );
  }

  /**
   * Creates an instance of NopeLogger.
   * @author M.Karkowski
   * @memberof NopeLogger
   */
  constructor() {
    this._loggers = new Map<string, ILogger>();

    this._logger = _getLogger("debug", "root");
    this._loggers.set("", this._logger);
  }

  protected _pw = "";

  /**
   * Lock the Logger Level with a password. This prevents chaning the
   * log level to other log-levels. you must {@link NopeLogger.unlock} to
   * update the Level again.
   *
   * @param {string} pw The Password to Lock the Logger
   * @memberof NopeLogger
   */
  lock(pw: string): void {
    if (this._pw !== "") {
      this._loggers.get("").error("Please unlock before");
    } else {
      this._pw = pw;
    }
  }

  /**
   * Unlock the Logger, therefore the password used for locking is
   * required. After unlocking, the log-level can be adapted.
   *
   * @author M.Karkowski
   * @param {string} pw The password to unlock the logger
   * @memberof NopeLogger
   */
  unlock(pw: string): void {
    if (this._pw === pw) {
      this._pw = "";
    } else {
      this._loggers.get("").error("Unlocking wasnt successfull");
    }
  }

  /**
   * Flag indicating, whether the logger is locked or not.
   *
   * @author M.Karkowski
   * @readonly
   * @type {boolean}
   * @memberof NopeLogger
   */
  public get isLocked(): boolean {
    return this._pw !== "";
  }
}
