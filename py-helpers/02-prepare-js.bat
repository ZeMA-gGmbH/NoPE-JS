set DIR=%~dp0
cd "%DIR%"
cd ..

rm -rf temp
nope-py-prepare-code --input dist-py --output temp --type js