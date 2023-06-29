sudo npm link
node contribute/toLinkBrowser.js
cp ./package.json ./build/package.json
cp -r ./dist-browser ./build/dist-browser
cd ./build
sudo npm link
cd ..
node contribute/toNodejs.js