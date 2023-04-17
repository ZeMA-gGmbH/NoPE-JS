
set DIR=%~dp0
cd "%DIR%"

if not "%1"=="am_admin" (powershell start -verb runas '%0' am_admin & exit /b)

(npm link) && (
  node contribute/toLinkBrowser.js

  copy .\\package.json .\\build\\package.json
  copy -r .\dist-browser\ .\build\dist-browser

  cd ./build

  (npm link) && (
    cd "%DIR%"
    node contribute/toNodejs.js
  ) || (
    cd "%DIR%"
    node contribute/toNodejs.js
  )
) || (
  node contribute/toLinkBrowser.js

  copy ./package.json ./build/package.json
  copy -r .\dist-browser\ .\build\dist-browser

  cd ./build

  (npm link) && (
    cd "%DIR%"
    node contribute/toNodejs.js
  ) || (
    cd "%DIR%"
    node contribute/toNodejs.js
  )
)

pause