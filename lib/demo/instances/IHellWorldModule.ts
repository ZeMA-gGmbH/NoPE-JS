import { INopeModule, INopeObservable, IValidPromise } from "../../types";

export interface IHelloWorlModule extends INopeModule {
  testProp: INopeObservable<string>;
  helloWorld(greetingsTo: string): IValidPromise<string>;
  updateTestProp(): IValidPromise<void>;
  sleep(n: number): IValidPromise<void>;
}
