import { IJsonSchema } from "./IJSONSchema";
import {
  IServiceOptions,
  IParsableDescription,
} from "./nope/nopeModule.interface";

export interface ISystemElements {
  modules: IParsableDescription[];
  services: IServiceOptions[];
  generalInformationModel: IJsonSchema;
}
