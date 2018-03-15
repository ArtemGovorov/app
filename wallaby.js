module.exports = function (w) {
  return {
    files: [
      "src/**/*.ts?(x)",
      "src/**/*.js",
      "__tests__/components/*.ts?(x)",
      "__tests__/components/*.js",
      "*.json"
    ],

    tests: [
      '__tests__/*.test.ts'
    ],

    testFramework: 'jest',

    env: {
      type: 'node'
    },

    setup: function (w) {
      const fs = require('fs');
      const path = require('path');
      fs.existsSync('./node_modules') && fs.unlinkSync('./node_modules');
      fs.symlinkSync(path.join(w.localProjectDir, 'node_modules'), './node_modules');
    }
  };
};
