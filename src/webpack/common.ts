// 🚀 Launch.js - common Webpack config

// ----------------------------------------------------------------------------
// IMPORTS

/* Node */
import * as fs from "fs";
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

// Memoize the Launch.js module root
const packageRoot = (
  function walk(folder: string): string {
    if (fs.readdirSync(folder).includes("package.json")) {
      return folder;
    }
    return walk(path.resolve(folder, ".."));
  }
)(__dirname);

// Helper function to locate source files
export function getPath(file: string): string {
  return path.join(packageRoot, "src", file);
}

export function getConfig(app: IAppSerialized, target: Target, ...configs: Array<Partial<webpack.Configuration>>): webpack.Configuration {

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
                compact: true,
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
      extensions: [".ts", ".tsx", ".js"],
    },
  };

  // Merge the configuration; combine arrays
  return mergeWith({}, prod, ...configs, (objValue: any, srcValue: any) => {
    if (Array.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  });
}
