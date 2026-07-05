/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!puppeteer|puppeteer-core)"
  ],
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/src/test/global-test-env.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/test/finance/finance-test-timeout.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.routes.ts",
    "!src/**/server.ts",
    "!src/jobs/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html", "json"],
};
