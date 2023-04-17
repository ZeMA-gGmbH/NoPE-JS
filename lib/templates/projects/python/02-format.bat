set DIR=%~dp0
cd "%DIR%"

autopep8 --in-place -r --aggressive ./modules --ignore E402