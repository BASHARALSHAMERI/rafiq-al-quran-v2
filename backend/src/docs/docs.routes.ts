import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { getOpenApiDocument, getOpenApiJson, getOpenApiYaml } from "./openapi";

const docsRouter = Router();

docsRouter.get("/openapi.json", (_req, res) => {
  res.type("application/json").send(getOpenApiJson());
});

docsRouter.get("/openapi.yaml", (_req, res) => {
  res.type("application/yaml").send(getOpenApiYaml());
});

docsRouter.use("/docs", swaggerUi.serve);
docsRouter.get(
  "/docs",
  swaggerUi.setup(getOpenApiDocument(), {
    customSiteTitle: "Rafiq API Docs",
    swaggerOptions: {
      displayRequestDuration: true,
      docExpansion: "none"
    }
  })
);

export default docsRouter;
