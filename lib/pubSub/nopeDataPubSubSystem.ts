/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-11-12 12:25:30
 * @modify date 2022-01-06 09:54:40
 * @desc [description]
 */

import { memoize } from "lodash";
import { deepClone, flattenObject } from "../helpers/objectMethods";
import {
  comparePatternAndPath as _comparePatternAndPath,
  containsWildcards,
  MULTI_LEVEL_WILDCARD,
} from "../helpers/pathMatchingMethods";
import {
  IDataPubSubSystem,
  IEventAdditionalData,
  INopeObservable,
  INopeTopicWithDirectAccess,
  ITopicSetContentOptions,
} from "../types/nope/index";
import { PubSubSystemBase } from "./nopePubSubSystem";

// Create a memoized function for the pattern matching (its way faster)
const comparePatternAndPath = memoize(
  (pattern: string, path: string) => {
    return _comparePatternAndPath(pattern, path);
  },
  (pattern: string, path: string) => {
    return `${pattern}-${path}`;
  }
);

/**
 * Default implementation of {@link IDataPubSubSystem}
 *
 * Extends the {@link PubSubSystemBase} by adding the following properties and methods:
 * - `pushData` to push data into the system.
 * - `pullData` to pull data from the system. Will allways return the current data or the default value if no data is present at the given path.
 * - `patternbasedPullData` to pull data with a given pattern. See the example for details.
 * - `patternBasedPush` to push data with a given pattern into the system.
 * - If you want to acces the root data please check the property `data` which will contain the entire data root that has been created.
 */
export class DataPubSubSystem
  extends PubSubSystemBase<
    ITopicSetContentOptions,
    INopeObservable,
    INopeTopicWithDirectAccess
  >
  implements IDataPubSubSystem
{
  /**
   * A Getter to return a COPY of the item. Outside of the system,
   * you'll never receive the original object. It is allways a clone.
   *
   *
   * @author M.Karkowski
   * @readonly
   * @type {unknown}
   * @memberof PubSubSystemBase
   */
  public get data(): unknown {
    return deepClone(this._data);
  }

  /**
   * Option to push data into the system see {@link IDataPubSubSystem.pushData} @ {@link IDataPubSubSystem}
   * @param path The path of the data.
   * @param content The content of the Data.
   * @param options The options used during pushing the data (see {@link IEventAdditionalData})
   * @returns nothing.
   */
  public pushData<T = unknown>(
    path: string,
    content: T,
    options: Partial<IEventAdditionalData> = {}
  ): void {
    return this._pushData(path, path, content, options);
  }

  /**
   * Option to pull data from the system see {@link IDataPubSubSystem.pullData} @ {@link IDataPubSubSystem}
   * @param topic the Topic to use.
   * @param _default The default object, if nothing else is provided
   * @returns The data. Defined as T
   */
  public pullData<T = unknown, D = null>(topic: string, _default: D = null): T {
    return this._pullData<T, D>(topic, _default);
  }

  /**
   * Option to pull data from the system with a pattern see {@link IDataPubSubSystem.patternbasedPullData} @ {@link IDataPubSubSystem}
   * @param pattern The pattern (see {@link })
   * @param _default The Default object, if data is not present.
   * @returns
   */
  public patternbasedPullData<T = unknown, D = null>(
    pattern: string,
    _default: D = null
  ): { path: string; data: T }[] {
    return this._patternbasedPullData<T, D>(pattern, _default);
  }

  /**
   * Option to push data to the system using a pattern see {@link IDataPubSubSystem.patternBasedPush} @ {@link IDataPubSubSystem}
   * @param pattern The pattern (see {@link })
   * @param data The data to push
   * @param options The options used during pushing the data (see {@link IEventAdditionalData})
   * @param fast If enabled, firstly, the data is pushed, afterwards, we just inform once.
   * @returns Nothing
   */
  public patternBasedPush<T = unknown>(
    pattern: string,
    data: T,
    options: Partial<IEventAdditionalData> = {},
    fast = false // Flag to emit single changes or all changes.
  ): void {
    // To extract the data based on a Pattern,
    // we firstly, we check if we would affect the data.
    if (!containsWildcards(pattern)) {
      return this._pushData(pattern, pattern, data, options);
    }

    if (pattern.includes(MULTI_LEVEL_WILDCARD)) {
      throw Error("You can only use single-level wildcards in this action");
    }

    const flattenData = flattenObject(this._data);
    const _options = this._updateOptions(options);

    for (const path of flattenData.keys()) {
      if (comparePatternAndPath(pattern, path).affectedOnSameLevel) {
        this._pushData(path, pattern, data, _options, fast);
      }
    }

    if (fast) {
      // Its better for us, to just store the incremental changes
      // with the pattern
      this.onIncrementalDataChange.emit({
        path: pattern,
        data,
        ..._options,
      });
    }
  }

  protected _sendCurrentDataOnSubscription = true;

  /**
   * Describes the Data.
   * @returns
   */
  public toDescription() {
    const _data = super.toDescription();

    return {
      ..._data,
      data: this._data,
    };
  }
}
