import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { z } from "@/shared/validation/zod";

/**
 * Matches `HttpErrorBody` from `src/shared/errors`.
 * Register once on the shared OpenAPI registry.
 */
export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.enum([
        "VALIDATION",
        "UNAUTHORIZED",
        "FORBIDDEN",
        "NOT_FOUND",
        "CONFLICT",
        "INTERNAL",
      ]),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  })
  .openapi("ErrorResponse");

export function registerErrorComponents(registry: OpenAPIRegistry): void {
  registry.register("ErrorResponse", errorResponseSchema);
}
