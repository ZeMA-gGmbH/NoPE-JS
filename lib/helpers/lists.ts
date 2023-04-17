import { dynamicSort, extractListElement } from "./arrayMethods";

/**
 * A Priority List. All Items are sorted by a Priority Number.
 *
 * @export
 * @class PriorityList
 */
export class PriorityList<T> {
  private _priority_list = new Array<{ priority: number; data: T }>();
  private _list = new Array<T>();
  private _updated = false;

  /**
   * Function to returns a sorted List containing only the Value
   *
   * @returns {Array<T>} Sorted List containing the Values.
   * @memberof PriorityList
   */
  public list(): Array<T> {
    return extractListElement(this._priority_list, "data");
  }

  protected _sort(): void {
    // Sort the List based on the element priority
    this._priority_list.sort(dynamicSort("priority", true));

    // Adapt the _list element :
    this._list = extractListElement(this._priority_list, "data");
    this._updated = true;
  }

  /**
   * Adds Data to the Priority List
   * @param _priority lower => lower priority
   * @param _data data which are stored
   */
  public push(_priority: number, _data: T): void {
    // Add the Element with the given priority to the list
    this._updated = false;
    this._priority_list.push({ priority: _priority, data: _data });
  }

  /**
   * Returns the Element with the lowest priority
   *
   * @param {boolean} [remove=true] Flag to remove the item. Defaults to true. Otherwise it remains in the list.
   * @return {(T | null)}
   * @memberof PriorityList
   */
  public highest(remove = true): T | null {
    if (!this._updated) {
      this._sort();
    }
    const _ret = this._priority_list[remove ? "splice" : "slice"](0, 1)[0];
    return _ret ? _ret.data : null;
  }

  /**
   * Returns the Element with the highest priority
   * @param {boolean} [remove=true] Flag to remove the item. Defaults to true. Otherwise it remains in the list.
   * @return {(T | null)}
   * @memberof PriorityList
   */
  public lowest(remove = true): T | null {
    if (!this._updated) {
      this._sort();
    }
    let _ret: { priority: number; data: T } | undefined = undefined;
    if (remove) {
      _ret = this._priority_list.pop();
    } else {
      _ret = this._priority_list[this._list.length - 1];
    }

    return _ret ? _ret.data : null;
  }

  /**
   * Returns the Length of the Priority list
   *
   * @readonly
   * @type {number}
   * @memberof PriorityList
   */
  public get length(): number {
    return this._priority_list.length;
  }
}

/**
 * Limited List. This list at max contains a specific amount of elements.
 * After the max number of elements has been added, the first element added
 * will be removed.
 */
export class LimitedList<T> {
  /**
   * Element containing the list
   *
   * @private
   * @type {Array<T>}
   * @memberof LimitedList
   */
  private _list: Array<T>;
  /**
   * Internal Pointer, showing the actual item.
   *
   * @private
   * @type {number}
   * @memberof LimitedList
   */
  private _pointer: number;

  constructor(public maxLength: number) {
    this._pointer = -1;
    this._list = new Array<T>();
  }

  /**
   * Adds Data to the Stack. The Pointer is getting adapted.
   *
   * @param {T} data
   * @returns
   * @memberof LimitedList
   */
  push(data: T) {
    // Check if the Maximum length is achieved
    if (this._list.length >= this.maxLength) {
      // Remove the First Element
      this._list = this._list.slice(1, this._pointer + 1);
    }

    // Store the Content
    const ret = this._list.push(data);

    // Adapt the Pointer
    this._pointer = this._list.length - 1;

    return ret;
  }

  /**
   * Contains the Length of the list.
   *
   * @readonly
   * @memberof LimitedList
   */
  public get length() {
    return this._list.length;
  }

  /**
   * Gets the current pointer.
   *
   * @readonly
   * @memberof LimitedList
   */
  public get currentPointer() {
    return this._pointer;
  }

  last(): T | null {
    if (this._list.length > 0) {
      this._pointer = this._list.length - 1;
      return this._list[this._pointer];
    }

    // No data available.
    return null;
  }

  /**
   * Returns the Pointer to the first item.
   * @returns
   */
  first(): T | null {
    this._pointer = this._list.length - 1;

    if (this._pointer >= 0 && this._pointer < this._list.length) {
      return this._list[this._pointer];
    }

    // No data available.
    return null;
  }

  /**
   * Returns the last item. Adapts the pointer and the
   * current item is the last item.
   * example:
   *      l = limited.last()
   *      c = limited.current()
   *
   *      l == c -> True
   * @returns The last element.
   */
  previous(): T | null {
    // Check if the Pointer is in the defined Range
    if (this._pointer - 1 >= 0 && this._pointer - 1 < this._list.length) {
      return this._list[--this._pointer];
    }

    // No data available.
    return null;
  }

  /**
   * Returns the current item, the pointer is showing at.
   * @returns
   */
  current(): T | null {
    // Check if the Pointer is in the defined Range
    if (this._pointer >= 0 && this._pointer < this._list.length) {
      return this._list[this._pointer];
    }

    /** No data available any more */
    return null;
  }

  next(): T | null {
    /** Check if the Pointer is in the defined Range */
    if (this._pointer + 1 >= 0 && this._pointer + 1 < this._list.length) {
      return this._list[++this._pointer];
    }

    /** No data available any more */
    return null;
  }

  /**
   * Pops the last element. If there is no element undefined is returned.
   * @returns The last element.
   */
  pop(current = false): T {
    if (current) {
      const ret = this._list.splice(this._pointer, 1)[0];
      return ret;
    }

    const ret = this._list.pop();
    // Adapt the Pointer
    this._pointer = this._list.length - 1;

    return ret;
  }

  /**
   * Helper to iterate over all items.
   * @param callbackFn
   * @param thisArg
   */
  public forEach(
    callbackFn: (item: T, index: number, array: Array<T>) => void,
    thisArg?: any
  ) {
    this._list.forEach(callbackFn, thisArg);
  }
}
