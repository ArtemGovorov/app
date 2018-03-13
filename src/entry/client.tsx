// 🚀 Launch.js - client entrypoint

// Browser entry point, for Webpack.  We'll grab the browser-flavoured
// versions of React mounting, routing etc to hook into the DOM

// ----------------------------------------------------------------------------
// IMPORTS

/* NPM */

// React parts
import * as React from "react";
import * as ReactDOM from "react-dom";

// Browser URL history
import createBrowserHistory from "history/createBrowserHistory";

// React Router, for controlling browser routes.  We'll feed in our custom
// `history` instance that"s imported below, so that we have a single store of
// truth for routing
import { Router } from "react-router-dom";

// State management with MobX
// import { Provider } from "mobx-react";

// ----------------------------------------------------------------------------

// Root component, to be merged by Webpack
const Root: React.ComponentClass = require("__ROOT_ENTRYPOINT").default;

// Create browser history
const history = createBrowserHistory();

// Create the "root" entry point into the app.  If we have React hot loading
// (i.e. if we"re in development), then we"ll wrap the whole thing in an
// <AppContainer>.  Otherwise, we"ll jump straight to the browser router
async function doRender() {
  const main = document.getElementById("root");

  // If there's existing HTML, re-use it with `hydrate` - otherwise, just render
  ReactDOM[main!.innerHTML.trim().length ? "hydrate" : "render"](
    <Browser />,
    main,
  );
}

// The <Main> component.  We"ll run this as a self-contained function since
// we"re using a bunch of temporary vars that we can safely discard.
//
// If we have hot reloading enabled (i.e. if we"re in development), then
// we"ll wrap the whole thing in <AppContainer> so that our views can respond
// to code changes as needed
const Browser = (() => {
  // Wrap the component hierarchy in <BrowserRouter>, so that our children
  // can respond to route changes
  const Chain = () => (
    <Router history={history}>
      <Root />
    </Router>
  );

  // React hot reloading -- only enabled in development.  This branch will
  // be shook from production, so we can run a `require` statement here
  // without fear that it"ll inflate the bundle size
  if ((module as any).hot) {
    // <AppContainer> will respond to our Hot Module Reload (HMR) changes
    // back from WebPack, and handle re-rendering the chain as needed
    const { AppContainer } = require("react-hot-loader");

    // Start our "listener" at the root component, so that any changes that
    // occur in the hierarchy can be captured
    (module as any).hot.accept(__ROOT_ENTRYPOINT, () => {
      // Refresh the entry point of our app, to get the changes.
      // tslint:disable-next-line
      require(__ROOT_ENTRYPOINT).default;

      // Re-render the hierarchy
      void doRender();
    });

    return () => (
      <AppContainer>
        <Chain />
      </AppContainer>
    );
  }
  return Chain;
})();

void doRender();
