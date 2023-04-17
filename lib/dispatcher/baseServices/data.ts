/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { sleep } from "../../helpers/async";
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
export async function enablingSyncingData(dispatcher: INopeDispatcher) {
  logger.info("Adding 'sync-data'-service!");

  // Registers the Ping Method at the Dispatcher.
  await dispatcher.connectivityManager.dispatchers.onChange.subscribe(
    async (eventData) => {
      // If the Dispatcher is disposing we do not consider that.
      if (dispatcher.disposing) {
        return;
      }

      try {
        // If there is added Data
        if (eventData.added.length > 0) {
          // And if we are the master module
          // we will emit the new data.
          // Alternativ: dispatcher.id == dispatcher.connectivityManager.master.id
          if (dispatcher.connectivityManager.isMaster) {
            // But before, wait for shure.
            await sleep(0);

            // Get the Data.
            const data = dispatcher.dataDistributor.pullData("", {});

            // Emit the Data.
            dispatcher.communicator.emit("dataChanged", {
              args: [],
              data: data,
              forced: false,
              path: "",
              sender: dispatcher.id,
              timestamp: dispatcher.connectivityManager.now,
            });

            logger.info(`Send data to synchronized data. Acting as master`);
          }
        }
      } catch (e) {
        logger.error("Failed to send an update.");
      }
    }
  );

  return {};
}
