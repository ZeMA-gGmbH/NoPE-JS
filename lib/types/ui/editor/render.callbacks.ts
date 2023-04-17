/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { IRenderData } from "../helpers.interface";
import { IServiceEditPage } from "./IServiceEditPage";
import { PN } from "./INodes";

/** Helper to configurate a service */
export type TRenderConfigureServicePage<T extends PN, Extension = {}> = (
  div: HTMLDivElement,
  options: IRenderData & {
    input: T;
  } & Extension
) => Promise<IServiceEditPage>;
