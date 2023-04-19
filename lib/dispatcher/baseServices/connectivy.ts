/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { avgOfArray, maxOfArray, minOfArray } from "../../helpers/arrayMethods";
import { getNopeLogger } from "../../logger/getLogger";
import { INopeDispatcher } from "../../types/nope";

const logger = getNopeLogger("baseService");

/**
 * Generate and registers a ping service.
 *
 * @author M.Karkowski
 * @export
 * @param {INopeDispatcher} dispatcher
 * @return {*} The function to ping all dispatchers.
 */
export async function generatePingServices(dispatcher: INopeDispatcher) {
  // Name of the Service
  const serviceName = `nope/baseService/ping`;

  const ping = async () => {
    return {
      dispatcherId: dispatcher.id,
      timestamp: dispatcher.connectivityManager.now,
    };
  };

  logger.info("Adding 'ping' service!");

  if (!dispatcher.rpcManager.isProviding(serviceName)) {
    // Registers the Ping Method at the Dispatcher.
    await dispatcher.rpcManager.registerService(ping, {
      id: serviceName,
      schema: {
        inputs: [],
        outputs: {
          type: "object",
          properties: {
            dispatcherId: {
              type: "string",
              description: "Id of the responding Dispatcher",
            },
            timestamp: {
              type: "number",
              description: "UTC-Timestamp of the system which is responding",
            },
          },
        },
        type: "function",
        description: "Ping",
      },
    });
  }

  return await generatePingAccessors(dispatcher);
}

/**
 * Helper to generate the Accessors to ping dispatchers or ping all
 * systems
 *
 * @author M.Karkowski
 * @export
 * @param {INopeDispatcher} dispatcher The Dispatcher, used to perform the calls.
 * @return {*}
 */
export async function generatePingAccessors(dispatcher: INopeDispatcher) {
  const serviceName = `nope/baseService/ping`;

  logger.info("Adding 'determinePing' service!");

  // Function to determine the ping in the services.
  const determinePing = async (target: string) => {
    // Call the Pings
    const start = dispatcher.connectivityManager.now;
    const result: {
      requestId: string;
      dispatcherId: string;
      timestamp: number;
      isMaster: boolean;
    } = await dispatcher.rpcManager.performCall(serviceName, [], { target });
    const delay = dispatcher.connectivityManager.now;

    const ping = delay - start;

    return {
      ping,
      ...result,
    };
  };

  logger.info("Adding 'pingAll' service!");

  // Function to Ping all Services
  const pingAll = async () => {
    const dispatchers = Array.from(
      dispatcher.rpcManager.services.keyMappingReverse.get(serviceName)
    );
    const promises = dispatchers.map((target) => {
      return determinePing(target);
    });
    const pings = await Promise.all(promises);
    const avg = avgOfArray(pings, "ping");
    const max = maxOfArray(pings, "ping");
    const min = minOfArray(pings, "ping");

    return {
      pings,
      avg,
      max,
      min,
    };
  };

  return {
    determinePing,
    pingAll,
  };
}

/**
 * Registers a sync service, which will syncronize the time
 *
 * @author M.Karkowski
 * @export
 * @param {INopeDispatcher} dispatcher
 * @return {*} The Sync-Method to call
 */
export async function enableTimeSyncing(dispatcher: INopeDispatcher) {
  if (!dispatcher.rpcManager.isProviding(`nope/baseService/ping`)) {
    await generatePingServices(dispatcher);
  }

  const determinePing = (await generatePingAccessors(dispatcher)).determinePing;

  // Function to determine the ping in the services.
  const manualSyncTime = async () => {
    const masterId = dispatcher.connectivityManager.master.id;
    const ping = await determinePing(masterId);

    // Now use the delay to synchronize the time.
    dispatcher.connectivityManager.syncTime(ping.timestamp, ping.ping / 2);
  };

  dispatcher.connectivityManager.dispatchers.onChange.subscribe((changes) => {
    if (dispatcher.disposing) {
      return;
    }

    if (!dispatcher.connectivityManager.isMaster) {
      manualSyncTime()
        .catch((e) => {
          logger.error("Failed synchronizing time");
          logger.error(e);
        })
        .then((_) => {
          logger.info(
            `Synchronized time with master=${dispatcher.connectivityManager.master.id}`
          );
        });
    }
  });

  logger.info("Adding 'manualSyncTime' service!");

  return {
    manualSyncTime,
  };
}

/**
 * Helper, that lets enables waiting for a required dispatcher.
 *
 * @author M.Karkowski
 * @export
 * @param {INopeDispatcher} dispatcher
 * @return {*}
 */
export async function waitForDispatcher(
  dispatcher: INopeDispatcher,
  name: string
) {
  dispatcher.ready.getter = (value) => {
    return (
      dispatcher.connectivityManager.dispatchers.data
        .getContent()
        .includes(name) && value
    );
  };

  return {};
}

/**
 * A Helper to create a Service to manually define a master.
 *
 * @author M.Karkowski
 * @export
 * @param {INopeDispatcher} dispatcher The Dispatcher to use.
 * @return {*}
 */
export async function generateDefineMaster(dispatcher: INopeDispatcher) {
  /**
   * Create a Ping service.
   *
   * @author M.Karkowski
   * @param {string} requestId
   * @return {*}
   */
  const defineAsMaster = async (value = true) => {
    dispatcher.connectivityManager.isMaster = value;
  };

  // Registers the Ping Method at the Dispatcher.
  await dispatcher.rpcManager.registerService(defineAsMaster, {
    id: `nope/baseService/defineAsMaster`,
    schema: {
      description:
        "Defines the desired Node as Master. Propagets, that this system is a master",
      inputs: [
        {
          name: "value",
          optional: true,
          schema: {
            type: "boolean",
          },
        },
      ],
      outputs: [],
    },
  });

  const setMaster = async () => {
    // Set the Master to True
    dispatcher.connectivityManager.isMaster = true;
    // Get the Master ID
    const masterId = dispatcher.id;
    const service = `nope/baseService/defineAsMaster`;

    // Get the Matching Dispatchers.
    const relevantDispatchers =
      dispatcher.rpcManager.services.keyMappingReverse.get(
        `nope/baseService/defineAsMaster`
      );
    relevantDispatchers.delete(masterId);
    const targets = Array.from(relevantDispatchers);

    await dispatcher.rpcManager.performCall(
      targets.map((_) => {
        return service;
      }),
      [false],
      targets.map((target) => {
        return { target, timeout: 200 };
      })
    );
  };

  logger.info("Adding 'setMaster' service!");

  return {
    setMaster,
  };
}
