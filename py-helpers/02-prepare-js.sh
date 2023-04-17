#!/usr/bin/env bash

echo "The script you are running has basename $( basename -- "$0"; ), dirname $( dirname -- "$0"; )";
echo "The present working directory is $( pwd; )";

cd "$( dirname -- "$0"; )"
cd ..

rm -rf temp
nope-py-prepare-code --input dist-py --output temp --type js