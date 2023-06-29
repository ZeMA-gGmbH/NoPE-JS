# 1.0.12

Inital commit, which is working with the browser

# 1.0.25
- Fixes:  
  - log-to-file: is now storing the last logs as well
  - nope-package-loader: is transmitting the correct parameters.
- Optimazations:
  - nope-package-loader: now storing elements with stringifyWithFunctions and is capable to read functions.
  - pub-sub-system: Adding partial changes of the topic structure. This speeds up the entire system.

# 1.0.26
- Fixes: 
  - pub-sub-system: Fixed `_notify` and `_updatePartialMatching`  
- Added:
  - pub-sub-system: Listeners receive now: topicOfContent (the path of the data that is extracted), topicOfChange (the path of the data that emitted teh update), topicOfSubscription (the subscription.),
  - nope repl: Added the context `nope`

# 1.0.27
- Fixes:   
  - helpers.jsonSchemaMethods: -> renamed flatten to nested.
- Added:
  - helpers.descriptors: -> parseFunctionToJsonSchema
  - helpers.jsonSchemaMethods: -> added `flattenSchema` and `reduceSchema`. This Function will create a nested JSON-Schema. 

# 1.0.28
- Fixes:   
  - communication.layer.events: -> fixing receivingOwnMessages.
  - runNopeBackend -> if io-server is used, no configuration file is loaded

# 1.0.29
- Added:
  - helpers.limit: limitedCalls -> Functinality to limit parallel calls.

# 1.0.30
- Added:
  - helpers.limit: getLimitedOptions -> Helper to get the correspondings options
  - helpers.limit.spec: Adding test cases

# 1.0.31
- Modified:
  - helpers.singleton: Prevent using symbols, to make global version work with local version.

# 1.0.32
- Fixes:
  - helpers.singleton: work with `Symbol.for` --> Can be used in different systems now.
  - symbols.symbols: work with `Symbol.for` --> Can be used in different systems now.

# 1.0.33
- Modified:
  - cli.runNopeBackend: added the flag "noBaseServices" to prevent providing the base-services
  - communication.getLayer.nodejs\browser: adding default value for logger
  - dispatcher.getDispatcher: changed option "constructorClass" to "dispatcherConstructorClass"
  - helpers.limit.spec: Adapted Timings
  - loader.getPackageLoader.nodejs\browser: Changed the options.

# 1.0.34
- Fixes:
  - dispatchers.ConnectivityManager.ConnectivityManager: fixing isMaster- Fixed
- Modified:
  - types.nope.ConnectivityManager.interface: 
    - INopeStatusInfo.upTime =renamed=> connectedSince
    - INopeConnectivityManager added => "upTime" and "connectedSince"
  - dispatchers.ConnectivityManager.ConnectivityManager:
    - INopeConnectivityManager added "connectedSince" (which is expressed in the adapted Timestamp.)
- Added:
  - dispatchers.ConnectivityManager.ConnectivityManager.spec: Added Master - Test

# 1.0.35
- Fixes:
  - dispatchers.ConnectivityManager.ConnectivityManager: fixing isMaster. Now deals corecctly with multiple masters.
- Modified:
  - cli.runNopeBackend: prevented io-server to be a master.
  - dispatcher.getDispatcher: Adapted input to `options`. This includes all options
  - dispatcher.core.NopeCore: Add flag Displising. This shows, if the dispatcher is getting disposed
  - loader.getPackageLoader.browser: Adapted input to `options`. This includes all options
  - loader.getPackageLoader.nodejs: Adapted input to `options`. This includes all options
  - types.nope.ConnectivityManager.interface: 
    - INopeStatusInfo.isMasterForced: Flag if the master mode is forced
    - INopeStatusInfo.isMaster: Flag if the node is a master. this could be forced or selected
  - types.nope.nopeCore.interface: 
    - INopeCore.disposing: A Flag, that indicates, that the core is disposing.
  - types.nope.nopeDispatcher.interface: 
    - INopeDispatcherOptions: Utilizes `INopeINopeConnectivityOptions` now.   
  - dispatchers.ConnectivityManager.ConnectivityManager.spec:
    - Added test for forced masters.
  - helpers.arrayMethods: Added Typings for `minOfArray`

