import { plugin, installPlugins, allPlugins } from "./plugin";
export { plugin, installPlugins, allPlugins };

import { extend as ackMessages } from "./ackMessages";
import { extend as hello } from "./hello";
import { extend as rpcWithCallbacks } from "./rpcWithCallbacks";

export const availablePlugins = {
  ackMessages,
  hello,
  rpcWithCallbacks,
};
