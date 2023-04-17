export NODE_OPTIONS=--openssl-legacy-provider
npm run-script prettier-format
npm run-script compile-nodejs
npm run-script compile-browser
npm run-script build