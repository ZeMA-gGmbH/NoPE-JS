/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

import { NopeEventEmitter } from "../eventEmitter/nopeEventEmitter";
import { determineDifference } from "../helpers/setMethods";
import { NopeObservable } from "../observables/nopeObservable";
import { INopeEventEmitter, INopeObservable } from "../types/nope";
import {
  IMapBasedMergeData,
  IMergeData,
} from "../types/nope/nopeHelpers.interface";
import { extractUniqueValues, tranformMap } from "./mapMethods";

export class MergeData<T, D = any> implements IMergeData<T, D> {
  /**
   * Element which will trig implements IMergeDatager an event containing the changes
   *
   * @author M.Karkowski
   * @type {INopeEventEmitter<{
   *     added: T[],
   *     removed: T[]
   *   }>}
   * @memberof MergeData
   */
  readonly onChange: INopeEventEmitter<{
    added: T[];
    removed: T[];
  }>;

  /**
   * Contains the current data.
   *
   * @author M.Karkowski
   * @type {INopeObservable<T[]>}
   * @memberof MergeData
   */
  readonly data: INopeObservable<T[]>;

  constructor(
    public originalData: D,
    protected _extractData: (data: D) => Set<T>
  ) {
    this.onChange = new NopeEventEmitter();
    this.data = new NopeObservable();
    this.data.setContent([]);
  }

  /**
   * Update the underlying data.
   *
   * @author M.Karkowski
   * @param {*} [data=this.originalData]
   * @memberof MergeData
   */
  public update(data: D = null, force = false): void {
    if (data !== null) {
      this.originalData = data;
    }

    const afterAdding = this._extractData(this.originalData);
    const diff = determineDifference(
      new Set(this.data.getContent()),
      afterAdding
    );

    if (force || diff.removed.size > 0 || diff.added.size > 0) {
      // Update the currently used subscriptions
      this.data.setContent(Array.from(afterAdding));
      // Now emit, that there is a new subscription.
      this.onChange.emit({
        added: Array.from(diff.added),
        removed: Array.from(diff.removed),
      });
    }
  }

  /**
   * Disposes the Element.
   *
   * @author M.Karkowski
   * @memberof MergeData
   */
  public dispose() {
    this.data.dispose();
    this.onChange.dispose();
  }
}

export class MapBasedMergeData<
    OriginalKey,
    OriginalValue,
    ExtractedKey = OriginalKey,
    ExtractedValue = OriginalValue
  >
  extends MergeData<ExtractedValue, Map<OriginalKey, OriginalValue>>
  implements
    IMapBasedMergeData<
      OriginalKey,
      OriginalValue,
      ExtractedKey,
      ExtractedValue
    >
{
  public amountOf: Map<ExtractedKey, number>;
  public simplified: Map<ExtractedKey, ExtractedValue>;
  public keyMapping: Map<OriginalKey, Set<ExtractedKey>>;
  public keyMappingReverse: Map<ExtractedKey, Set<OriginalKey>>;
  public conflicts: Map<ExtractedKey, Set<ExtractedValue>>;
  public orgKeyToExtractedValue: Map<OriginalKey, Set<ExtractedValue>>;
  public extractedKey: ExtractedKey[];
  public extractedValue: ExtractedValue[];

  constructor(
    originalData: Map<OriginalKey, OriginalValue>,
    protected _path: keyof OriginalValue | string = "",
    protected _pathKey: keyof OriginalValue | string = null
  ) {
    super(originalData, (m) => {
      return extractUniqueValues(m, _path as string, _pathKey as string);
    });

    this.amountOf = new Map<ExtractedKey, number>();
    this.simplified = new Map<ExtractedKey, ExtractedValue>();
    this.keyMapping = new Map<OriginalKey, Set<ExtractedKey>>();
    this.keyMappingReverse = new Map<ExtractedKey, Set<OriginalKey>>();
    this.conflicts = new Map<ExtractedKey, Set<ExtractedValue>>();
    this.orgKeyToExtractedValue = new Map<OriginalKey, Set<ExtractedValue>>();

    this.extractedKey = [];
    this.extractedValue = [];
  }

  /**
   * Update the underlying data.
   *
   * @author M.Karkowski
   * @param {*} [data=this.originalData]
   * @memberof MergeData
   */
  public update(data: Map<OriginalKey, OriginalValue> = null): void {
    if (data !== null) {
      this.originalData = data;
    }

    // Now lets update the amount of the data:
    const result = tranformMap<ExtractedKey, ExtractedValue, OriginalKey>(
      this.originalData,
      this._path as string,
      this._pathKey as string
    );

    // Now assign the results to our items.
    this.simplified = result.extractedMap;
    this.amountOf = result.amountOf;
    this.keyMapping = result.keyMapping;
    this.keyMappingReverse = result.keyMappingReverse;
    this.conflicts = result.conflicts;
    this.orgKeyToExtractedValue = result.orgKeyToExtractedValue;
    this.extractedKey = [...this.simplified.keys()];
    this.extractedValue = [...this.simplified.values()];

    super.update(data);
  }
}
