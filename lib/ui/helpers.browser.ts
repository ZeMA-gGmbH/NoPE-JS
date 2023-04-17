import { stringifyWithFunctions } from "../helpers/jsonMethods";
import { IGenericNopeModule, INopeModule } from "../types";
import { TRenderInstancePage } from "../types/ui";

/**
 * Converts the convertInstanceRenderPage to a string, which could be
 * store or something similar.
 *
 * @export
 * @template I The Instance Type
 * @param {(TRenderInstancePage<I & IGenericNopeModule>)} callback The callback to stringify.
 * @return {string} The parsed String.
 */
export function convertInstanceRenderPage<I extends INopeModule>(
  callback: TRenderInstancePage<I & IGenericNopeModule>
): string {
  return stringifyWithFunctions(callback);
}