# 1.0.36
- Fixes:
  - Small fixes in the imports of some items in `module.BaseModule.injectable`; `module.GenericWrapper.injectable`; `helpers.descriptors` to make shure, the `nope.d.ts` for the browser is compiled.

# 1.1.0
- Added: 
  - Added gui defintion files in `types.ui` containing:
    - rendering callback options
    - base layout based helpers,
    - provided libraries
  - Added dev-depencies for libraries.
  - added `ui.loader` a backend component to readin the ui.

# 1.1.1
- Added: 
  - Added `internalInstances: INopeObservable<string[]>` to `InstanceManager`.:
  - Added dev-depencies for libraries.
- Modified:
  - Modified `addAllBaseServices` now includes some options, which can be used to determine the specific service to load.

# 1.2.0
- Added:
  - `lib\cli\nope` adding scan for ui service
  - `lib\decorators\container`: Main Container, holding all `methods` and `classes`. Use `getCentralDecoratedContainer()` to get this decorator.
  - `types\nope\nopePackage.interface` added `IClassDescription` which contains the class description used in the Package Description.
  - `logger\nopeLogger`: added methods: `enabledFor`, `enableFor`, `shouldLog`
  - `package.json`: installed types of `ace` text editor.
  - `ui\helpers.browser`: Created `convertInstanceRenderPage` and `IUiDefinition`
  - `ui\helpers.nodejs`: Added a Helper to write the Ui-File (`writeUiFile`) and parse its arguments (`readInwriteUiFileArgs`)
  - `ui\index.*`: Crated the corresponding exports.
- Modified:
  - `lib\decorators\*` Adding the main `container` where every function, service method etc is added. All decorators now safe the decorated elements in the container.
  - `helpers\json`: Adding `BEGIN_STR` and `END_STR` for parsing functions as constants.
  - `logger\eventLogging`: simplify `useEventLogger`
  - `logger\index.browser`: Adating exports.
  - `loader\loadPackages`: Modifing `IPackageConfig` now extends Partial the `IPackageDescription`
  - `types\ui\editor\IEditPage`: adapting Type of `getData` to `T`->`any`. Adapting the return of `getPorts` (The Ports will be generated in the ui then)
  - `types\ui\editor\helpers.interface`: Adapting the `w2ui` and added `w2uiHelpers` and added `ace`. Rearanging `IRenderData` element. to compact the data.
  - `types\ui\editor\render.callbacks`: Rearange the Generic Type of `TRenderInstancePage` and Renaming `TCreatorPage` to `TInstanceManagerPage`. Adapting the `option` of `TInstanceManagerPage` regarding the `createInstance` and `instances`
  - `types\ui\editor\index`: Adapting the Exports.
  - `lib\index.browser`: Exporting `ui` elements
  - `lib\index.nodejs`: Exporting `ui` elements
  - `lib\types\index`: Exporting `ui` elements
- Fixes:
  - `types\nope\nopeInstanceManager.interface`: Fixing Type of createInstance. Now the Type `I` extends `INopeModule` instead of being set to `IGenericNopeModule`

# 1.2.1
- Added:
  - `types\ui\helpers.interface`: Added the ui section in `IRenderData`. This contains the following props: `fullscreen` (INopeObservable<boolean>) to controll the fullscreen \ ge the state. Additionally the functions `openFullscreen`, `closeFullScreen` and `getTheme` have been added. Added type `IUiTheme`
- Modified:
  - Renamed `IEditPage` to `IServiceEditPage`
  - Renamed `NODE_TYPE_COMPOSED` to `NODE_TYPE_GROUP`
  - Adapted `TRenderConfigureServicePage`, `TRenderInstancePage` and `TInstanceManagerPage` by adding `Extension`-Type 
  - Adapted `TRenderFunction` removing the args setting.

