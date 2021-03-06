// 🚀 Launch.js - client bundling

// ----------------------------------------------------------------------------
// IMPORTS

/* Node */
import * as path from "path";

/* NPM */
import * as webpack from "webpack";

/* Local */
import { IAppSerialized } from "../app";
import CurrentMode, { Mode } from "../mode";
import * as common from "./common";

// ----------------------------------------------------------------------------

// Extract CSS into chunks
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

export default (app: IAppSerialized): webpack.Configuration => {

  // Base client config
  const base: webpack.Configuration = {

    // Set client entry
    entry: [common.getPath("entry/client.tsx")],

    // Name
    name: "client",

    // Set-up some common mocks/polyfills for features available in node, so
    // the browser doesn't balk when it sees this stuff
    node: {
      console: true,
      fs: "empty",
      net: "empty",
      tls: "empty",
    },

    // Output
    output: {
      path: path.join(app.dist, "public"),
    },

  };

  // Development client config
  const dev: webpack.Configuration = {};

  // Production client config
  const prod: webpack.Configuration = {
    // Modules
    module: {
      rules: [
        // CSS
        {
          test: /\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
            },
            {
              loader: "css-loader",
              options: {
                localIdentName: "[name]__[local]--[hash:base64:5]",
                modules: true,
              },
            },
          ],
        },
      ],
    },

    // Output
    output: {
      chunkFilename: "assets/js/[name].[chunkhash].js",
      filename: "assets/js/[name].[chunkhash].js",
    },

    // Plugins
    plugins: [
      new MiniCssExtractPlugin({
        chunkFilename: "assets/css/[id].css",
        filename: "assets/css/[name].css",
      }),
    ],
  };

  const config = common.getConfig(app, common.Target.Client, base,
    CurrentMode.fromString(app.mode) === Mode.Production ? prod : dev,
  );

  return config;
};
