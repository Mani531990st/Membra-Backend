import type { ResponseConfig } from "@asteasolutions/zod-to-openapi";

import { errorResponseSchema } from "./components/errors";

type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 429 | 500;

const errorDescriptions: Record<ErrorStatus, string> = {
  400: "Validation Error",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  429: "Too Many Requests",
  500: "Internal Server Error",
};

function errorResponse(status: ErrorStatus): ResponseConfig {
  return {
    description: errorDescriptions[status],
    content: {
      "application/json": {
        schema: errorResponseSchema,
      },
    },
  };
}

/**
 * Reusable error responses matching `toHttpError` / AppError status codes.
 * Spread into `registerPath({ responses: { ...standardErrorResponses() } })`.
 */
export function standardErrorResponses(
  statuses: ErrorStatus[] = [400, 401, 403, 404, 409, 500],
): Record<string, ResponseConfig> {
  const responses: Record<string, ResponseConfig> = {};
  for (const status of statuses) {
    responses[String(status)] = errorResponse(status);
  }
  return responses;
}
