/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-03-23 07:30:19
 * @modify date 2022-01-03 17:33:58
 * @desc [description]
 */

import { generateId } from "../helpers/idMethods";
import { ValidLoggerDefinition } from "../logger/getLogger";
import { ICommunicationBridge } from "../types/nope/nopeCommunication.interface";
import { addLayer, validLayerOrMirror } from "./addLayer.nodejs";
import { Bridge } from "./bridge";

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
 * @return {ICommunicationBridge} A bridge
 */
export function getLayer(
  layer: validLayerOrMirror,
  parameter: number | string = null,
  logger: ValidLoggerDefinition = false
): ICommunicationBridge {
  // Create the Bridge
  const communicationBridge = new Bridge(generateId(), logger);

  // Add the Logger.
  addLayer(communicationBridge, layer, parameter, logger, true);

  // Return the Bridge
  return communicationBridge as any as ICommunicationBridge;
}
