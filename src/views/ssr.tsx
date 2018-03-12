// Server-side HTML render

// Component to render the full HTML response in React

// ----------------------------------------------------------------------------
// IMPORTS

/* NPM */
import * as React from "react";
import { HelmetData } from "react-helmet";

// ----------------------------------------------------------------------------

// Types

export interface IHtmlProps {
  helmet: HelmetData;
  js: string[];
  main: string;
  window?: {
    [key: string]: object;
  };
}

export default class Html extends React.PureComponent<IHtmlProps> {
    public render() {
      const { helmet, js, main, window = {} } = this.props;
      return (
        <html lang="en" prefix="og: http://ogp.me/ns#" {...helmet.htmlAttributes.toString()}>
          <head>
          {helmet.title.toComponent()}
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta httpEquiv="Content-Language" content="en" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {helmet.meta.toComponent()}
          {helmet.base.toString() ? helmet.base.toComponent() : <base href="/" />}
          {helmet.link.toComponent()}
          {helmet.style.toComponent()}
          <script src="https://cdn.polyfill.io/v2/polyfill.min.js" />
          {helmet.script.toComponent()}
          {helmet.noscript.toComponent()}
          </head>
          <body {...helmet.bodyAttributes.toComponent()}>
          <div id="root" dangerouslySetInnerHTML={{__html: main}}/>
          {js.map(src => <script key={src} src={src} />)}
          <script
            dangerouslySetInnerHTML={{
              __html: Object.keys(window).reduce(
                (out, key) => out += `window.${key}=${JSON.stringify(window[key])};`,
                "",
              ),
            }
          } />
          </body>
        </html>
    );
  }
}
