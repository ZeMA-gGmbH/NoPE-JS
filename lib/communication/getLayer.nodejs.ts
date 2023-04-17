/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-03-23 07:30:19
 * @modify date 2022-01-03 17:33:58
 * @desc [description]
 */

import { generateId } from "../helpers/idMethods";
import { ValidLoggerDefinition } from "../logger/getLogger";
import { LoggerLevel } from "../logger/nopeLogger";
import { ICommunicationBridge } from "../types/nope/nopeCommunication.interface";
import { Bridge } from "./bridge";
import {
  IoSocketClientLayer,
  ioSocketServerLayer,
  MQTTLayer,
} from "./layers/index.nodejs";

// Define the Valid Layers
export type validLayerOrMirror = "event" | "io-server" | "io-client" | "mqtt";

export const validLayers = {
  event: Bridge,
  "io-server": ioSocketServerLayer,
  "io-client": IoSocketClientLayer,
  mqtt: MQTTLayer,
};

export const layerDefaultParameters = {
  amqp: "localhost",
  "io-server": 7000,
  "io-client": "http://localhost:7000",
  mqtt: "mqtt://localhost:1883",
};

/**
 * Function, that will create a Bridge, based on the provided function.
 * Based on the parameter "layer", a corresponding layer or mirror will
 * be added to the bridge. You can provide custom parameters using the
 * parameter "parameter". This will receive either the uri or ports.
 * Additionally you are able to assign a log-level to the bridge.
 *
 * @export
 * @param {validLayerOrMirror} layer the layer to add
 * @param {(number | string)} [parameter=null] the parameter required for the additonal layer / mirror
 * @param {LoggerLevel} [logger=false] the level of the debugger
 * @return {*}  {ICommunicationBridge}
 */
export function getLayer(
  layer: validLayerOrMirror,
  parameter: number | string = null,
  logger: ValidLoggerDefinition = false
): ICommunicationBridge {
  // Create the Bridge
  const communicationBridge = new Bridge(generateId(), logger);

  // Assign the Default Setting for the Channel.
  const params = parameter !== null ? parameter : layerDefaultParameters[layer];

  switch (layer) {
    case "event":
      break;
    case "io-client":
      communicationBridge.addCommunicationLayer(
        new IoSocketClientLayer(params, logger),
        true
      );
      break;
    case "io-server":
      communicationBridge.addCommunicationLayer(
        new ioSocketServerLayer(params, logger),
        true
      );
      break;
    case "mqtt":
      communicationBridge.addCommunicationLayer(
        new MQTTLayer(params, logger) as any
      );
      break;
  }

  // Now that we have added a connection, we will
  // update the value.
  communicationBridge.connected.forcePublish();

  // Return the Bridge
  return communicationBridge as any as ICommunicationBridge;
}
