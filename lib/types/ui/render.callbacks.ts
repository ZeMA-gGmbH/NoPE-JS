/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import {
  IGenericNopeModule,
  IInstanceCreationMsg,
  INopeModule,
  INopeModuleDescription,
  TValidAsssignmentChecker,
  ValidSelectorFunction,
} from "../nope";
import { IDynamicUiRenderData } from "./helpers.interface";
import { TRenderFunctionResult } from "./layout.interface";

/** Helper used, to render the instance details */
export type TRenderInstancePage<
  T extends INopeModule = INopeModule,
  Extension = {}
> = (
  /** The DIV Element */
  div: HTMLDivElement,
  /** The Provided Options used by the function to create the ui */
  options: IDynamicUiRenderData & {
    /** The Instance to Render. */
    input: T & IGenericNopeModule;
  } & Extension
) => Promise<TRenderFunctionResult>;

/** UI to define an instance. */
export type TInstanceManagerPage<
  T extends INopeModule = INopeModule,
  Extension = {}
> = (
  /** The DIV Element */
  div: HTMLDivElement,
  /** The Provided Options used by the function to create the ui */
  options: IDynamicUiRenderData & {
    /** Name of the Constructor */
    ctorName: string;
    /** The callback to create the instance. */
    createInstance: (
      description: Partial<IInstanceCreationMsg>,
      options?: {
        selector?: ValidSelectorFunction;
        assignmentValid?: TValidAsssignmentChecker;
      }
    ) => Promise<T & IGenericNopeModule>;
    instances: Array<INopeModuleDescription>;
  } & Extension
) => Promise<TInstanceManagerPageResult>;

export interface TInstanceManagerPageResult<T = any>
  extends TRenderFunctionResult {
  /**
   * Function, which must return the current service-data.
   *
   * @author M.Karkowski
   * @return {Promise<T>}
   * @memberof IEditPage
   */
  getData(): Promise<T>;

  /**
   * Function which must return true, if the Entered-
   * Data is valid. Otherwise the Update will be refused
   *
   * @author M.Karkowski
   * @return {Promise<boolean>}
   * @memberof IEditPage
   */
  isValid(): Promise<boolean>;
}
