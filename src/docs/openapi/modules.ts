import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { registerAuthDocs } from "@/modules/auth";

export type ModuleDocsRegistrar = (registry: OpenAPIRegistry) => void;

/**
 * Feature modules register OpenAPI paths/schemas here when they ship HTTP APIs.
 */
export const moduleDocsRegistrars: ModuleDocsRegistrar[] = [registerAuthDocs];

export function registerAllModuleDocs(registry: OpenAPIRegistry): void {
  for (const register of moduleDocsRegistrars) {
    register(registry);
  }
}
