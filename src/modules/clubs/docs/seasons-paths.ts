import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { standardErrorResponses } from "@/docs/openapi";
import { z } from "@/shared/validation/zod";

import {
  CreateSeasonSchema,
  SeasonResponseSchema,
  SeasonsListResponseSchema,
  UpdateSeasonSchema,
} from "../schemas/seasons.schema";

const CLUB_SEASONS_TAG = "Club Seasons";

export function registerSeasonsDocs(registry: OpenAPIRegistry): void {
  registry.register("CreateSeasonRequest", CreateSeasonSchema);
  registry.register("UpdateSeasonRequest", UpdateSeasonSchema);
  registry.register("SeasonResponse", SeasonResponseSchema);
  registry.register("SeasonsListResponse", SeasonsListResponseSchema);

  registry.registerPath({
    method: "get",
    path: "/api/clubs/{clubId}/seasons",
    tags: [CLUB_SEASONS_TAG],
    summary: "List club seasons",
    description:
      "Returns seasons for the club ordered by seasonStart then id. Member/admin only.",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
      }),
    },
    responses: {
      200: {
        description: "Seasons list",
        content: {
          "application/json": { schema: SeasonsListResponseSchema },
        },
      },
      ...standardErrorResponses([401, 404, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/clubs/{clubId}/seasons",
    tags: [CLUB_SEASONS_TAG],
    summary: "Create club season",
    description:
      "Creates a season. shortName must be unique within the club. seasonEnd must be on or after seasonStart. Admin only.",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
      }),
      body: {
        required: true,
        content: { "application/json": { schema: CreateSeasonSchema } },
      },
    },
    responses: {
      201: {
        description: "Season created",
        content: {
          "application/json": { schema: SeasonResponseSchema },
        },
      },
      ...standardErrorResponses([400, 401, 403, 404, 409, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/clubs/{clubId}/seasons/{seasonId}",
    tags: [CLUB_SEASONS_TAG],
    summary: "Get club season",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
        seasonId: z.coerce.number().int().positive(),
      }),
    },
    responses: {
      200: {
        description: "Season detail",
        content: {
          "application/json": { schema: SeasonResponseSchema },
        },
      },
      ...standardErrorResponses([401, 404, 500]),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/clubs/{clubId}/seasons/{seasonId}",
    tags: [CLUB_SEASONS_TAG],
    summary: "Update club season",
    description:
      "Updates a season. Soft-off via active. shortName uniqueness and date range are enforced. Admin only.",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
        seasonId: z.coerce.number().int().positive(),
      }),
      body: {
        required: true,
        content: { "application/json": { schema: UpdateSeasonSchema } },
      },
    },
    responses: {
      200: {
        description: "Season updated",
        content: {
          "application/json": { schema: SeasonResponseSchema },
        },
      },
      ...standardErrorResponses([400, 401, 403, 404, 409, 500]),
    },
  });
}
