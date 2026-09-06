const { defineConfig } = require("@playwright/test");
const baseConfig = require("./playwright.config.js");

module.exports = defineConfig({
  ...baseConfig,
  webServer: undefined,
  use: {
    ...baseConfig.use,
    baseURL: "http://localhost:4173",
  },
});
