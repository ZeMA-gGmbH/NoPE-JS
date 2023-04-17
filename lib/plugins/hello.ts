import { plugin } from "./plugin";
import { NopeConnectivityManager as OrgConnectivityManager } from "../dispatcher/ConnectivityManager";
import { toConstructor } from "../types";

export const extend = plugin(
  [
    "dispatcher.connectivityManager.NopeConnectivityManager",
    "helpers.ids.generateId",
  ],
  (clConnectivityManager: toConstructor<OrgConnectivityManager>, orgGenId) => {
    class NopeConnectivityManager extends clConnectivityManager {
      public hello(name: string) {
        return `Hello ${name}!`;
      }
    }

    return [
      {
        adapted: NopeConnectivityManager,
        name: "NopeConnectivityManager",
        path: "dispatcher.connectivityManager.NopeConnectivityManager",
      },
      {
        adapted: (...args) => {
          const id = orgGenId(...args);
          return id;
        },
        name: "generateId",
        path: "helpers.ids.generateId",
      },
    ];
  },
  "hello"
);
