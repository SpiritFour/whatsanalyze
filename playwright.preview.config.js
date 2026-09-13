const { defineConfig } = require("@playwright/test");
const baseConfig = require("./playwright.config.js");

module.exports = defineConfig({
  ...baseConfig,
  webServer: undefined,
  // The preview server serves a built site: there is nothing to compile, so
  // the warmup project only costs time here.
  projects: baseConfig.projects
    .filter((project) => project.name !== "warmup")
    // eslint-disable-next-line no-unused-vars
    .map(({ dependencies, ...project }) => project),
  use: {
    ...baseConfig.use,
    baseURL: "http://localhost:4173",
  },
});
