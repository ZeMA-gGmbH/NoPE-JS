@echo off
set DIR=%~dp0
cd "%DIR%"
SETLOCAL
echo Compiling Backend

REM Add the Node Options for SSL these are requrired since Node v.17
set NODE_OPTIONS=--openssl-legacy-provider
$env:NODE_OPTIONS="--openssl-legacy-provider"


(npm run-script prettier-format) && (
    (npm run-script compile-nodejs) && (
        (npm run-script compile-browser) && (
            (npm run-script build) && (
                echo Done
            ) || (
                echo Error
            )
        ) || (
            (npm run-script build) && (
                echo Done
            ) || (
                echo Error
            )
        )
    ) || (
        (npm run-script compile-browser) && (
            (npm run-script build) && (
                echo Done
            ) || (
                echo Error
            )
        ) || (
            (npm run-script build) && (
                echo Done
            ) || (
                echo Error
            )
        )
    )
)  || (
    echo Failed to pettier code
)

