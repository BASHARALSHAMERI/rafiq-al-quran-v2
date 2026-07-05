/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.finance.test.ts", "**/*.finance.integration.test.ts"],
  setupFiles: ["<rootDir>/src/test/global-test-env.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/test/finance/finance-test-timeout.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  maxWorkers: 1,
  testTimeout: 30000
};

