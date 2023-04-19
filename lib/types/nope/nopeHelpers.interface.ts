import { INopeEventEmitter } from "./nopeEventEmitter.interface";
import { INopeObservable } from "./nopeObservable.interface";

/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2021-11-23 12:31:01
 * @modify date 2021-11-23 12:31:01
 * @desc [description]
 */
export interface IMergeData<T = any, K = any> {
  /**
   * Event Emitter, which is called on changes, with the removed and Added Items.
   */
  onChange: INopeEventEmitter<{
    added: T[];
    removed: T[];
  }>;
  /**
   * The simplified data. A simple List, containing only the Values for all Keys.
   */
  data: INopeObservable<T[]>;
  /**
   * Function, which must be called on data updates.
   * @param data The updated Data.
   */
  update(data?: K): void;

  /**
   * The Original Data.
   */
  originalData: K;

  /**
   * Removes all subscriptions.
   *
   * @author M.Karkowski
   * @memberof IMergeData
   */
  dispose(): void;
}

export interface IMapBasedMergeData<
  OriginalKey,
  OriginalValue,
  ExtractedKey = OriginalKey,
  ExtractedValue = OriginalValue
> extends IMergeData<ExtractedValue, Map<OriginalKey, OriginalValue>> {
  /**
   * Adds a dinfition of the Amounts, of the elements.
   */
  amountOf: Map<ExtractedKey, number>;

  /**
   * Simplifed Data Access.
   */
  simplified: Map<ExtractedKey, ExtractedValue>;

  /**
   * Contains the Mapping of the original Key to the Extracted Key.
   * - `key` = `OriginalKey`;
   * - `value` = `Set<ExtractedKey>`;
   */
  keyMapping: Map<OriginalKey, Set<ExtractedKey>>;

  /**
   * Contains the Mapping of the `extracted Key` to the `original Key`.
   * - `key` = `ExtractedKey`;
   * - `value` = `OriginalKey`;
   */
  keyMappingReverse: Map<ExtractedKey, Set<OriginalKey>>;

  /**
   * Contains conflicts.
   * key = ExtractedKey;
   * value =  All determined different Values.
   */
  conflicts: Map<ExtractedKey, Set<ExtractedValue>>;

  /**
   * Maps the Original Key to the Extracted value;
   */
  orgKeyToExtractedValue: Map<OriginalKey, Set<ExtractedValue>>;

  /**
   * Contains the extracted Keys as Array.
   */
  extractedKey: ExtractedKey[];

  /**
   * Contains the extracted Values.
   */
  extractedValue: ExtractedValue[];
}
