// 🚀 Launch.js - Web server

// ----------------------------------------------------------------------------
// IMPORTS

/* Node */
import * as path from "path";

/* NPM */

// Koa 2 web server.  Handles incoming HTTP requests, and will serve back
// the React render, or any of the static assets being compiled
import * as Koa from "koa";

// Static file handler
import * as koaSend from "koa-send";

// Enable cross-origin requests
import * as koaCors from "kcors";

// Koa Router, for handling URL requests
import * as KoaRouter from "koa-router";

// High-precision timing, so we can debug response time to serve a request
import * as ms from "microseconds";

/* Launch.js */
import App from "./app";
import { Mode } from "./mode";

// ----------------------------------------------------------------------------

// Types
type RouteVerb = "get" | "post" | "put" | "patch" | "delete";
type AttachHandler = (koa: Koa, router: KoaRouter) => void;

interface IUserRoute {
  verb: RouteVerb;
  url: string;
  fn: KoaRouter.IMiddleware;
}

export default class Server {

  // --------------------------------------------------------------------------
  /* PROPERTIES */
  // --------------------------------------------------------------------------

  /* DEFAULTS */

  // App instance
  private _app: App;

  // Enable CORS via `koa-cors`
  private _enableCors = true;

  // Enable /ping routes by default
  private _enablePing = true;

  // Enable 204 favicon.ico response by default
  private _enableFavicon = true;

  // Enable error handling
  private _enableDefaultErrorHandler = true;

  // Enable request timing
  private _enableTiming = true;

  // User middleware
  private _middleware = new Set<Koa.Middleware>();

  // User routes
  private _routes: IUserRoute[] = [];

  // User callback function to attach koa/router
  private _attachFunction: AttachHandler | null = null;

  /* CONFIGURATION */

  // Use default `koa-cors` options
  private _corsOptions: koaCors.Options = {};

  // --------------------------------------------------------------------------
  /* PUBLIC METHODS */
  // --------------------------------------------------------------------------

  /* CONSTRUCTOR */
  public constructor(app: App) {
    this._app = app;
  }

  /* ROUTING */

  // Add GET route
  public get(url: string, fn: KoaRouter.IMiddleware): this {
    this.addRoute("get", url, fn);

    return this;
  }

  // Add POST route
  public post(url: string, fn: KoaRouter.IMiddleware): this {
    this.addRoute("post", url, fn);

    return this;
  }

  // Add PUT route
  public put(url: string, fn: KoaRouter.IMiddleware): this {
    this.addRoute("put", url, fn);

    return this;
  }

  // Add PUT route
  public patch(url: string, fn: KoaRouter.IMiddleware): this {
    this.addRoute("patch", url, fn);

    return this;
  }

  // Add DELETE route
  public delete(url: string, fn: KoaRouter.IMiddleware): this {
    this.addRoute("delete", url, fn);

    return this;
  }

  // Disable /ping routes
  public disablePing(): this {
    this._enablePing = false;

    return this;
  }

  // Enable /ping routes (if previously disabled)
  public enablePing(): this {
    this._enablePing = true;

    return this;
  }

  /* ERROR HANDLING */

  // Disable default error handler
  public disableDefaultErrorHandler(): this {
    this._enableDefaultErrorHandler = false;

    return this;
  }

  // Enable default error handler (if previously disabled)
  public enableDefaultErrorHandler(): this {
    this._enableDefaultErrorHandler = true;

    return this;
  }

  /* TIMING */

  // Disable request timing
  public disableTiming(): this {
    this._enableTiming = false;

    return this;
  }

  // Enable request timing (if previously disabled)
  public enableTiming(): this {
    this._enableTiming = true;

    return this;
  }

  /* MIDDLEWARE */

  // Disable CORS plugin
  public disableCors(): this {
    this._enableCors = false;

    return this;
  }

  // Enable CORS plugin (if previously disabled)
  public enableCors(): this {
    this._enableCors = true;

    return this;
  }

  // Set CORS options for `koa-cors`
  public setCorsOptions(opt: koaCors.Options): this {
    this._corsOptions = opt;

    return this;
  }

  // Add user middleware
  public middleware(fn: Koa.Middleware): this {
    this._middleware.add(fn);

    return this;
  }

  // Allow users to attach a callback function before initialisation
  // to access `koa` and `router`
  public attach(fn: AttachHandler) {
    this._attachFunction = fn;
  }

  /* SERVER */

  // Create a new server, and return the Koa app instance
  public create() {

    // Create new Koa and router instances
    const koa = new Koa();
    const router = new KoaRouter();

    // Set-up a general purpose /ping route to check the server is alive
    if (this._enablePing) {
      router.get("/ping", async ctx => {
        ctx.body = "pong";
      });
    }

    // Favicon.ico.  By default, we'll serve this as a 204 No Content.
    // If /favicon.ico is available as a static file, it'll try that first
    if (this._enableFavicon) {
      router.get("/favicon.ico", async ctx => {
        ctx.status = 204;
      });
    }

    // Add cross-origin request handling
    if (this._enableCors) {
      koa.use(koaCors(this._corsOptions));
    }

    // Add default error handling middleware. Errors/exceptions not caught
    // will wind up here.
    if (this._enableDefaultErrorHandler) {
      koa.use(async (ctx, next) => {
        try {
          await next();
        } catch (e) {
          console.log("Error:", e.message);
          ctx.body = "There was an error. Please try again later.";
        }
      });
    }

    // It's useful to see how long a request takes to respond.  Add the
    // timing to a HTTP Response header
    if (this._enableTiming) {
      koa.use(async (ctx, next) => {
        const start = ms.now();
        await next();
        const end = ms.parse(ms.since(start));
        const total = end.microseconds + (end.milliseconds * 1e3) + (end.seconds * 1e6);
        ctx.set("Response-Time", `${total / 1e3}ms`);
      });
    }

    // Attach static file middleware. First, calculate `koa-send` opts,
    // since they won't change
    const koaSendOpts = {
      immutable: this._app.mode.is(Mode.Production),
      root: path.join(this._app.dist, "public"),
    };

    // ... and then attach the handler
    koa.use(async (ctx, next) => {
      try {
        if (ctx.path !== "/") {
          return await koaSend(
            ctx,
            ctx.path,
            koaSendOpts,
          );
        }
      } catch (e) { /* Error? Go to next middleware... */ }
      return next();
    });

    // Add custom middleware
    this._middleware.forEach(fn => koa.use(fn));

    // Add custom routes
    this._routes.forEach(r => router[r.verb](r.url, r.fn));

    // Run attachment callback, if applicable
    if (typeof this._attachFunction === "function") {
      this._attachFunction(koa, router);
    }

    // Attach router
    koa.use(router.allowedMethods())
      .use(router.routes());

    return koa;
  }

  // --------------------------------------------------------------------------
  /* PRIVATE METHODS */
  // --------------------------------------------------------------------------

  private addRoute(verb: RouteVerb, url: string, fn: KoaRouter.IMiddleware) {
    this._routes.push({
      fn,
      url,
      verb,
    });
  }

}
