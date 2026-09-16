module.exports = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^~/(.*)$": "<rootDir>/$1",
  },
  moduleFileExtensions: ["js", "ts", "json"],
  transform: {
    "^.+\\.[jt]s$": "babel-jest",
  },
  testPathIgnorePatterns: ["/node_modules/", "/tests/e2e/", "/.delta/"],
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/utils/transformChatData.js",
    "<rootDir>/utils/attachments.ts",
  ],
};