# 1.2.2
- Modified:
  - renaming the following constants in  `lib\types\ui\editor\INodes`:
    - NODE_TYPE_CONSTANT = "node:data:constant";
    - NODE_TYPE_DATA_TO_TOKEN = "node:logic:data-to-token";
    - NODE_TYPE_FLOW_OPERATION = "node:logic:flow";
    - NODE_TYPE_PLACE = "node:logic:place";
    - NODE_TYPE_TOKEN_TO_DATA = "node:logic:token-to-data";
    - NODE_TYPE_TRANSITION = "node:logic:transition";
    - NODE_TYPE_VAR = "node:data:constant";
    - NODE_TYPE_MODULE = "node:module";
  - updating `TServiceGetPortsReturn` (adding `label` and removing `type`)and `IServiceEditPage` (remove `getPorts`) in  `lib\types\ui\editor\IServiceEditPage`
  - relocating `IUiDefinition` to `lib\types\ui\helpers.interface`
    - influences `lib\ui\helpers.browser` and `lib\ui\helpers.nodejs`
  
# 1.3.0
  - Fixes: 
    - Small Syntax-Fixes for better parsing.
  - Added:
    -`py-helpers`: Added a Parser, which will create a Tree and then will be used to transpile the coresponding ast.

# 1.3.1
  - Fixes: 
    - `py-helpers`: Now using correct elements.
  - Small comments etc.

# 1.3.2
  - Fixes: 
    - `helpers\objectMethods`: The function `convertData` no converts not matching items as well
    - `helpers\objectMethods`: The function `tranformMap` no works with empty pathes like `""`

# 1.3.3
  - Fixes: 
    - `dispatcher\instanceManager\InstanceManager`: Fixing the Mapbased item
    - `dispatcher\RpcManager\RpcManager`: Fixing the Mapbased item

# 1.3.4
  - reverting 1.3.3
  - Fixes: 
    - `dispatcher\instanceManager\InstanceManager`: Fixing the Mapbased item
    - `dispatcher\RpcManager\RpcManager`: Fixing the Mapbased item
    - `helpers\mapMethods*`: Fixing `extractUniqueValues` and some tests. If you want to extract the data of an array please use `+`
    - `helpers\mergeData*`: Fixing the Mapbased item
    - `helpers\objectMethods*`: Fixing `convertData` function

# 1.3.5
  - reverting 1.3.3
  - Added: 
    - `helpers\stringMethods`: Added the function `varifyString`
  - Modified:
    - `dispatcher\instanceManager\InstanceManager`: Adapting the name of the instance to use a valid instance name. 
    - `dispatcher\rpcManager\rpcManager`: Adapting the name of the service to use a valid service name. 
    - `cli\runNopeBackend`: Adapting the name of the service to use a valid service name. 

# 1.3.6
  - Added: 
    - `cli\runNopeBackend`: Added the a helper to add varify the `name`. (see modifications in `dispatcher\InstanceManager\InstanceManager`, `dispatcher\RpcManager\NopeRpcManager`)
  - Modified:
    - `helpers\stringMethods`: added function `union` and `difference`.
    - `helpers\setMethods`: added function `varifyString`.
    - `types\nope\nopeDispatcher.interface`: Added option `forceUsingValidVarNames`
  - Fixes:
    - `types\nope\nopeInstanceManager.interface`: Fixed the typing of `getInstancesOfType` and `createInstance`
  
# 1.3.7
  - Fixes:
    - `helpers\mapMethods`: Fixing `tranformMap`. Now correctly assigning `onlyValidProps`

# 1.3.8
  - Modified:
    - `helpers\limit`: Now providing an logger level in the options, results in creating a logger and logging the desired messages in the provided level.

# 1.3.9
  - Fixing:
    - `helpers\limit`: Now enrows all functions provided.

# 1.3.10
  - Modified:
    - `helpers\limit`: Adding parameter `assignControlFunction` to assing the controll function.
    - `helpers\index`: modified the export of the `limit` stuff.
  - Added:
    - `helpers\functionMethods*`: Added helpers for functions

# 1.3.11
  - Modified:
    - `helpers\functionMethods`: Adding `asnyc` detection

# 1.3.12
  - Modified:
    - `helpers\limit`: added the option `minDelay`. If provided, the calles are ensured to be delayed with this options. If `0` or smaller -> no delay is added.

