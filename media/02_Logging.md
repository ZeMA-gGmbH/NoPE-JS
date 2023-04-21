# Logging:
1. Lets create our logger:


```javascript
// First lets install nope using npm
const nope = require("../dist-nodejs/index.nodejs");

// Create our Observable:
const logger = nope.getNopeLogger("demo");
```

Now, that our logger has been created, we are able to log our first messages:


```javascript
logger.trace("hello from 'trace' level")
logger.debug("hello from 'debug' level")
logger.info ("hello from 'info' level")
logger.warn ("hello from 'warn' level")
logger.error("hello from 'error' level")
```

    2023-03-28T15:50:49.827Z - DEBUG - demo : hello from 'debug' level
    2023-03-28T15:50:49.827Z - INFO  - demo : hello from 'info' level
    2023-03-28T15:50:49.827Z - WARN  - demo : hello from 'warn' level
    2023-03-28T15:50:49.827Z - ERROR - demo : hello from 'error' level


To change the logging level use the property level:


```javascript
logger.setLevel(nope.WARN);
```


```javascript
logger.trace("hello from 'trace' level")
logger.debug("hello from 'debug' level")
logger.info ("hello from 'info' level")
logger.warn ("hello from 'warn' level")
logger.error("hello from 'error' level")
```

    2023-03-28T15:52:36.027Z - WARN  - demo : hello from 'warn' level
    2023-03-28T15:52:36.027Z - ERROR - demo : hello from 'error' level


As you can see you are able to change the log level.

