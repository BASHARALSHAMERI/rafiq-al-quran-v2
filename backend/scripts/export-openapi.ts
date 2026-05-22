import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getOpenApiJson, getOpenApiYaml } from "../src/docs/openapi";

const main = async () => {
  const outputDirectory = path.resolve(process.cwd(), "docs");
  await mkdir(outputDirectory, { recursive: true });

  const jsonPath = path.join(outputDirectory, "openapi.json");
  const yamlPath = path.join(outputDirectory, "openapi.yaml");

  await Promise.all([
    writeFile(jsonPath, getOpenApiJson(), "utf8"),
    writeFile(yamlPath, getOpenApiYaml(), "utf8")
  ]);

  console.log("OpenAPI artifacts exported:");
  console.log(`- ${jsonPath}`);
  console.log(`- ${yamlPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
