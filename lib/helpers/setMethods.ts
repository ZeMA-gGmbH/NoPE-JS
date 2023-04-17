/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @desc [description]
 */

/**
 * Helper Function which will determine the Difference between set01 and set02.
 * If values are in set02 and not in set01 they will be putted into added. If
 * items are in set01 but not in set02 they will be added to removed.
 *
 * @export
 * @template T
 * @param {Set<T>} set01 Base Set
 * @param {Set<T>} set02 Set to compare it with
 * @return {*}
 */
export function determineDifference<T>(
  set01: Set<T>,
  set02: Set<T>
): {
  added: Set<T>;
  removed: Set<T>;
} {
  const added = new Set<T>();
  const removed = new Set<T>();

  // We iterate over the set01 and
  // set02. If elements of set01 arent
  // present in set02 => they have been
  // removed
  for (const item of set01) {
    if (!set02.has(item)) {
      removed.add(item);
    }
  }

  // If elements of set02 arent
  // present in set01 => they have been
  // added
  for (const item of set02) {
    if (!set01.has(item)) {
      added.add(item);
    }
  }

  return {
    added,
    removed,
  };
}

/**
 * Unions the two sets
 * @param {Set<T>} set01
 * @param {Set<T>} set01
 * @returns
 */
export function union<T>(set01: Set<T>, set02: Set<T>): Set<T> {
  return new Set([...set01, ...set02]);
}

/**
 * Substracts set02 from set01
 * @param {Set<T>} set01 Base Set
 * @param {Set<T>} set02 The Set to substract
 * @returns
 */
export function difference<T>(set01: Set<T>, set02: Set<T>): Set<T> {
  const diff = new Set([...set01]);

  for (const s of set02) {
    diff.delete(s);
  }

  return diff;
}
