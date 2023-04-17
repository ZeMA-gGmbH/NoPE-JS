const ArgumentParser = require("argparse").ArgumentParser;

const parser = new ArgumentParser({
  // version: "1.0.0",
  add_help: true,
  description: "Service helper tool",
});

const validModes = ["install", "uninstall", "restart"];
parser.add_argument(["-m", "--mode"], {
  help:
    "Valid Modes are: " +
    validModes
      .map((item) => {
        return '"' + item + '"';
      })
      .join(", "),
  default: "install",
  type: "str",
  dest: "mode",
});

const Service = require("node-windows").Service;

// Create a new service object
const svc = new Service({
  name: "NoPE - Local IO-Server",
  description: "Starts a local Nope-IO-Server",
  script: require("path").join(__dirname, "ioServer.js"),
  // Make shure the Service Restarts over and over if it fails
  wait: 2,
  // We add an additional delay. Eachtime we add 0.25% of the
  // wait time.
  grow: 0.25,
});
const Logger = require("js-logger");
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
Logger.useDefaults({
  defaultLevel: Logger.DEBUG,
  formatter: function (messages, context) {
    messages.unshift(
      colors.FgBlue,
      new Date().toISOString(),
      colors.Reset,
      "-",
      colorMatching[context.level.name],
      context.level.name + spacer[context.level.name],
      "-",
      colors.BgWhite + colors.FgBlack,
      context.name,
      colors.Reset,
      ":"
    );
  },
});

const logger = Logger.get("Helper");

switch (parser.parse_args().mode) {
  case "install":
    // Listen for the "install" event, which indicates the
    // process is available as a service.
    svc.on("install", function () {
      svc.start();
      logger.info("ioServer installed and started");
    });
    svc.on("start", function () {
      logger.info("ioServer started");
    });
    svc.on("alreadyinstalled", function () {
      svc.start();
      logger.info("ioServer installed and started");
    });

    svc.install();
    break;
  case "uninstall":
    // Listen for the "uninstall" event so we know when it's done.
    svc.on("uninstall", function () {
      logger.info("Uninstall complete.");
      logger.info("The service exists (should be false): ", svc.exists);
    });

    // Uninstall the service.
    svc.uninstall();
    break;
  case "restart":
    svc.on("start", function () {
      logger.info("ioServer started");
    });
    svc.on("stop", function () {
      logger.info(
        "ioServer stopped / not running. Manually Starting Service again"
      );
      try {
        svc.start();
      } catch (e) {
        logger.error("Failed to restart the Broker. Please use the installer");
      }
    });
    svc.on("error", function (error) {
      logger.error("ioServer stopped");
    });

    // Manually stop the Service
    svc.stop();
    break;

  case "start":
    svc.on("start", function () {
      logger.info("ioServer started");
    });
    svc.start();
    break;

  default:
    logger.error("Invalid mode have been provided");
    break;
}
