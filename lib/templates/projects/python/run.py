from nope.cli.run import generateNopeBackend, getDefaultParameters
from nope.helpers import EXECUTOR

parameters =  getDefaultParameters();

EXECUTOR.callParallel(
    generateNopeBackend,
    {
        "channel": "io-client", 
        "file": "./config/settings.json", 
        "delay": 4
    },
    True
)

EXECUTOR.run()