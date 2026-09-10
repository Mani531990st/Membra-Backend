import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";

import { registerErrorComponents } from "./components/errors";
import { registerAllModuleDocs } from "./modules";
import { createOpenApiRegistry } from "./registry";

const openApiInfo = {
  openapi: "3.1.0" as const,
  info: {
    title: "Membra API",
    version: "0.1.0",
    description:
      "HTTP API for Membra. Feature modules register paths and schemas as they are implemented.\n\nAuthentication uses HTTP-only session cookies (see SessionCookie security scheme). Auth signup/login/forgot-password/reset-password are rate limited.",
  },
  servers: [
    {
      url: "/",
      description: "Current host",
    },
  ],
};

export type OpenApiDocument = ReturnType<
  OpenApiGeneratorV31["generateDocument"]
>;

/**
 * Compose the OpenAPI 3.1 document from shared components + module registrars.
 */
export function generateOpenApiDocument(): OpenApiDocument {
  const registry = createOpenApiRegistry();

  registry.registerComponent("securitySchemes", "SessionCookie", {
    type: "apiKey",
    in: "cookie",
    name: process.env.SESSION_COOKIE_NAME?.trim() || "membra_session",
    description:
      "Opaque server-side session token set on login. HttpOnly; Secure in production; SameSite=Lax.",
  });

  registerErrorComponents(registry);
  registerAllModuleDocs(registry);

  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument(openApiInfo);
}
