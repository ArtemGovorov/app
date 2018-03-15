// 🚀 Launch.js - builder

// ----------------------------------------------------------------------------
// IMPORTS

/* Node */
import * as EventEmitter from "events";

/* NPM */
import * as webpack from "webpack";

/* Launch.js */
import { IAppSerialized } from "./app";

// Webpack configs
import clientWebpack from "./webpack/client";
import serverWebpack from "./webpack/server";

// ----------------------------------------------------------------------------

export default function createBuildEvent(appConfig: IAppSerialized): EventEmitter {

  // Create a build event
  const build = new EventEmitter();

  // Get Webpack configs
  const clientConfig = clientWebpack(appConfig);
  const serverConfig = serverWebpack(appConfig);

  webpack([clientConfig, serverConfig]).run((error, stats) => {
    build.emit("message", { error, stats: stats.toJson() });
  });

  return build;
}
