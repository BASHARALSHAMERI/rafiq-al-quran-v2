import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const optionalBool = () =>
  z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true"));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  SERVICE_NAME: z.string().trim().min(1).default("rufaqaa-backend"),
  PUBLIC_BASE_URL: z.string().url().optional(),
  FRONTEND_BASE_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  CORS_ORIGINS: z.string().optional(),
  CORS_CREDENTIALS_PATHS: z.string().default("/auth"),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_LOGIN_WINDOW_MS: z.coerce.number().int().positive().default(10 * 60 * 1000),
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_GENERAL_WINDOW_MS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_GENERAL_MAX: z.coerce.number().int().positive().optional(),
  REQUEST_BODY_LIMIT: z.string().optional(),
  REQUEST_JSON_LIMIT: z.string().optional(),
  REQUEST_URLENCODED_LIMIT: z.string().optional(),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(25 * 1024 * 1024),
  SLOW_REQUEST_MS: z.coerce.number().int().positive().default(1200),
  METRICS_ENABLED: optionalBool(),
  METRICS_BASIC_USER: z.string().trim().optional(),
  METRICS_BASIC_PASS: z.string().trim().optional(),
  AUDIT_RETENTION_DAYS: z.coerce.number().int().positive().default(90),
  EXPORT_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  RETENTION_BATCH_SIZE: z.coerce.number().int().positive().default(5000),
  DOCS_ENABLED: optionalBool(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .optional(),
  ENABLE_COMPRESSION: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  BACKGROUND_JOBS_ENABLED: optionalBool(),
  FINANCE_V2_READ_ENABLED: optionalBool(),
  FINANCE_V2_WRITE_ENABLED: optionalBool(),
  FINANCE_V2_ENFORCE_APPROVAL: optionalBool(),
  FINANCE_V2_ENFORCE_TRANSFER_ATTACHMENT: optionalBool(),
  FINANCE_V2_DUAL_WRITE_LEGACY_PAYMENT: optionalBool(),
  COMMIT_SHA: z.string().trim().optional(),

  // SMTP Configuration
  SMTP_HOST: z.string().trim().optional().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().optional().default(465),
  SMTP_USER: z.string().trim().optional(),
  SMTP_PASS: z.string().trim().optional(),
  SMTP_FROM: z.string().trim().optional().default("noreply@rafiq.com"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

const baseEnv = parsed.data;

export const env = {
  ...baseEnv,
  RATE_LIMIT_LOGIN_WINDOW_MS:
    baseEnv.RATE_LIMIT_LOGIN_WINDOW_MS ?? baseEnv.RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000,
  RATE_LIMIT_LOGIN_MAX: baseEnv.RATE_LIMIT_LOGIN_MAX ?? baseEnv.RATE_LIMIT_MAX ?? 10,
  RATE_LIMIT_GENERAL_WINDOW_MS:
    baseEnv.RATE_LIMIT_GENERAL_WINDOW_MS ?? baseEnv.RATE_LIMIT_WINDOW_MS ?? 5 * 60 * 1000,
  RATE_LIMIT_GENERAL_MAX: baseEnv.RATE_LIMIT_GENERAL_MAX ?? baseEnv.RATE_LIMIT_MAX ?? 300,
  REQUEST_JSON_LIMIT: baseEnv.REQUEST_JSON_LIMIT ?? baseEnv.REQUEST_BODY_LIMIT ?? "1mb",
  REQUEST_URLENCODED_LIMIT:
    baseEnv.REQUEST_URLENCODED_LIMIT ?? baseEnv.REQUEST_BODY_LIMIT ?? "1mb",
  METRICS_ENABLED: baseEnv.METRICS_ENABLED ?? baseEnv.NODE_ENV !== "production",
  DOCS_ENABLED: baseEnv.DOCS_ENABLED ?? baseEnv.NODE_ENV !== "production",
  LOG_LEVEL: baseEnv.LOG_LEVEL ?? (baseEnv.NODE_ENV === "production" ? "info" : "debug"),
  BACKGROUND_JOBS_ENABLED: baseEnv.BACKGROUND_JOBS_ENABLED ?? true,
  FINANCE_V2_READ_ENABLED: baseEnv.FINANCE_V2_READ_ENABLED ?? true,
  FINANCE_V2_WRITE_ENABLED: baseEnv.FINANCE_V2_WRITE_ENABLED ?? true,
  FINANCE_V2_ENFORCE_APPROVAL: baseEnv.FINANCE_V2_ENFORCE_APPROVAL ?? true,
  FINANCE_V2_ENFORCE_TRANSFER_ATTACHMENT:
    baseEnv.FINANCE_V2_ENFORCE_TRANSFER_ATTACHMENT ?? true,
  FINANCE_V2_DUAL_WRITE_LEGACY_PAYMENT: baseEnv.FINANCE_V2_DUAL_WRITE_LEGACY_PAYMENT ?? true
};

const parseCsv = (value: string): string[] => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const allowedCorsOrigins = parseCsv(env.CORS_ORIGINS ?? env.CORS_ORIGIN);
export const corsCredentialsPaths = parseCsv(env.CORS_CREDENTIALS_PATHS);
