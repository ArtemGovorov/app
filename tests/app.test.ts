// 🚀 Launch.js - app tests

// ----------------------------------------------------------------------------
// IMPORTS

/* Node */
import * as fs from "fs";
import * as path from "path";

/* Launch.js */
import App from "../src/app";

// ----------------------------------------------------------------------------

// Set the build dir to be ./tmp
const buildDir = path.join(__dirname, "tmp");

// Create a new app, set the output folder
function newApp(): App {
  const app = new App();
  app.setDist(buildDir);

  return app;
}

describe("@launch/app tests", () => {

  it("should create server/client bundles", async () => {
    const app = newApp();

    // Add our sample <Root /> component
    app.setRoot("./components/root.tsx");

    // Build
    await app.build();

    // Check that the relevant files exist
    const files = [
      path.join(buildDir, "server.js"),
    ];

    // Throw if we don't have all the files we expect
    if (!files.every(file => fs.existsSync(file))) {
      throw new Error("Missing build files");
    }
  }).timeout(30000);

});
