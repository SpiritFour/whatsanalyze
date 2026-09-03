module.exports = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^~/(.*)$": "<rootDir>/$1",
  },
  moduleFileExtensions: ["js", "json"],
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  testPathIgnorePatterns: ["/node_modules/", "/tests/e2e/", "/tests/e2e-sandbox/", "/.delta/"],
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/utils/transformChatData.js"],
};
