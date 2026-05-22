import { readFileSync } from "node:fs";
import path from "node:path";
import { type RequestHandler, Router } from "express";
import { env } from "../../config/env";
import { prisma } from "../../shared/db/prisma";
import { logger } from "../../shared/logger/logger";

type PackageMetadata = {
  name: string;
  version: string;
};

let cachedPackageMetadata: PackageMetadata | null = null;

const readPackageMetadata = (): PackageMetadata => {
  if (cachedPackageMetadata) {
    return cachedPackageMetadata;
  }

  const packageJsonPath = path.resolve(process.cwd(), "package.json");

  try {
    const raw = readFileSync(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<PackageMetadata>;
    cachedPackageMetadata = {
      name: parsed.name ?? env.SERVICE_NAME,
      version: parsed.version ?? "0.0.0"
    };
  } catch {
    cachedPackageMetadata = {
      name: env.SERVICE_NAME,
      version: "0.0.0"
    };
  }

  return cachedPackageMetadata;
};

const systemRouter = Router();

const sendHealth: RequestHandler = (_req, res) => {
  const pkg = readPackageMetadata();

  res.status(200).json({
    ok: true,
    data: {
      service: pkg.name,
      version: pkg.version,
      uptimeMs: Math.round(process.uptime() * 1000),
      uptimeSec: Math.round(process.uptime()),
      now: new Date().toISOString()
    }
  });
};

const sendReady: RequestHandler = async (req, res) => {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");

    res.status(200).json({
      ok: true,
      data: {
        ready: true,
        database: "up"
      }
    });
  } catch (error) {
    logger.error({
      requestId: req.requestId ?? null,
      path: req.originalUrl,
      error: error instanceof Error ? error.message : "unknown"
    });

    res.status(503).json({
      ok: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Service is not ready",
        requestId: req.requestId ?? "unknown"
      }
    });
  }
};

const sendVersion: RequestHandler = (_req, res) => {
  const pkg = readPackageMetadata();

  res.status(200).json({
    ok: true,
    data: {
      name: pkg.name,
      version: pkg.version,
      commitSha: env.COMMIT_SHA ?? null
    }
  });
};

const sendInfo: RequestHandler = (_req, res) => {
  const pkg = readPackageMetadata();

  res.status(200).json({
    ok: true,
    data: {
      name: pkg.name,
      version: pkg.version,
      env: env.NODE_ENV,
      uptimeSec: Math.round(process.uptime()),
      commitSha: env.COMMIT_SHA ?? null,
      docsEnabled: env.DOCS_ENABLED,
      metricsEnabled: env.METRICS_ENABLED
    }
  });
};

systemRouter.get("/health", sendHealth);
systemRouter.get("/system/health", sendHealth);
systemRouter.get("/ready", sendReady);
systemRouter.get("/system/ready", sendReady);
systemRouter.get("/version", sendVersion);
systemRouter.get("/system/version", sendVersion);
systemRouter.get("/system/info", sendInfo);

systemRouter.get("/public/branding", async (_req, res) => {
  try {
    const branding = await prisma.organization.findFirst({
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        logoUrl: true
      }
    });

    res.status(200).json({
      ok: true,
      data: branding || { name: null, logoUrl: null }
    });
  } catch (error) {
    logger.error({
      path: "/public/branding",
      error: error instanceof Error ? error.message : "unknown",
      message: "Failed to fetch public branding"
    });
    // Fallback gracefully so frontend doesn't break
    res.status(200).json({
      ok: true,
      data: { name: null, logoUrl: null }
    });
  }
});

export default systemRouter;
