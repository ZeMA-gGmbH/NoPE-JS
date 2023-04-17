/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 * @create date 2020-10-12 18:31:35
 * @modify date 2020-11-09 09:45:51
 * @desc [description]
 */

import { IInstanceDescriptionMsg } from "./nopeCommunication.interface";

export interface IRemoteInstance extends IInstanceDescriptionMsg {
  init(...params): Promise<void>;
  dispose(): Promise<void>;
}
