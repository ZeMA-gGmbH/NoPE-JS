const path = require("path");
const DtsBundleWebpack = require("dts-bundle-webpack");

module.exports = {
    mode: "production",
    entry: path.resolve(__dirname, "dist-browser", "index.browser.js"),
    devtool: "inline-source-map",
    output: {
        path: path.resolve(__dirname, "build"),
        filename: "nope.js",
        library: "nope-browser",
        libraryTarget: "commonjs2",
    },
    // resolve: {
    //   fallback: { "os": require.resolve("os-browserify/browser") }
    // },
    plugins: [
        new DtsBundleWebpack({
            name: "nope-browser",
            main: path.resolve(__dirname, "dist-browser", "index.browser.d.ts"),
            baseDir: path.resolve(__dirname),
            out: path.resolve(__dirname, "build", "nope.d.ts"),
            // baseDir: path.resolve(__dirname, "dist"),
            // externals: true,
        })
      ]
};