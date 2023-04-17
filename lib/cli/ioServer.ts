import { runNopeBackend } from "./runNopeBackend";

runNopeBackend({
  channel: "io-server",
  channelParams: JSON.stringify([7000, "info", true]),
  skipLoadingConfig: true,
});
