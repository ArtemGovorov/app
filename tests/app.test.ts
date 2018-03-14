// 🚀 Launch.js - app tests

// ----------------------------------------------------------------------------
// IMPORTS

/* Node */
import * as fs from "fs";
import * as path from "path";

/* Node */
import * as rimraf from "rimraf";

/* Launch.js */
import App from "../src/app";
import { Mode } from "../src/mode";

// ----------------------------------------------------------------------------

// Set the build dir to be ./tmp
const buildDir = path.join(__dirname, "tmp");

// Create a new app, set the output folder
function newApp(): App {
  const app = new App();
  app.setDist(buildDir);
  app.setMode(Mode.Production);

  return app;
}

const timeout = 120000;

describe("@launch/app tests", () => {

  // Clean up the distribution folder after each test
  after(done => {
    rimraf(buildDir, () => {
        done();
    });
  });

  it("should create server/client bundles", async () => {
    const app = newApp();

    // Add our sample <Root /> component
    app.setRoot("./components/root.tsx");

    // Build
    const server = await app.build();
    server.close();

    // Check that the relevant files exist
    const files = [
      path.join(buildDir, "server.js"),
    ];

    // Throw if we don't have all the files we expect
    if (!files.every(file => fs.existsSync(file))) {
      throw new Error("Missing build files");
    }
  }).timeout(timeout);

});
