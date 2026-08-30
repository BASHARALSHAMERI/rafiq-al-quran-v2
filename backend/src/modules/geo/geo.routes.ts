import { Router } from "express";
import { authGuard } from "../../shared/middleware/auth.middleware";
import { attachScope } from "../../shared/middleware/scope.middleware";
import { validateQuery } from "../../shared/middleware/validate.middleware";
import { geoNearbyQuerySchema, geoReverseQuerySchema, geoSearchQuerySchema } from "./geo.validation";
import { geoService } from "./geo.service";

const geoRouter = Router();

geoRouter.use(authGuard, attachScope);

geoRouter.get("/search", validateQuery(geoSearchQuerySchema), async (_req, res, next) => {
  try {
    const query = res.locals.validatedQuery as { q: string; limit?: number };
    const data = await geoService.search(query);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

geoRouter.get("/reverse", validateQuery(geoReverseQuerySchema), async (_req, res, next) => {
  try {
    const query = res.locals.validatedQuery as { lat: number; lng: number };
    const data = await geoService.reverse(query);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

geoRouter.get("/nearby", validateQuery(geoNearbyQuerySchema), async (_req, res, next) => {
  try {
    const query = res.locals.validatedQuery as { lat: number; lng: number; radius?: number; limit?: number };
    const data = await geoService.nearby(query);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

geoRouter.get("/internal-locations", async (req, res, next) => {
  try {
    const data = await geoService.internalLocations((req as { scope?: import("../../shared/types/auth.types").ScopeContext }).scope!);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

export default geoRouter;
