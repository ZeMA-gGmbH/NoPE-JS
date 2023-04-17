import { injectable } from "inversify";
import { InjectableNopeBaseModule } from "../../module";
import { NopeObservable } from "../../observables";
import { NopePromise } from "../../promise";
import { IHelloWorlModule } from "./IHellWorldModule";
import { nopeMethod, nopeProperty } from "../../decorators";
import { getNopeLogger, ILogger } from "../../logger/index.browser";

@injectable()
export class HelloWorldModuleWithDecorators
  extends InjectableNopeBaseModule
  implements IHelloWorlModule
{
  // @ts-ignore
  @nopeProperty({
    mode: ["publish"],
    topic: "testProp",
    schema: {},
  })
  public testProp = new NopeObservable<string>();

  // @ts-ignore
  @nopeProperty({
    mode: ["publish"],
    topic: "currentTime",
    schema: {
      type: "string",
    },
  })
  public currentTime = new NopeObservable<string>();

  /**
   * Custom Function
   *
   * @param {string} greetingsTo
   * @return {*}
   * @memberof TestModule
   */
  @nopeMethod({
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
  })
  async helloWorld(greetingsTo: string) {
    return "Hello " + greetingsTo + "! Greetings from " + this.identifier;
  }

  _logger: ILogger;

  /**
   * Test Function to Update the Property.
   *
   * @memberof HelloWorldModuleWithDecorator
   */
  @nopeMethod({
    schema: {
      type: "function",
      inputs: [],
      outputs: {
        type: "null",
      },
    },
  })
  async updateTestProp() {
    this.testProp.setContent("Internally Updated using updateTestProp()");
  }

  /**
   * Function which will delay the Execution.
   *
   * @param {number} n
   * @return {*}
   * @memberof HelloWorldModuleWithDecorator
   */
  @nopeMethod({
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
  })
  public sleep(n: number) {
    let timer: any = null;
    const _this = this;
    return new NopePromise<void>(
      (resolve, reject) => {
        timer = setTimeout(resolve, n);
      },
      (reason) => {
        _this._logger.info("Canceling Sleep Function because of:", reason);
        if (timer != null) {
          clearTimeout(timer);
        }
      }
    );
  }

  protected _interval: any;

  async init() {
    this._logger = getNopeLogger("HelloWorldModule");
    this._logger.info("Created by dispatcher:", this._core.id);

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

    // Every 1000 ms publish an update of the current time.
    this._interval = setInterval(() => {
      _this.currentTime.setContent(new Date().toISOString());
    }, 1000);

    const _this = this;
    this.testProp.setContent("INITAL_VALUE");

    this.testProp.subscribe((value, sender) => {
      _this._logger.info(
        _this.identifier,
        'got update for "testProp" = ',
        value,
        "from",
        sender
      );
    });
  }

  async dispose() {
    clearInterval(this._interval);
    this._logger.info("Deleting Module");
    await super.dispose();
  }
}
