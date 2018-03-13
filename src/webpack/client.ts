// 🚀 Launch.js - client bundling

// ----------------------------------------------------------------------------
// IMPORTS

/* Node */
import * as path from "path";

/* NPM */
import * as ExtractCssPlugin from "extract-text-webpack-plugin";
import * as webpack from "webpack";

/* Local */
import App from "../app";
import * as common from "./common";

// ----------------------------------------------------------------------------

export default (app: App): webpack.Configuration => {
  const config = common.getConfig(app, common.Target.Client, {

    // Set client entry
    entry: [common.getRoot("entry/client")],

    // Modules
    module: {
      rules: [
        // CSS
        {
          test: /\.css$/,
          use: ExtractCssPlugin.extract({
            use: [
              {
                loader: "css-loader",
                options: {
                  localIdentName: "[name]__[local]--[hash:base64:5]",
                  modules: true,
                },
              },
            ],
          }),
        },
      ],
    },

    // Name
    name: "client",

    // Output
    output: {
      chunkFilename: "assets/js/[name].[chunkhash].js",
      filename: "assets/js/[name].[chunkhash].js",
      path: path.join(app.dist, "public"),
    },

    // Plugins
    plugins: [
      new ExtractCssPlugin({
        filename: "assets/css/[name].[contenthash].css",
      }),
    ],
  });

  return config;
};
