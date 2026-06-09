import type { Request, Response, Router } from "express";
import { prisma } from "../shared/db/prisma";
import { logger } from "../shared/logger/logger";

export function healthRouter(): Router {
  const router = require("express").Router();

  router.get("/health", async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "up",
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Health check failed");
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "down",
        },
      });
    }
  });

  router.get("/ready", async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}
