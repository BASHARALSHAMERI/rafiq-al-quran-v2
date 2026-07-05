/**
 * Database Safety Guard
 * 
 * Prevents destructive commands (like clear/deleteMany/reset) from running 
 * against the production or development database by accident.
 */

export function ensureSafeDatabaseEnvironment() {
  const env = process.env.NODE_ENV;
  const dbUrl = process.env.DATABASE_URL || "";

  // Only allow destructive actions in 'test' environment
  if (env !== "test") {
    throw new Error(
      `[DB_GUARD_ERROR] Destructive operation prevented! NODE_ENV must be 'test'. Current: '${env}'.`
    );
  }

  // Double check the database URL actually contains 'test' or 'ci' to prevent wiping rafiq_v2
  const lowerDbUrl = dbUrl.toLowerCase();
  if (!lowerDbUrl.includes("test") && !lowerDbUrl.includes("ci")) {
    throw new Error(
      `[DB_GUARD_ERROR] Destructive operation prevented! DATABASE_URL does not look like a test database. Current URL: '${dbUrl}'.`
    );
  }
}
