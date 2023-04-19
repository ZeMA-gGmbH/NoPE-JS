# `CLI` Tools

## Overview

`NoPE-JS` provides the following CLI Tools:

1. `help`: Show Valid options.
2. `conf`: Generates a new configuration file which will used in run.
3. `run`: Start a NoPE-Backend.
4. `project`: Helper to create a new Project or add new items to a project.
5. `scan-ui`: Scans and extracts the provided uis of the modules.
6. `upload-ui`: Uploads the determined ui-file
7. `service`: Generate Helper Files to provide windows/linux-services for your configuration. (autorun)      
8. `repl`: Opens an interactive console (REPL).
9. `interact`: Opens an interactive tool| to inspect the current environment.

## Details

### 1. ``conf``: Configuration Tool:

The Config Tool creates a configuration that contains the packages and services to be loaded. The file is saved as a JSON file and can be manipulated afterwards. 

The config file describes what a NoPE instance should execute inital and provide to other systems. To do this| the tool scans a folder and identifies all `*.package.js` files.  These are loaded by the tool and if present the NoPE packages are extracted.

#### parameters:

- `-h`: shows the help.
- `-d`: Folder which should be scaned for the `*.package.js` files.
- `-f`: The Output File. Defaults to `./config/config.json`
- `-i`: Switchtes the tool to an interactive mode| where the user is able to determine which items should be included in the config file. 

### 2. ``run``: Starter:

The `run` command will start an `NoPE` Runtime. This tool is used to spool up an entire environment, using the provided configuration (defaultly located at `./config/config.json`).

If you are using `io-sockets` as communication layer, please provide:
- a server (`nope-js run -c io-server`); it wont host anything. it will only act as server.
- Afterwards you are able to use multiple io-clients `io-client`

#### parameters:

| short parameter | long parameter | description | 
| --- | --- | --- |
| ``-h`` | `--help` | shows the help  |
| `-f FILE`| `--file FILE` |  File containing containing the package definitions. |
| `-c CHANNEL` | `--channel CHANNEL` | The Communication Channel, which should be used. Possible Values are: `"event"`, `"io-server"`, `"io-client"`, `"mqtt"`. Defaults to `"event"`. If you want to connect different Runtimes please use `"io-client"` or `"mqtt"` |
| `-p CHANNELPARAMS` | `--channelParams CHANNELPARAMS` | Paramas for the Channel, to connect to. The Following Defaults are used: `{ "amqp": "localhost", "io-server": 7000, "io-client": "http://localhost:7000", "mqtt": "mqtt://localhost:1883" }`. <br/><br/>If you want to enhance the default parameters please provide them as valid json-list. <br/><br/>Example: `nope-js run -c io-client -p ["http"://google.de:7000"]` |
| `-s` | `--skip-loading-config` | Flag to prevent loading the elements defined in the configuration. | 
|  | `--default-selector DEFAULTSELECTOR` | The default-strategy to select the service providers during callbacks (this will only be the case if there are multiple providers). Possible Values are: `"master"`, `"first"`, `"dispatcher"`, `"host"`, `"free-ram"`, `"cpu-usage"`. Defaultly the strategy `first` is used. | 
|  | `--force-selector`| Forces to use the Selector. Otherwise a smart approach is used| which only enables them if required.|
|  | `--id ID ` | Define a custom id to the Dispatcher, otherwise a generic id is generated. |
| `-l LOG` | `--log LOG` | Specify the Logger Level. Defaults to "info". Valid values are: `error`, `warn`, `info`, `debug`, `trace` |
|  | `--log-to-file` | Log will be stored in a logfile |
|  | `--dispatcher-log DISPATCHERLOGLEVEL`| Specify the Logger Level of the Dispatcher. Defaults to "info". Valid values are: `error`, `warn`, `info`, `debug`, `trace` |
|  | `--communication-log COMMUNICATIONLOGLEVEL`| Specify the Logger Level of the Communication. Defaults to "info". Valid values are: `error`, `warn`, `info`, `debug`, `trace` | 
|  | `--prevent-varified-names`| Enables Random names for variables etc. including number as start. No additional check is performed or so.
| `-d DELAY` | `--delay DELAY` | Adds an delay, which will be waited, after the system connected. Parmeter is provided in [s]. Defaults to ``2`` [s]
|  | `--profile` | Flag to enable Profiling (CPU Profiling. )|
|  | `--noBaseServices`| Flag to prevent using the base Services to be loaded |


### 3. ``project``: Dev-Helper-Tool:

Helper, that will be used, to create a project folder, containing a default project template for `NoPE-Projects` (`python` and `typescript`). The tool can be used to edit existing `NoPE-Projects` created using this tool.

