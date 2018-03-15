// 🚀 Launch.js - app tests

// ----------------------------------------------------------------------------
// IMPORTS

/* Node */
import * as fs from "fs";
import * as http from "http";
import * as path from "path";

/* Node */
import axios from "axios";
import * as getPort from "get-port";
import * as rimraf from "rimraf";

/* Launch.js */
import App from "../src/app";
import { Mode } from "../src/mode";

// ----------------------------------------------------------------------------

// Set the build dir to be ./tmp
const buildDir = path.resolve(__dirname, "../dist/tmp");

// Don't let any test run for more than 30 seconds
jest.setTimeout(30000);

/* HELPERS */

// Get a new `App` instance, with test defaults
async function newApp(): Promise<App> {
  const app = new App();

  app
    .silent() // <-- Silence spinners, for testing
    .disableFork()
    .setDist(buildDir)
    .setMode(Mode.Production)
    .setPort(await getPort());

  return app;
}

/* TESTS */

// Clean up the distribution folder after each test
afterEach(done => {
  // Delete the built assets
  rimraf(buildDir, () => {
      done();
  });
});

// Test .tsx and .js builds
// ["root.tsx", "root.js"].forEach(entry => {
//   test(`should create server/client bundles (${entry})`, async () => {
//     const app = await newApp();
//     app.setRoot(`components/${entry}`);

//     const server = await app.build();

//     try {
//       // Check that the relevant files exist
//       const files = [
//         path.join(buildDir, "server.js"),
//       ];

//       // Throw if we don't have all the files we expect
//       if (!files.every(file => fs.existsSync(file))) {
//         throw new Error("Missing build files");
//       }
//     } finally {
//       server.close();
//     }
//   });
// });

test(`should create server/client bundles`, async () => {
  const app = await newApp();
  app.setRoot(`./components/root.tsx`);

  const server = await app.build();

  try {
    // Check that the relevant files exist
    const files = [
      path.join(buildDir, "server.js"),
    ];

    // Throw if we don't have all the files we expect
    if (!files.every(file => fs.existsSync(file))) {
      throw new Error("Missing build files");
    }
  } finally {
    server.close();
  }
});

// test("balks when forking", () => {
//   require("child_process").fork("__tests__/components/test.js");
// });

// test("test server", () => {
//   const app = new App();
//   app.server.enableCors();
//   expect(1).toBe(1);
// });

// describe("@launch/app tests", () => {

  // it("should create server/client bundles (.js entry)", async () => {
  //   const app = newApp();
  //   app.setRoot("components/root.js");

  //   // Check that the relevant files exist
  //   const files = [
  //     path.join(buildDir, "server.js"),
  //   ];

  //   // Throw if we don't have all the files we expect
  //   if (!files.every(file => fs.existsSync(file))) {
  //     throw new Error("Missing build files");
  //   }
  // }).timeout(timeout);

  // it("should return a valid HTML response", async () => {
  //   const html = await axios({ url: `http://localhost:${port}/` });
  //   console.log(html.data);
  // });
// });
