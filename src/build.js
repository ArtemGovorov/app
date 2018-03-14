// 🚀 Launch.js - build initialiser

// Enable Typescript imports
require("ts-node/register");

// ----------------------------------------------------------------------------
// IMPORTS

/* Node */
const webpack = require("webpack");

/* Launch.js */

// Webpack configs
const clientWebpack = require("./webpack/client").default;
const serverWebpack = require("./webpack/server").default;

// ----------------------------------------------------------------------------

process.once("message", appConfig => {

  // Get Webpack configs
  const clientConfig = clientWebpack(appConfig);
  const serverConfig = serverWebpack(appConfig);

  webpack([clientConfig, serverConfig]).run((error, stats) => {
    const response = {};

    try {
      if (error) {
        throw error;
      }
      response.stats = stats.toJson();
    } catch (e) {
      response.error = e.message;
    }

    process.send(response);
  });
});
