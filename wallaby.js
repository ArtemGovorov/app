module.exports = function (w) {
  return {
    files: [
      "src/**/*.ts?(x)",
      "__tests__/components/*.ts?(x)",
      "*.json",
      {
        pattern: "node_modules/**/*",
        instrument: false,
        load: false,
      }
    ],

    tests: [
      '__tests__/*.test.ts'
    ],

    testFramework: 'jest',

    env: {
      type: 'node',
      runner: "node",
    },
  };
};