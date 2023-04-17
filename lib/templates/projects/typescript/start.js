const nope = require("nope");

nope.runNopeBackend({
  timings: {
    checkInterval: 0,
    sendAliveInterval: 0
  },
  log: "error",
}).then(console.log("done")).catch(console.error)