/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-10-12 18:52:00
 * @modify date 2021-10-19 09:15:25
 * @desc [description]
 */

import { comparePatternAndPath } from "../helpers/pathMatchingMethods";
import {
  IEventAdditionalData,
  IEventCallback,
  INopeDispatcher,
  INopeObserver,
} from "../types/nope/index";
import { NopeCore } from "./Core";

/**
 * A Dispatcher to perform a function on a Remote
 * Dispatcher. Therefore a Task is created and forwarded
 * to the remote.
 *
 * @export
 * @class nopeDispatcher
 */
export class NopeDispatcher extends NopeCore implements INopeDispatcher {
  public get masterExists(): boolean {
    return this.connectivityManager.master.isMasterForced;
  }

  // See interface description
  public pushData<T = unknown>(
    path: string,
    content: T,
    options: Partial<IEventAdditionalData> = {}
  ): void {
    return this.dataDistributor.pushData(path, content, options);
  }

  // See interface description
  public pullData<T = unknown, D = null>(path: string, _default: D = null): T {
    return this.dataDistributor.pullData<T, D>(path, _default);
  }

  // See interface description
  public subscribeToEvent<T = unknown>(
    event: string,
    subscription: IEventCallback<T>
  ): INopeObserver {
    return this.eventDistributor.registerSubscription(event, subscription);
  }

  // See interface description
  public emitEvent<T>(
    eventName: string,
    data: T,
    options: Partial<IEventAdditionalData> = {}
  ) {
    this.eventDistributor.emit(eventName, data, options);
  }

  // See interface description
  public query(
    pattern: string,
    type: "instances" | "services" | "properties" | "events"
  ): string[] {
    let items: string[] = [];
    switch (type) {
      case "instances":
        items = this.instanceManager.instances.data.getContent().map((item) => {
          return item.identifier;
        });
        break;
      case "services":
        items = Array.from(
          // Extract the Ids of the Services
          this.rpcManager.services.simplified.keys()
        );
        break;
      case "properties":
        items = this.dataDistributor.publishers.data.getContent();
        break;
      case "events":
        items = this.eventDistributor.publishers.data.getContent();
        break;
      default:
        throw Error("Invalid Type-Parameter");
    }

    return items.filter((item) => {
      return comparePatternAndPath(pattern, item).affected;
    });
  }

  // See interface description
  public getAllHosts(): string[] {
    const hosts = new Set<string>();
    for (const info of this.connectivityManager.dispatchers.originalData.values()) {
      hosts.add(info.host.name);
    }

    return Array.from(hosts);
  }
}
