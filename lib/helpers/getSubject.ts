/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { BehaviorSubject, ReplaySubject, Subject } from "rxjs";

export interface TSubjectOptions {
  /**
   * Definition whether to show the current value on subscription.
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof TSubjectOptions
   */
  showCurrent?: boolean;

  /**
   * Definition, whether to playback the history every
   * time or not.
   *
   * @author M.Karkowski
   * @type {boolean}
   * @memberof TSubjectOptions
   */
  playHistory?: boolean;
}

/**
 * Helper to define the correct RXJS Subject based on the options (see {@link TSubjectOptions})
 *
 * @author M.Karkowski
 * @return {*}
 */
export function getSubject<T>(
  options: TSubjectOptions = {}
): Subject<T> | ReplaySubject<T> | BehaviorSubject<T> {
  if (options.showCurrent) {
    if (options.playHistory) {
      return new ReplaySubject<T>();
    }
    return new BehaviorSubject<T>(undefined);
  }
  return new Subject<T>();
}
