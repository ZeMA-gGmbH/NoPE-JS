const nope = require("../dist-nodejs/index.nodejs")

function now() {
    const _hr = process.hrtime();
    return _hr[0] * 1000 + _hr[1] / 1000 / 1000;
}

function generateBenchmarkFunction(displayRateAfterNCalls, textToDisplay, storeTo = false) {
    let _counter = 0;
    let _startTime = now();
    const max = displayRateAfterNCalls;
    const _logger = nope.getNopeLogger("algorithmen.benchmark");
    return () => {
        if (_counter === 1) {
            _startTime = now();
        }
        else if (_counter === max) {
            const _endTime = now();
            const _timeDifference = _endTime - _startTime;
            const _qps = max / (_timeDifference / 1000);
            // Show the QPS:
            _logger.info(textToDisplay +
                " QPS: " +
                (Math.round(_qps * 100) / 100).toString() +
                " [Calls/Sec]");
            // Reset the Counter
            _counter = 0;

            if (storeTo){
                global[storeTo] = _qps
            }
        }
        _counter++;
    };
}

const amount = 10_000_000;

const benchmark = generateBenchmarkFunction(amount, "Default Callbacks", "default")

let i = 0;
while (i<amount+1){
    benchmark();
    i++;
}

async function nopeBenchmark(){
    // Get a Dispatcher;
    const dispatcher = (
        await nope.runNopeBackend({skipLoadingConfig: true})
    ).dispatcher;

    await dispatcher.ready.waitFor();

    const amount = 10_000_000;

    const benchmark = generateBenchmarkFunction(amount, "NoPE Benchmark", "nope");

    await dispatcher.rpcManager.registerService(benchmark, { id: "benchmark", schema: {}});

    let i = 0;
    while (i<amount+1){
        await dispatcher.rpcManager.methodInterface.benchmark();
        i++;
    }

    await dispatcher.dispose();
    await 1;

    console.log("Rate", Math.round(global["nope"] / global["default"] * 10_000) / 100, "[%]");    
    console.log("Rate", Math.round(global["default"] / global["nope"] * 100) / 100, " slower then memory");
}

nopeBenchmark().then( _ => {}).catch(console.error)