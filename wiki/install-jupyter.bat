set DIR=%~dp0
cd "%DIR%"

if not "%1"=="am_admin" (powershell start -verb runas '%0' am_admin & exit /b)

@REM Link NPM-Folders
mkdir %PROGRAMDATA%\npm
setx PATH "%PROGRAMDATA%\npm;%PATH%" /M
npm config set prefix %PROGRAMDATA%\npm

%@Try%
  @REM Uninstall IO-Server
  pip3 install jupyter
  npm install -g ijavascript && (
    npm --registry https://npm.zema.de/ install -g nope && (
      %appdata%\npm\ijsinstall
    ) || (
      %appdata%\npm\ijsinstall
    )
  ) || (
    npm --registry https://npm.zema.de/ install -g nope && (
      %appdata%\npm\ijsinstall
    ) || (
      %appdata%\npm\ijsinstall
    )
    
  )
%@EndTry%
:@Catch
  echo uninstall IO-Server
:@EndCatch