# 1.3.13
  - Fixes:
    - `cli\runNopeBackend`: Fixing parameter `preventVarifiedNames` no works correctly.
  
# 1.3.14
  - Fixes:
    - `helpers\ui\helpers.nodejs`: Adding the option `upload-ui`
    - `helpers\ui\helpers.nodejs`: Adding the option `upload-ui`

# 1.4.0
  - Modified:
    - asyncified all ui-related services.
    - Adapted ui-defintion of functions:
      - `autoGenBySchema` Helper to enable auto generating a configuration 
      - `requiresProviderForRendering` Flag to indicate, that rendering the service configuration requires a provider itself. This for instance is the case, if some needs to be called.
    - `types\ui\editor\IServiceEditPage.ts`: Asnycify the Calls
    - `types\ui\editor\render.callbacks.ts`: Asnycify the Calls

# 1.4.1
  - Modified:
    - loading all files related to `*.functions.js`
      - Adapted the following files to implement that behavior:
        - `getCentralDecoratedContainer` in `lib\decorators\container.ts` -> now provides services as Map
        - `exportFunctionAsNopeService` in `lib\decorators\functionDecorators.ts` to work with the map.
        - `loadFunctions` in `lib\loader\loadPackages.ts` to match the interface of `loadPackages` and add the functions to the package-loader.
        - added the function `addDecoratedElements` in the package-loader and the interface.
        
# 1.4.2
  - Fixes:
    - Fixing time based issue in `ConnectivityManager` (using the now synced time for checkups)
      - `dispatchers.ConnectivityManager.ConnectivityManager`: fixing `_checkDispatcherHealth`
    - Fixing `extractUniqueValues` now it is possible to use different pathes for the `key` and `value`
      - `lib\helpers\mapMethods.ts` has been adapted
    - `lib\pubSub\nopePubSubSystem.ts` contains the following fixes:
      - fixing typo of method `updateMatching`
  - Modified:
    - `lib\pubSub\nopePubSubSystem.ts`: 
      - throws error if `register` method doest not contain a topic.
      - Adapted the behavior of `_patternbasedPullData`. If no default default value is present -> the function returns an empty array.

# 1.4.3
  - Fixes:
    - Fixing time based issue in `ConnectivityManager` (using the now synced time for checkups)
      - `dispatchers.ConnectivityManager.ConnectivityManager`: fixing `_checkDispatcherHealth`
    - Fixing `extractUniqueValues` now it is possible to use different pathes for the `key` and `value`
      - `lib\helpers\mapMethods.ts` has been adapted
    - `lib\pubSub\nopePubSubSystem.ts` contains the following fixes:
      - fixing typo of method `updateMatching`
  - Modified:
    - Adapted the event-names of the communication. Now starts with lower chars.
    - Code clean ups:
      - removed `_communcatorCallback` from `dispatcher\RpcManager\NopeRpcManager.ts`
      - renamed `quite` to `quiet`
    - adapted internal methods of `NopeRpcManager`:
      - added: `_cancelHelper`
      - > Now the `target`in the Request segement is provided every time! 
      - renamed `_partialMatchingUpdate` to `_updatePartialMatching`
    - adapted `NopePubSub`:
      - renamed parameter `mqttBasedPatternSubscriptions` to `mqttPatternBasedSubscriptions`
    - `helpers\path` -> in `_getLeastCommonPathSegment` we only iterate over the avaible keys.

# 1.4.4
  - Modified:
    - Renamed the decorator `exportFunctionAsNopeService` -> `exportAsNopeService` and the Interface `IexportFunctionAsNopeServiceParameters` -> `IexportAsNopeServiceParameters`
    - `NopeInstanceManager` and `GenericWrapper`: Now receives a factory to generate the a `NopeEventEmitter`:
      - This affects a lot packages.
    - `NopeModule`: 
      - renamed `listFunctions` to `listMethods`
      - renamed `functions` is now called `methods`
      - The Description format is being updated (`functions` is now called `methods`)
  - Fixes:
    - `NopeModule`: 
      - Now disposes Emitters as Properties as well
      - `getIdentifierOf` checks event emitters as well now.
    - `GenericWrapper`: 
      - Now automatically registers emitters as well.
  - Added:
    -  `NopeModule`: Added the method `listEvents` (to show the available Emitters registered as Properties.)

