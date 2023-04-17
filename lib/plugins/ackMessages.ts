import { plugin } from "./plugin";
import { Bridge as OrgBridge } from "../communication/index.browser";
import { NopeConnectivityManager as OrgConnectivityManager } from "../dispatcher/ConnectivityManager";
import { ValidLoggerDefinition } from "../logger/getLogger";
import { INopeEventEmitter, NopeEventEmitter } from "../eventEmitter";
import {
  EventnameToEventType,
  IEventAdditionalData,
  INopeINopeConnectivityOptions,
  INopeObservable,
  INopeStatusInfo,
  toConstructor,
} from "../types";
import { generateId, difference } from "../helpers/index.browser";

export const extend = plugin(
  [
    "communication.Bridge",
    "dispatcher.connectivityManager.NopeConnectivityManager",
  ],
  (
    clBridge: toConstructor<OrgBridge>,
    clConnectivityManager: toConstructor<OrgConnectivityManager>
  ) => {
    interface AckMessage {
      messageId: string;
      dispatcherId: string;
    }

    class Bridge extends clBridge {
      /**
       * Helper to forward received messages.
       *
       * @protected
       * @type {INopeEventEmitter<AckMessage>}
       * @memberof Bridge
       */
      protected _onMessageReceived: INopeEventEmitter<AckMessage>;
      /**
       * Map storing the messages, where we expect an Acknowledgement.
       *
       * @protected
       * @memberof Bridge
       */
      protected _openMessages: Map<
        string,
        {
          received: Set<string>;
          target: Set<string>;
        }
      >;

      public onTransportError: INopeEventEmitter;
      public defaultTargets: Array<string>;
      public ackReplyId: string;

      constructor(id?: string, logger?: ValidLoggerDefinition) {
        super(id, logger);

        this._onMessageReceived = new NopeEventEmitter();
        this._openMessages = new Map();
        this.defaultTargets = [];
        this.ackReplyId = null;
        this.onTransportError = new NopeEventEmitter();

        this.onTransportError.subscribe((err) => {
          if (this._logger) {
            this._logger.error("Failed to receive an acknowledge message!");
            this._logger.error(err);
          } else {
            console.error("Failed to receive an acknowledge message!");
            console.error(err);
          }
        });

        this.on("ackMessage" as any, (msg) =>
          this._onMessageReceived.emit(msg)
        ).catch((err) => {
          if (this._logger) {
            this._logger.error("Failed to subscribe to 'ackMessage'");
            this._logger.error(err);
          } else {
            console.error("Failed to subscribe to 'ackMessage'");
            console.error(err);
          }
        });
      }

      public async emit<T extends keyof EventnameToEventType>(
        eventname: T,
        data: EventnameToEventType[T],
        target: string | Array<string> = null,
        timeout: number = 0
      ): Promise<void> {
        if ((eventname as any) !== "ackMessage" && this.ackReplyId) {
          // Firstly we try to define the Target.
          let targetToUse = new Set();

          if (target === null) {
            if (this.defaultTargets) {
              targetToUse = new Set(this.defaultTargets);
            } else if (data.target) {
              targetToUse.add(data.target);
            }
          } else {
            if (typeof target === "string") {
              targetToUse.add(target);
            } else if (Array.isArray(target)) {
              target.map((item) => targetToUse.add(item));
            }
          }

          if (targetToUse.size) {
            const messageId = generateId();
            data.messageId = messageId;

            // We will define a Promise, which will wait for the ackknowledge ment.
            const promise = this._onMessageReceived.waitFor(
              (msg) => {
                // If the Message is still open we try to
                // close it.
                if (this._openMessages.has(msg.messageId)) {
                  const target = this._openMessages.get(msg.messageId).target;
                  const received = this._openMessages.get(
                    msg.messageId
                  ).received;
                  received.add(msg.dispatcherId);

                  // Therefore we determine the difference between
                  // the targets and
                  if (difference(target, received).size === 0) {
                    this._openMessages.delete(msg.messageId);
                    return true;
                  }
                }

                return false;
              },
              {
                timeout,
              }
            );

            // Now lets call emit
            const res = await super.emit(eventname, data);

            // And now we will await the
            // Wait - For result.
            await promise;

            return res;
          }
        }

        return await super.emit(eventname, data);
      }

      public async on<T extends keyof EventnameToEventType>(
        eventname: T,
        cb: (data: EventnameToEventType[T]) => void
      ): Promise<void> {
        if ((eventname as string) === "ackMessage") {
          return await super.on(eventname, cb);
        } else {
          return await super.on(eventname, (msg) => {
            cb(msg);

            if (msg.messageId && this.ackReplyId) {
              this.emit("ackMessage" as any, {
                messageId: msg.messageId,
                dispatcherId: this.ackReplyId,
              }).catch((err) => {
                if (this._logger) {
                  this._logger.error("Failed to emit an acknowledge message!");
                  this._logger.error(err);
                } else {
                  console.error("Failed to emit an acknowledge message!");
                  console.error(err);
                }
              });
            }
          });
        }
      }
    }

    class NopeConnectivityManager extends clConnectivityManager {
      public forceAckMessage: boolean;

      constructor(
        options: INopeINopeConnectivityOptions,
        _generateObservable: <T>() => INopeObservable<
          T,
          T,
          T,
          IEventAdditionalData
        >,
        id?: string
      ) {
        super(options, _generateObservable, id);

        (this._communicator as Bridge).ackReplyId = this.id;
        this.forceAckMessage = true;

        this.dispatchers.data.subscribe((dispatchers) => {
          if (this.forceAckMessage) {
            const dispatchersWithPlugin = dispatchers.filter((item) => {
              return this.dispatchers.originalData
                .get(item)
                .plugins.includes("ackMessages");
            });
            (this._communicator as Bridge).defaultTargets =
              dispatchersWithPlugin;
          }
        });
      }

      /**
       * Add our Plugin to the Status Message.
       * @returns We now enlist our Plugin.
       */
      protected _info(): INopeStatusInfo {
        const ret = super._info();
        ret.plugins.push("ackMessages");

        return ret;
      }
    }

    return [
      {
        adapted: Bridge,
        name: "Bridge",
        path: "communication.Bridge",
      },
      {
        adapted: NopeConnectivityManager,
        name: "NopeConnectivityManager",
        path: "dispatcher.connectivityManager.NopeConnectivityManager",
      },
    ];
  },
  "ackMessages"
);
