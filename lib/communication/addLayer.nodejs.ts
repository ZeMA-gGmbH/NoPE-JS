import { ValidLoggerDefinition } from "../logger/getLogger";
import { ICommunicationBridge } from "../types/nope/nopeCommunication.interface";
import { Bridge } from "./bridge";
import { IoHostLayer } from "./layers/IoHost";
import {
  IoSocketClientLayer,
  ioSocketServerLayer,
  MQTTLayer,
} from "./layers/index.nodejs";

// Define the Valid Layers
export type validLayerOrMirror =
  | "event"
  | "io-server"
  | "io-client"
  | "io-host"
  | "mqtt";

export const validLayers = {
  event: Bridge,
  "io-server": ioSocketServerLayer,
  "io-client": IoSocketClientLayer,
  "io-host": IoHostLayer,
  mqtt: MQTTLayer,
};

export const layerDefaultParameters = {
  amqp: "localhost",
  "io-server": 7000,
  "io-host": "http://localhost:7000",
  "io-client": "http://localhost:7000",
  mqtt: "mqtt://localhost:1883",
};

export type validLayerParameters = Array<
  | {
      name: "amqp";
      url: string;
    }
  | {
      name: "io-client";
      url: string;
    }
  | {
      name: "io-host";
      url: string;
    }
  | {
      name: "mqtt";
      url: string;
    }
>;

export function addLayer(
  communicationBridge: ICommunicationBridge,
  layer: validLayerOrMirror,
  parameter: number | string = null,
  logger: ValidLoggerDefinition = false,
  considerConnection: boolean = false,
  forwardData: boolean = true
) {
  // Assign the Default Setting for the Channel.
  const params = parameter !== null ? parameter : layerDefaultParameters[layer];

  switch (layer) {
    case "event":
      break;
    case "io-client":
      communicationBridge.addCommunicationLayer(
        new IoSocketClientLayer(params, logger),
        forwardData,
        considerConnection
      );
      break;
    case "io-server":
      communicationBridge.addCommunicationLayer(
        new ioSocketServerLayer(params, logger),
        forwardData,
        considerConnection
      );
      break;
    case "io-host":
      communicationBridge.addCommunicationLayer(
        new IoHostLayer(communicationBridge, params, logger),
        forwardData,
        considerConnection
      );
      break;
    case "mqtt":
      communicationBridge.addCommunicationLayer(
        new MQTTLayer(params, logger) as any,
        forwardData,
        considerConnection
      );
      break;
  }

  // Now that we have added a connection, we will
  // update the value.
  communicationBridge.connected.forcePublish();
}
