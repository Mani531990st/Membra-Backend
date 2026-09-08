import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export function createOpenApiRegistry(): OpenAPIRegistry {
  return new OpenAPIRegistry();
}