# 1.4.5
  - Modified:
    - `lib\dispatcher\ConnectivityManager\ConnectivityManager.ts`: 
      - Status is only send if required (if no other item)
      - Dispatcher Health is only checked if required.
    - `lib\dispatcher\InstanceManager\InstanceManager.ts`: 
      - Made: `getServiceName` public
    - `lib\dispatcher\RpcManager\NopeRpcManager.ts`:
      - The following functions are now async:
        - `_sendAvailableServices` -> it is awaited in some functions now (hasnt before)
      - `unregisterService` -> now returns a boolean for sucess 
  - Added:
    -  `lib\demo\instances`: Added demo elements. (Instances.)

# 1.4.6
  - Fixes:
    - `lib\dispatcher\ConnectivityManager\ConnectivityManager.ts`: 
      - Fixing Master Assignment.
      - Only sending one Status on init.
    - `lib\dispatcher\InstanceManager\InstanceManager.ts`: 
      - Fixing pathes of `constructors` variable. Now `amountOf` etc is working
      - Fixing pathes of `constructorExists`. Now working with Type-Name.
      - Only sending one Status on init.
    - `lib\helpers\mapMethods.ts`:
      - Fixing `tranformMap` in the case of only a `pathExtractedValue` or `pathExtractedKey` is given.
    - `lib\helpers\objectMethods.ts`:
      - fixing `rgetattr` -> Now correctly returns "null" in all cases. 
    - `lib\demo`:
      - Fixing imports of demo instances. 
  - Modified:
    -  `lib\types`:
      - renamed `IFunctionOptions` to `IServiceOptions`
    - `lib\types\nope\nopeModule.interface.ts`:
      - `listMethods` now returns a different array, where the attribute is named `method` instead of `func` -> Adaptions affect `BaseModule` and `GenericModule`
  - Added:
    - Added Tests for the Properties of NopeRpcManager, NopeConnectivityManager
    - `lib\helpers`:
      - `PriorityList`: -> List, which sorts the items based on a given priority.
      - `LimitedList`: -> Ring-Like list. If the max amount of items is reached, the oldest one will be removed
      - `ParallelPriorityTaskQueue` -> A Task-Queue (Parallel and if desired with priority)
      - `generateHash` -> A function to generate a hash

# 1.5.0
  - Modified:
    -  `lib\logger`:
      - Adding colors to log.
    - `lib\eventEmitter`:
      - Adding the possibility of a timeout in `waitFor`
  - Added:
    - `lib\plugins`:
      - Added a full fetch plugin-system for javascript. That allows the user to customize different aspects of the lib. For an plugin see: `lib\plugins\ackMessages.ts` as an example.

# 1.5.1
  - Fixes:
    -  `lib\dispatcher\NopeRpcManager`:
      - fixing `unregisterService`. Now emitts the Message correctly.
  - Added:
    - `lib\plugins`:
      - Added a new plugin to use callbacks in side of services: `lib\plugins\rpcWithCallbacks.ts`

# 1.5.2
  - Fixes:
    -  help in cli tools.
    - `lib\types\ui`: 
      - specified and fixed `INetwork`, nodes and edges.

