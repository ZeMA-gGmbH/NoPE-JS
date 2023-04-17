/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import { IRenderData } from "../helpers.interface";
import { TRenderFunctionResult } from "../layout.interface";
import { PN, PORT_DATA, PORT_FUNCTION } from "./INodes";

/**
 * Type to define the Ports of a UI:
 */
export type TServiceGetPortsReturn = {
  inputs: {
    id: string;
    label: string;
    type?: PORT_DATA | PORT_FUNCTION;
  }[];
  outputs: {
    id: string;
    label: string;
    type?: PORT_DATA | PORT_FUNCTION;
  }[];
};

/**
 * Function, used to define the Ports of a service.
 */
export type TGetPorts<T extends PN, Extension = {}> = (
  options?: IRenderData & {
    input: T;
  } & Extension
) => Promise<TServiceGetPortsReturn>;

export interface IServiceEditPage<T = any> extends TRenderFunctionResult {
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

  /**
   * Function used to Descripe the configured Settings in a short sentence.
   */
  getDescriptionText?: () => Promise<string>;

  /**
   * Element showing the type of the edit panel.
   */
  type: "node" | "edge";
}
