import { injectable } from "inversify";
import { InjectableNopeBaseModule } from "../../module";
import { NopeObservable } from "../../observables";
import { NopePromise } from "../../promise";
import { INopeObservable } from "../../types";
import { IHelloWorlModule } from "./IHellWorldModule";

@injectable()
export class HelloWorldModule
  extends InjectableNopeBaseModule
  implements IHelloWorlModule
{
  public testProp: INopeObservable<string>;

  /**
   * Custom Function
   *
   * @param {string} greetingsTo
   * @return {*}
   * @memberof TestModule
   */
  public async helloWorld(greetingsTo: string) {
    return "Hello " + greetingsTo + "! Greetings from " + this.identifier;
  }

  public async updateTestProp() {
    this.testProp.setContent("Internally Updated");
  }

  public sleep(n: number) {
    let timer: any = null;
    return new NopePromise<void>(
      (resolve, reject) => {
        timer = setTimeout(resolve, n);
      },
      (reason) => {
        console.log("Canceling Sleep Function because of:", reason);
        if (timer != null) {
          clearTimeout(timer);
        }
      }
    );
  }

  public async init() {
    this.author = {
      forename: "Martin",
      mail: "m.karkowski@zema.de",
      surename: "karkowski",
    };
    this.description = "Test Hello World Module for Nope 2.0";
    this.version = {
      date: new Date("12.10.2020"),
      version: 1,
    };

    await super.init();

    const _this = this;

    this.testProp = new NopeObservable();

    this.testProp.subscribe((value, sender) => {
      console.log(
        _this.identifier,
        'got update for "testProp" = ',
        value,
        "from",
        sender
      );
    });

    // Register the Function Manually.
    await this.registerMethod(
      "helloWorld",
      (...args) => _this.helloWorld(args[0]),
      {
        schema: {
          type: "function",
          inputs: [
            {
              name: "greetingsTo",
              schema: {
                type: "string",
                description: "Name who should be greeted.",
              },
            },
          ],
          outputs: {
            type: "string",
            description: "The Greeting",
          },
        },
      }
    );

    await this.registerMethod("updateTestProp", () => _this.updateTestProp(), {
      schema: {
        type: "function",
        inputs: [],
        outputs: {
          type: "null",
        },
      },
    });

    await this.registerMethod(
      "sleep",
      (amount: number) => _this.sleep(amount),
      {
        schema: {
          type: "function",
          inputs: [
            {
              name: "amount",
              schema: {
                type: "number",
              },
            },
          ],
          outputs: {
            type: "null",
          },
        },
      }
    );

    await this.registerProperty("testProp", this.testProp, {
      mode: ["publish", "subscribe"],
      schema: {
        type: "string",
      },
      topic: "testProp",
    });
  }

  public async dispose() {
    console.log("Deleting Module");
  }
}
