const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 20000, // Increase timeout for real API calls
  },
});
