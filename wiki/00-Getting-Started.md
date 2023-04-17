# Getting started

---

## Installation:

### Using `npm`

Use the following code: `npm install nope-js`

### Use this Libary locally:

1. Clone the repo: `git clone https://github.com/ZeMA-gGmbH/NoPE-JS.git`
2. Install the depencies by typing `npm install`
3. Go to your desired folder and create a local link `npm link`

---

## Documentation

The Documentation is contained in here. Alternative you can create a Documentation using `npm run-script doc`. This will create the Documentation under `docs`.

You'll additional help under `wiki`.

The `wiki` is mostly running as `Markdown` or `Jupyter`-Notebook.

### Run the wiki

1. Install the documents via: `00-install-jupyter.bat`
   1. Install the `jupyter` with `pip3 install jupyter`
   2. Install a Javascript interpreter for `jupyter` with `npm install -g ijavascript`. Afterwards install the extension `%appdata%\npm\ijsinstall`
2. Run the `01-start-jupyter.bat`

---

## Contribute

To contribute to the Project, please perform the following steps:

0. Perform the Steps in `PREPARE_VSCODE.md`
1. Assign a new Version under `contribute/VERSION`
2. Fillout the Change Log in the `CHANGELOG.md`
3. Implement Your Changes and **Test-Cases**:

   1. For Testing the Library [`mocha`](https://mochajs.org/) is used (click [here](https://mochajs.org/) for more details).
   2. name your tests `*.spec.ts`
   3. run the tests with `npm test`

4. If the Test are successfully proceed, otherwise perform your Bugfixes
5. Run the Code-Formater: `npm run-script prettier-format`
6. Push the Code to the Git

---

### Commiting Changes

For simpler usage, you can use the following helpers:

- `00-compile.bat`, which will compile the library for the browser and nodejs
- `10-push-to-npm.bat`, which will push the library to the npm registry.

#### Browser

1. Compile the code: `npm run-script compile-browser`
2. Build the Library; `npm run-script build`
3. Switch the Package Defintion to `browser` by `node ./contribute/toBrowser.js`
4. Publish the Code to `npm` using `npm publish`

#### Nodejs

1. Compile the code: `npm run-script compile-nodejs`
2. Switch the Package Defintion to `nodejs` by `node ./contribute/toNodejs.js`
3. Publish the Code to `npm` using `npm publish`
