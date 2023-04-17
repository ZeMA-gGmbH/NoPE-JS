set DIR=%~dp0
cd "%DIR%"

if not "%1"=="am_admin" (powershell start -verb runas '%0' am_admin & exit /b)
ijsnotebook --notebook-dir=./
import * as nope from "nope";

