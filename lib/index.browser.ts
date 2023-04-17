/**
 * @author Martin Karkowski
 * @email m.karkowski@zema.de
 */

import "reflect-metadata";
import * as communcation from "./communication/index.browser";
import * as decorators from "./decorators";
import * as dispatcher from "./dispatcher/index";
import * as eventEmitter from "./eventEmitter";
import * as helpers from "./helpers/index.browser";
import * as loader from "./loader/index.browser";
import * as logger from "./logger/index.browser";
import * as modules from "./module/index";
import * as observables from "./observables/index";
import * as promise from "./promise/index";
import * as pubSub from "./pubSub";
import * as types from "./types/index";
import * as ui from "./ui/index.browser";
import * as plugins from "./plugins/index";

export * from "./communication/index.browser";
export * from "./decorators";
export * from "./dispatcher/index";
export * from "./eventEmitter";
export * from "./helpers/index.browser";
export * from "./loader/index.browser";
export * from "./logger/index.browser";
export * from "./module/index";
export * from "./observables/index";
export * from "./promise/index";
export * from "./pubSub";
export * from "./types/index";
export * from "./types/nope";
export * from "./ui/index.browser";
export {
  communcation,
  decorators,
  dispatcher,
  eventEmitter,
  helpers,
  loader,
  logger,
  types,
  modules,
  observables,
  promise,
  pubSub,
  ui,
  plugins,
};
