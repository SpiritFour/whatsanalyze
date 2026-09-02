module.exports = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^~/(.*)$": "<rootDir>/$1",
  },
  moduleFileExtensions: ["js", "json"],
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  testPathIgnorePatterns: ["/node_modules/", "/tests/e2e/"],
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/utils/transformChatData.js"],
};
