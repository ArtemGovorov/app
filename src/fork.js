// 🚀 Launch.js - build initialiser

// Enable Typescript imports
require("ts-node/register");

// ----------------------------------------------------------------------------
// IMPORTS

/* Launch.js */
const createBuildEvent = require("./build").default;

// ----------------------------------------------------------------------------

process.once("message", async appConfig => {
  createBuildEvent(appConfig).once("message", response => {
    process.send(response);
  });
});
