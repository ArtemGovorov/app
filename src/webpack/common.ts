// 🚀 Launch.js - common Webpack config

// ----------------------------------------------------------------------------
// IMPORTS

/* Node */
import * as path from "path";

/* NPM */
import { mergeWith } from "lodash";
import * as webpack from "webpack";

/* Launch.js */
import { IAppSerialized } from "../app";

// ----------------------------------------------------------------------------

// Types
export enum Target {
  Client,
  Server,
}

// RegExp for file types
export const regex = {
  fonts: /\.(woff|woff2|(o|t)tf|eot)$/i,
  images: /\.(jpe?g|png|gif|svg)$/i,
};

export function getRoot(file: string): string {
  return path.join(__dirname, "../../src", file);
}

export function getConfig(app: IAppSerialized, target: Target, config: Partial<webpack.Configuration>): webpack.Configuration {

  /* PRODUCTION */
  const prod: webpack.Configuration = {
    devtool: "source-map",
    mode: "production",
    module: {
      rules: [
        // Typescript
        {
          test: /\.(j|t)sx?$/i,
          use: [
            {
              loader: "babel-loader",
              options: {
                plugins: [
                  "syntax-dynamic-import",
                  "syntax-typescript",
                ],
              },
            },
            {
              loader: "ts-loader",
              options: {
                compilerOptions: {
                    module: "esnext",
                },
              },
            },
          ],
        },
        // Fonts
        {
          test: regex.fonts,
          use: [
            {
              loader: "file-loader",
              options: {
                emitFile: target === Target.Client,
                name: "assets/fonts/[name].[ext]",
              },
            },
          ],
        },

        // Images.  By default, we'll just use the file loader.  In production,
        // we'll also crunch the images first -- so let's set up `loaders` to
        // be an array to make extending this easier
        {
          test: regex.images,
          use: [
            {
              loader: "file-loader",
              options: {
                emitFile: target === Target.Client,
                name: "assets/img/[name].[ext]",
              },
            },
            {
              loader: "image-webpack-loader",
            },
          ],
        },
      ],
    },

    // File extensions that webpack will resolve
    plugins: [
      new webpack.DefinePlugin({
        "SERVER": target === Target.Server,
        "__ROOT_ENTRYPOINT": app.root,
        "process.env": {
          NODE_ENV: JSON.stringify(app.mode.toString()),
        },
      }),
      new webpack.NormalModuleReplacementPlugin(
        /^__ROOT_ENTRYPOINT$/,
        app.root,
      ),
    ],
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".css"],
    },
  };

  // Merge the configuration; combine arrays
  return mergeWith({}, prod, config, (objValue, srcValue) => {
    if (Array.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  });
}
