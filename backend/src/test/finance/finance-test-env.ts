const TEST_DATABASE_ENV = "DATABASE_URL_TEST";

export {};

const failFinanceTestEnv = (message: string): never => {
  throw new Error(`[finance-test] ${message}`);
};

const testUrl =
  process.env[TEST_DATABASE_ENV]?.trim() ||
  failFinanceTestEnv(`${TEST_DATABASE_ENV} is required. Finance integration tests never use DATABASE_URL.`);

const parsed = (() => {
  try {
    return new URL(testUrl);
  } catch {
    return failFinanceTestEnv(`${TEST_DATABASE_ENV} must be a valid PostgreSQL URL.`);
  }
})();

if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
  failFinanceTestEnv(`${TEST_DATABASE_ENV} must use PostgreSQL.`);
}

const databaseName = parsed.pathname.replace(/^\//, "").toLowerCase();
if (!databaseName || !/(test|ci)/.test(databaseName)) {
  failFinanceTestEnv(`${TEST_DATABASE_ENV} database name must contain "test" or "ci".`);
}

if (process.env.DATABASE_URL && process.env.DATABASE_URL === testUrl) {
  failFinanceTestEnv(`${TEST_DATABASE_ENV} must differ from DATABASE_URL.`);
}

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = testUrl;
process.env.DIRECT_URL = testUrl;
process.env.BACKGROUND_JOBS_ENABLED = "false";
process.env.FINANCE_V2_READ_ENABLED = "true";
process.env.FINANCE_V2_WRITE_ENABLED = "true";
process.env.JWT_ACCESS_SECRET ??= "finance-test-access-secret-at-least-32-characters";
process.env.JWT_REFRESH_SECRET ??= "finance-test-refresh-secret-at-least-32-characters";
