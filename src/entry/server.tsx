// 🚀 Launch.js - server entrypoint

// ----------------------------------------------------------------------------
// IMPORTS

/* NPM */

/* WEB SERVER */

// Koa web server
import * as koa from "koa";

/* REACT */
import * as React from "react";

// React Router HOC for figuring out the exact React hierarchy to display
// based on the URL
import { StaticRouter } from "react-router";

// React utility to transform JSX to HTML (to send back to the client)
import * as ReactDOMServer from "react-dom/server";

// <Helmet> component for retrieving <head> section, so we can set page
// title, meta info, etc along with the initial HTML
import Helmet from "react-helmet";

// Universal rendering
const Loadable = require("react-loadable");

/* Local */

// HTML template
import Html from "../views/ssr";

// ----------------------------------------------------------------------------

// Types
interface IRouteContext {
  status?: number;
  url?: string;
}

// Root component, to be merged by Webpack
const Root: React.ComponentClass = require("__ROOT_ENTRYPOINT").default;

// Map to cache module chunks by server ID
const chunks = new Map<number, string[]>();

// Helper to get chunks by ID
function getChunks(ids: number[], ext = "js"): string[] {
  return ([] as string[]).concat(
    ...ids.map(id => (chunks.get(id) || []).filter(c => c.endsWith(`.${ext}`))),
  );
}

export default async function(serverStats: any, clientStats: any): Promise<koa.Middleware> {
  await Loadable.preloadAll();

  // Get the names of the `main` JS + CSS chunks
  const mainChunkName = clientStats.assetsByChunkName.main.find((c: string) => c.endsWith(".js"));

  // Cache server chunks -> client
  clientStats.chunks.forEach((chunk: any) => {
    chunk.modules.forEach((clientMod: any) => {
      const serverMod = serverStats.modules.find((m: any) => m.identifier === clientMod.identifier);
      if (serverMod) {
        chunks.set(
          serverMod.id,
          [].concat(
            ...clientMod.chunks
            .filter((c: string) => typeof c !== null)
            .map((c: number) => clientStats.chunks[c].files),
          ),
        );
      }
    });
  });

  return async function reactMiddleware(ctx) {
    const routeContext: IRouteContext = {};

    // Modules used to render this route
    const namedModules: string[] = [];
    const webpackModules: number[] = [];

    // Generate the "main" HTML from our React tree.
    const main = ReactDOMServer.renderToString(
      <Loadable.Capture
        report={(moduleName: string) => namedModules.push(moduleName)}
        webpackReport={(moduleName: number) => webpackModules.push(moduleName)}>
        <StaticRouter location={ctx.request.url} context={routeContext}>
          <Root />
        </StaticRouter>
      </Loadable.Capture>,
    );

    // Handle redirects
    if ([301, 302].includes(routeContext.status!)) {
      // 301 = permanent redirect, 302 = temporary
      ctx.status = routeContext.status!;

      // Issue the new `Location:` header
      ctx.redirect(routeContext.url!);

      // Return early -- no need to set a response body
      return;
    }

    // Handle 404 Not Found
    if (routeContext.status === 404) {
      ctx.status = 404;
      ctx.body = "Not found";

      // Return early -- no need to set a response body
      return;
    }

    // Render the final HTML
    const reactRender = ReactDOMServer.renderToString(
      <Html
        helmet={Helmet.renderStatic()}
        js={getChunks(webpackModules).concat(mainChunkName)}
        main={main}>
      </Html>,
    );

    console.log("css chunks ->", getChunks(webpackModules, "css"));

    // Set the return type to `text/html`, and send response to client
    ctx.type = "text/html";
    ctx.body = `<!DOCTYPE html>${reactRender}`;
  };
}
