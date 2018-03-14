// 🚀 Launch.js - server bundling

// ----------------------------------------------------------------------------
// IMPORTS

/* NPM */
import * as webpack from "webpack";

// Plugin to allow us to exclude `node_modules` packages from the final
// bundle.  Since we'll be running `server.js` from Node, we'll have access
// to those modules locally and they don't need to wind up in the bundle file
import * as nodeModules from "webpack-node-externals";

/* Local */
import { IAppSerialized } from "../app";
import CurrentMode, { Mode } from "../mode";
import * as common from "./common";

// ----------------------------------------------------------------------------

// const AssetsPlugin = require("webpack-assets-manifest");

export default (app: IAppSerialized): webpack.Configuration => {

  // Base server config
  const base: webpack.Configuration = {
    // Set server entry
    entry: [common.getPath("entry/server.tsx")],

    // External modules that we avoid transpiling
    externals: nodeModules({
      whitelist: [
        common.regex.fonts,
        common.regex.images,
      ],
    }),

     // Modules
     module: {
      rules: [
        // CSS
        {
          exclude: /node_modules/,
          test: /\.css$/,
          use: [
            {
              loader: "css-loader/locals",
              options: {
                localIdentName: "[name]__[local]--[hash:base64:5]",
                modules: true,
              },
            },
          ],
        },
      ],
    },

    // Name
    name: "server",

    // Set output
    output: {
      filename: "server.js",
      libraryTarget: "commonjs2",
      path: app.dist,
    },

    // Plugins
    plugins: [
      // Only emit a single `server.js` chunk
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],

    // Target
    target: "node",
  };

  // Development config
  const dev: webpack.Configuration = {};

  // Production config
  const prod: webpack.Configuration = {};

  const config = common.getConfig(app, common.Target.Server, base,
    CurrentMode.fromString(app.mode) === Mode.Production ? prod : dev,
  );

  return config;
};