# 1.5.3
  - Added:
    - `lib\types\ui\layout.interface.ts`:
      - `IPanelInstance` added: 
        - Function to lock the panel: `lock(message?: string, showSpinner?: boolean): void`,
        - Function to unlock the panel: unlock(): void`;
  - Modified:
    - `lib\types\ui`:
      - Added extra items for the services and toolbar etc.
  - Fixing: `helpers\dispatcherPathes`: Now properties are handeled correctly.

# 1.5.4
  - Added:
    - Added helpers to simplify the `UI-Editors` for configuration and creation:
      - `lib\types\nope\nopeModule.interface.ts`:
        - Added `serviceConfigurationSchema` hich holds the `schema` an a function to `order` the args.
      - `lib\types\nope\nopePackage.interface.ts` added: 
        - Added `creatorSchema` which holds the `schema` an a function to `order` the args.
  - Modified:
    - `lib\types\ui\editor\INodes.ts`:
      - Added `color`-attribute
    - `lib\types\ui\layout.interface.ts`:
      - Added function `closeDynamicW2UiPanel` to close the corresponding panel.
    - `lib\types\ui\render.callbacks.ts`:
      - Added: `TInstanceManagerPageResult` as result for the `TRenderInstancePage` functions.
  - Fixing: 
    - `lib\types\ui\index.ts`: Adapting exports.
    - `lib\ui\helpers.nodejs.ts`: Fixing the helper to `scan` ui


# 1.6.0
  - Added:
    - `lib\templates\..`: Template file for projects, services and modules.
    - `lib\helpers\cli`: A helper to simplify interactive tools.
  - Modified:
    - `lib\cli\nope`: Adding `interact` again, removed `init` and added new `project` tool.
    - `lib\dispatcher\InstanceManager`: Added `constructorServices` to show the used services.
  - Fixing:
    - `lib\dispatcher\ConnectivityManager`: Ensuring saying hello

# 1.6.1
  - Fixing:
    - `lib/plugins/ackMessages.spec.ts`: Fixing Tests.
    - `lib/plugins/plugin.spec.ts`: Fixing Tests.    
    - `lib/plugins/plugin.ts`: Adding comments and fixing issue with modules, that doesn't export items.
    - `lib/plugins/rpcWithCallbacks.spec.ts`: Fixing Tests.
  - Changed:
    - `lib/helpers/index.browser.ts`: Exported `dispatcherPathes`
  - Added:
    - `lib/types/nope/nopeModule.interface.ts`: Changed `autoGenBySchema` and added `icon` element to change the icon in the ui.
    - `lib/templates/projects/typescript/README.md.handlebars`: Adding Hint for docu.
    - `lib/types/nope/nopePackage.interface.ts`: added `icon` element to change the icon in the ui.
    - `lib/types/ui/editor/INodes.ts`: added `PORT_FUNCTION` element, to define functions as element.
    - `lib/types/ui/editor/IServiceEditPage.ts`: `TServiceGetPortsReturn` can now decide which type of token must be present.
    - `lib/types/ui/helpers.interface.ts`: `IUiDefinition` now contains the `schema` for functions.
    - `lib/ui/helpers.nodejs.ts`: Now stores the `schema` for functions.
  
# 1.6.2
  - Adding:
    - `lib/helpers/stringMethods.ts`: Added function `capitalizeFirstLetter`
  - Modified:
    - `lib/types/nope/nopeModule.interface.ts`: `IServiceOptions` has now the option `package` to list a service in a specific package.

# 1.6.3 
  - Adding new ports nodes etc. in `lib\types\ui\editor\INodes.ts`
  - Changing ports

# 1.6.4
  - Fixing: 
    - `nope-js interact` is now linked,
    - `lib/helpers/cli.ts` renamed `IMenu` to `ICliMenu` to prevent naming issues.
  - Adding:
    - `nope-js conf -i`: Added the interact method, to configure the configuration.

# 1.6.5
  - Fixing:
    - `lib\dispatcher\InstanceManager\InstanceManager.ts` fixing method `getInstanceDescription`. Now checks although instances of other items.
    - `lib\cli\interact.ts`: fixing calling instances methods.

# 1.6.6
  - Adding:
    - Adding `NODE_TYPE_START` a type for the start node.

# 1.6.7
  - Fixing:
    - Fixing disposing instances, which arent used anymore.
      - `lib\dispatcher\InstanceManager\InstanceManager.ts`: Adapting the `dispose` method
    - Fixing using hash on creating an instance (`lib\dispatcher\InstanceManager\InstanceManager.ts`)
    - Removing unfinished instances from the blocked element (`lib\dispatcher\InstanceManager\InstanceManager.ts`)
  - Adding:
    - Added the new functions to the `IBasicLayoutComponent` in `lib\types\ui\layout.interface.ts`
      - `openFullscreen(): void` --> Helper to open the fullscreen of the Layout.
      - `closeFullscreen(): void`--> Helper to close the fullscreen of the Lay

# 1.6.8
  - Adding:
    - Adding node type `wait-for`
    - Adding `toDescription` method for:
      - `ICommunicationBridge`
      - `INopeConnectivityManager`
      - `INopeCore`
      - `INopeInstanceManager`
      - `INopeRpcManager`
    - Adding helpers for the Garbage Collection
      - Now the function `registerGarbageCallback` registers callback for specific elements, that should execute a callback on garbage collection. -> We registered every nope-core element (`ICommunicationBridge`, `INopeConnectivityManager`, `INopeCore`, `INopeInstanceManager` and `INopeRpcManager`) as well as for Modules
  - Modifying:
    - `lib/dispatcher/nopeDispatcher.ts` : Removing the `toDescription`
    - `lib/types/ui/layout.interface.ts`: The `IBasicLayoutComponent.toggleEdit` now contains an optional flag (mode):
      - if set to `true` the edit-mode is enabled.
    - defaultly provide the autogen ui.
    - now defaultly uses the base-services (see `lib/cli/runNopeBackend.ts`)
    - added logs for the base services.
  - Fixing:
    - `lib/helpers/objectMethods.ts`: Fixed `recursiveForEach`
    - `lib/cli/interact.ts`: Now enables to select the data pathes.
    - `lib/dispatcher/baseServices/connectivy.ts`: Fixing `pingAll` Service.
    - `lib/dispatcher/baseServices/index.ts`: Fixing `addAllBaseServices` Service.

# 1.7.0
  - Modifying:
    - removing `getLinkedDispatcher` this functionality is now added in the default `getDispatcher` method.
    - Changing the templates for the public release. 
    - RPC - Manager raises an Error if a service already has been added.
  - Fixes:
    - fixing `nope-js interact`. calling service works correct.
      - adding base services
    - fixing templates of `nope-js project`
  - Adding:
    - RpcManager now has the function:  `isProviding` to test, whether a service has been provided by that RpcManager

# 1.7.1
  - Modifying:
    - `NopeRpcManager`: 
      - listens on `bonjour`-messages
      - `registerService` is now async! (see `INopeInstanceManager` as well)
    - `NopeInstanceManager`:    
      - listens on `bonjour`-messages
    - `getDispatcher`:
      - The method uses a logger now. It will render the errors.
  - Fixes:
    - `NopeInstanceManager`:
      - fixing `instanceExists`      
      - `registerInstance` now emits the instances
    - `PubSubSystemBase`:
      - fixed the internal matching structure
      - fixed `updateMatching`
      - fided `_notify`: The `dataQuery` only considers the events that have been published during notification!
    - `templates`:
      - Fixing Typescript-Templates (still had some old 'nope' references)
    - fixed tpyos in `00-start.md`
  - Adding:
    - `NopeInstanceManager` and `INopeInstanceManager`:
      - Added method `generateWrapper`. That allows to create Wrappers for **static** added instances (via. `registerInstance`)
    - `helpers.comparePatternAndPath`: 
      - Fixing issues during path comparing!
    - Tutorials for 
      - dataDistributor
      - rpcManager
      - InstanceManagers
      - Plugins
      - eventDistributor
    
# 1.7.3:
  - Adding: 
    - cli tool now can use ``version`` to print the version.
# 1.7.4:
  - Modifying: 
    - cli tool use ``version`` based on the Package file.
    - template engine provides the nope version based on the package.json file
  - Fixing:
    - Fixing typescript templates.
    
# 1.7.5:
  - Modifying: 
    - Enabling lazy topics matching in Pub-Sub-System again

# 1.7.6:
  - Adding:
    - Adding the `IO-Host` Layer. This layer works like a `io-server` but doesnt forward the messages to the clients. This can be used to provide a specific service or module for multiple instances that should not be connected.
    - Added the `config` and `connections` properties in the `settings.json`. This information will be used as base config during the `nope-js run` if you provide additional attirbutes (see `nope-js run -h`) this settings will be used. 
  - Modifying:
    - Implementing a Speedhack in the `RpcManager` during Perform call.
    - Adding the Feature to skip heartbeats if the system is in debugging.
  - Fixing:
    - Fixing interaction tool. 