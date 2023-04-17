/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { INopeDispatcher } from "../../types/nope";
import {
  enableTimeSyncing,
  generateDefineMaster,
  generatePingServices,
  waitForDispatcher,
} from "./connectivy";
import { enablingSyncingData } from "./data";

export {
  generateDefineMaster,
  generatePingServices,
  enableTimeSyncing as generateSyncServices,
  enablingSyncingData,
  waitForDispatcher,
};

/**
 * Helper to define simpler names for the Services
 */
export const SERVICES_NAME = {
  defineMaster: generateDefineMaster,
  pingService: generatePingServices,
  timeSyncingService: enableTimeSyncing,
  syncingDataService: enablingSyncingData,
};

/**
 * Helper, which will enable all BaseServices
 *
 * @author M.Karkowski
 * @export
 * @param {INopeDispatcher} dispatcher The Dispatcher to use.
 * @param {{
 *     services?: Array<keyof typeof SERVICES_NAME>;
 *   }} [opts]
 * @return {Promise<{
 *   manualSyncTime?: () => Promise<void>;
 *   determinePing?: (target: string) => Promise<{
 *     requestId: string;
 *     dispatcherId: string;
 *     timestamp: number;
 *     isMaster: boolean;
 *     ping: number;
 *   }>;
 *   pingAll?: () => Promise<{
 *     pings: Promise<{
 *       requestId: string;
 *       dispatcherId: string;
 *       timestamp: number;
 *       isMaster: boolean;
 *       ping: number;
 *     }>[];
 *     avg: number;
 *     max: {
 *       max: number;
 *       index: number;
 *     };
 *     min: {
 *       min: number;
 *       index: number;
 *     };
 *   }>;
 *   setMaster?: () => Promise<void>;
 * }>} The provided Functions.
 */
export async function addAllBaseServices(
  dispatcher: INopeDispatcher,
  opts: {
    services?: Array<keyof typeof SERVICES_NAME>;
  } = {}
): Promise<{
  manualSyncTime?: () => Promise<void>;
  determinePing?: (target: string) => Promise<{
    requestId: string;
    dispatcherId: string;
    timestamp: number;
    isMaster: boolean;
    ping: number;
  }>;
  pingAll?: () => Promise<{
    pings: Promise<{
      requestId: string;
      dispatcherId: string;
      timestamp: number;
      isMaster: boolean;
      ping: number;
    }>[];
    avg: number;
    max: {
      max: number;
      index: number;
    };
    min: {
      min: number;
      index: number;
    };
  }>;
  setMaster?: () => Promise<void>;
}> {
  await dispatcher.ready.waitFor();
  let services: {
    [index: string]: (...args) => Promise<any>;
  } = {};

  if (opts.services) {
    for (const name of opts.services) {
      services = Object.assign(services, await SERVICES_NAME[name](dispatcher));
    }
  } else {
    for (const name in SERVICES_NAME) {
      services = Object.assign(services, await SERVICES_NAME[name](dispatcher));
    }
  }

  return services;
}
