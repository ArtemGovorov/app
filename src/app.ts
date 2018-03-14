// 🚀 Launch.js framework

// ----------------------------------------------------------------------------
// IMPORTS

/* Node */
import { fork } from "child_process";
import * as fs from "fs";
import * as path from "path";

/* NPM */
import * as Koa from "koa";
import * as ora from "ora";
import * as webpack from "webpack";

/* Launch.js */
import CurrentMode, { Mode } from "./mode";
import Server from "./server";

// ----------------------------------------------------------------------------

const caller = require("caller");

// Types
type ServerRenderer = (serverStats: webpack.Stats, clientStats: webpack.Stats) => Koa.Middleware;

export interface IAppSerialized {
  dist: string;
  mode: string;
  root: string;
}

export default class App {

  // --------------------------------------------------------------------------
  /* PROPERTIES */
  // --------------------------------------------------------------------------

  // Build mode.
  private _mode = new CurrentMode();

  // Instance of our Koa-based `Server` class
  private _server = new Server(this);

  // Port to run the server on (default: 3000)
  private _port = 3000;

  // Silent mode. If `true`, no logging will be sent to stdout
  private _isSilent = false;

  // Distribution folder. By default, <cwd>/dist
  private _dist = path.join(process.cwd(), "dist");

  // Spinner instance, for notifying the user of errors/success
  private _spinner = ora();

  // App entrypoint. This is where webpack will expect to get the 'root'
  // component that will render to `<div id="root">`
  private _root: string | null = null;

  // --------------------------------------------------------------------------
  /* PUBLIC METHODS */
  // --------------------------------------------------------------------------

  /* LOGGING */

  // Enable silent mode, i.e. no logging to stdout
  public silent(): void {
    this._isSilent = true;
  }

  // Enable verbose output (silent === false.) You only need to execute
  // this if silent mode has previously been ued
  public verbose(): void {
    this._isSilent = false;
  }

  /* CONFIGURATION */

  // Get the distribution folder
  public get dist(): string {
    return this._dist;
  }

  // Get the build mode
  public get mode(): CurrentMode {
    return this._mode;
  }

  // Get the root entrypoint
  public get root(): string | null {
    return this._root;
  }

  // Set the build mode
  public setMode(mode: Mode): this {
    this._mode.set(mode);

    return this;
  }

  // Set the port to spawn the server on
  public setPort(port: number): this {
    this._port = port;

    return this;
  }

  // Set the distribution folder
  public setDist(dir: string): this {
    this._dist = dir;

    return this;
  }

  // Set the 'root' component entrypoint filename
  public setRoot(filename: string): this {

    // Set root relative to the calling file
    this._root = path.join(path.dirname(caller()), filename);

    return this;
  }

  /* SERIALIZATION */

  // Serialize config into options that our Webpack build process can consume
  public serialize(): IAppSerialized {
    return {
      dist: this._dist,
      mode: this._mode.toString(),
      root: this._root!,
    };
  }

  /* BUILD */
  public async build(): Promise<webpack.Stats|undefined> {

    /* RUN INITIAL SANITY CHECKS */

    // Are we dealing with an existing file/folder for dist?
    const fileExists = fs.existsSync(this._dist);

    // Sanity check that the distribution folder is writable.
    // Note this isn't fool-proof, since there's a race condition between checking
    // here and later attempting the Webpack bundling. But 99% of the time, this
    // will catch user goofs.
    if (fileExists) {

      // Check that we're dealing only with a dir
      const stat = fs.statSync(this._dist);
      if (!stat.isDirectory()) {
          this.error(`Can't overwrite non-directory ${this._dist}`);
      }

      // Attempt to see if we can open the folder for writing
      try {
          fs.accessSync(this._dist, fs.constants.W_OK);
      } catch (_e) {
          this.error(`Can't write to dist path ${this._dist}`);
      }
    }

    // Check that the main component has been set...
    if (!this._root) {
      this.error("You need to set the root component filename with `app.setRoot()`");
    }

    // ... exists
    if (!fs.existsSync(this._root!)) {
      this.error(`The root entrypoint '${this._root}' isn't a valid file`);
    }

    // ... and can be opened for reading
    try {
      fs.accessSync(this._root!, fs.constants.R_OK);
    } catch (_) {
      this.error(`Cannot read root entrypoint: ${this._root}`);
    }

    /* READY TO START THE MAIN BUILD... */

    // Log that we're starting the app
    if (!this._isSilent) {
      this._spinner.start("Launch.js app building...");
    }

    // Spawn Webpack
    try {
      return new Promise<webpack.Stats>((resolve, reject) => {

        // Set up the Webpack build event listener/sender

        const build = fork(path.join(__dirname, "build.js"));

        build.once("message", async ({ error, stats }) => {
          console.log("hey");
          try {

            // Report any Webpack `run` errors
            if (error) {
              this.error(error.message);
            }

            // Report any build errors
            if (stats.errors.length) {
              this.error(`Webpack build error(s):\n${stats.errors.join("\n")}`);
            }

            // Get the local stats, and grab our new middleware
            const [clientStats, serverStats] = stats.children;
            const serverRender: ServerRenderer = require(path.join(this.dist, "server.js")).default;

            // Attach React route handler
            this._server.get("/*", await serverRender(serverStats, clientStats));

            // Create listener
            const koa = this._server.create();

            // Run the server!
            koa.listen(this._port, () => {
              if (!this._isSilent) {
                this._spinner.stopAndPersist({
                  symbol: "🚀",
                  text: "Launch.js app ready",
                });
              }
              resolve(stats);
            });

          } catch (e) {
            return reject(e);
          }
        });

        // Kick-off the build process by sending a serialized config
        build.send(this.serialize());
      });

    } catch (e) {
      this.error(e.message);
    }
  }

  // Launch the app. If there are any errors, the process with exit with
  // a non-zero code, making it ideal for CLI/production use. Use `build()`
  // instead if you want to catch errors programatically.
  public async launch(): Promise<void> {
    try {
        await this.build();
    } catch (_e) {
        // Just exit. No need to display anything, since the call to
        // `build` will already have taken care of that
        process.exit(1);
    }
  }

  // --------------------------------------------------------------------------
  /* PRIVATE METHODS */
  // --------------------------------------------------------------------------

  /* ERROR HANDLING */

  // Set an error. This will update the Ora `spinner` instance with a
  // failed message, and throw
  private error(msg: string): void {
    if (!this._isSilent) {
        this._spinner.fail(`Error: ${msg}`);
    }
    throw new Error(msg);
  }

}
