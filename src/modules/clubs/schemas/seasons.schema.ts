import { z } from "@/shared/validation/zod";

const seasonDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD")
  .openapi({ example: "2026-05-01" });

function refineSeasonRange(
  value: { seasonStart?: string; seasonEnd?: string },
  ctx: z.RefinementCtx,
): void {
  if (
    value.seasonStart !== undefined &&
    value.seasonEnd !== undefined &&
    value.seasonEnd < value.seasonStart
  ) {
    ctx.addIssue({
      code: "custom",
      message: "seasonEnd must be on or after seasonStart",
      path: ["seasonEnd"],
    });
  }
}

export const CreateSeasonSchema = z
  .object({
    name: z.string().trim().min(1).max(30).openapi({ example: "Sommer 26" }),
    shortName: z.string().trim().min(1).max(8).openapi({ example: "s26" }),
    seasonStart: seasonDateSchema,
    seasonEnd: seasonDateSchema,
    forTeams: z.boolean().openapi({ example: true }),
    forLocations: z.boolean().openapi({ example: false }),
    active: z.boolean().optional().default(true).openapi({ example: true }),
  })
  .superRefine(refineSeasonRange)
  .openapi("CreateSeasonRequest");

export const UpdateSeasonSchema = z
  .object({
    name: z.string().trim().min(1).max(30).optional(),
    shortName: z.string().trim().min(1).max(8).optional(),
    seasonStart: seasonDateSchema.optional(),
    seasonEnd: seasonDateSchema.optional(),
    forTeams: z.boolean().optional(),
    forLocations: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .superRefine(refineSeasonRange)
  .openapi("UpdateSeasonRequest");

export const SeasonResponseSchema = z
  .object({
    id: z.number().int(),
    clubId: z.number().int(),
    name: z.string(),
    shortName: z.string(),
    seasonStart: z.string(),
    seasonEnd: z.string(),
    forTeams: z.boolean(),
    forLocations: z.boolean(),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("SeasonResponse");

export const SeasonsListResponseSchema = z
  .object({
    seasons: z.array(SeasonResponseSchema),
  })
  .openapi("SeasonsListResponse");

export const ClubSeasonIdParamSchema = z
  .object({
    clubId: z.coerce.number().int().positive(),
    seasonId: z.coerce.number().int().positive(),
  })
  .openapi("ClubSeasonIdParam");

export type CreateSeasonInput = z.infer<typeof CreateSeasonSchema>;
export type UpdateSeasonInput = z.infer<typeof UpdateSeasonSchema>;
