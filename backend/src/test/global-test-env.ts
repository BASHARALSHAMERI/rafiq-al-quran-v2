import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

// Ensure test environment is forced
process.env.NODE_ENV = "test";

// Prefer DATABASE_URL_TEST if set, otherwise fallback to a generic test URL
const testDbUrl = process.env.DATABASE_URL_TEST || "postgresql://postgres:Rafiq%402026!@localhost:5432/rafiq_v2_test?schema=public";

process.env.DATABASE_URL = testDbUrl;
process.env.DIRECT_URL = testDbUrl;
process.env.BACKGROUND_JOBS_ENABLED = "false";
process.env.FINANCE_V2_READ_ENABLED = "true";
process.env.FINANCE_V2_WRITE_ENABLED = "true";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "finance-test-access-secret-at-least-32-characters";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "finance-test-refresh-secret-at-least-32-characters";

// Fail immediately if we accidentally loaded the main development database URL
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.toLowerCase().includes("test") && !process.env.DATABASE_URL.toLowerCase().includes("ci")) {
  throw new Error(
    `[GLOBAL_TEST_ENV] FATAL ERROR: DATABASE_URL must point to a test database. Current: ${process.env.DATABASE_URL}`
  );
}
