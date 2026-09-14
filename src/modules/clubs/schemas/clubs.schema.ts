import { z } from "@/shared/validation/zod";

export const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, "countryCode must be a 2-letter ISO code")
  .openapi({ example: "DK" });

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
  .openapi({ example: "2020-05-04" });

export const ClubLanguageInputSchema = z
  .object({
    languageId: z.number().int().positive().openapi({
      example: 1,
      description: "ID from GET /api/clubs/languages",
    }),
    rank: z.number().int().min(1).max(20).openapi({
      example: 1,
      description: "1 = primary language; ranks must be unique per club",
    }),
  })
  .openapi("ClubLanguageInput");

export const CreateClubSchema = z
  .object({
    name: z.string().trim().min(1).max(255).openapi({ example: "Example Club" }),
    sn: z.string().trim().min(1).max(10).openapi({ example: "ExC" }),
    date: isoDateSchema.optional().nullable(),
    active: z.boolean().optional().default(true).openapi({ example: true }),
    countryCode: countryCodeSchema,
    activityIds: z
      .array(z.number().int().positive())
      .default([])
      .openapi({
        example: [1, 2],
        description: "Activity IDs from GET /api/clubs/activities",
      }),
    languages: z
      .array(ClubLanguageInputSchema)
      .default([])
      .openapi({
        example: [
          { languageId: 1, rank: 1 },
          { languageId: 2, rank: 2 },
        ],
        description:
          "Club languages with rank; if non-empty, exactly one entry must have rank 1 (primary)",
      }),
  })
  .superRefine((value, ctx) => {
    if (value.languages.length === 0) {
      return;
    }
    if (!value.languages.some((entry) => entry.rank === 1)) {
      ctx.addIssue({
        code: "custom",
        message: "languages must include a primary language with rank 1",
        path: ["languages"],
      });
    }
    const ranks = value.languages.map((entry) => entry.rank);
    if (new Set(ranks).size !== ranks.length) {
      ctx.addIssue({
        code: "custom",
        message: "language ranks must be unique",
        path: ["languages"],
      });
    }
  })
  .openapi("CreateClubRequest", {
    example: {
      name: "Example Club",
      sn: "ExC",
      date: "2020-05-04",
      active: true,
      countryCode: "DK",
      activityIds: [1, 2],
      languages: [
        { languageId: 1, rank: 1 },
        { languageId: 2, rank: 2 },
      ],
    },
  });

export const UpdateClubSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    sn: z.string().trim().min(1).max(10).optional(),
    date: isoDateSchema.nullable().optional(),
    active: z.boolean().optional(),
    countryCode: countryCodeSchema.optional(),
    activityIds: z
      .array(z.number().int().positive())
      .optional()
      .openapi({
        example: [1],
        description: "Replaces the club's activities when provided",
      }),
    languages: z
      .array(ClubLanguageInputSchema)
      .optional()
      .openapi({
        example: [
          { languageId: 1, rank: 1 },
          { languageId: 2, rank: 2 },
        ],
        description:
          "Replaces the club's languages when provided; if non-empty, one entry must have rank 1",
      }),
  })
  .superRefine((value, ctx) => {
    if (value.languages === undefined) {
      return;
    }
    if (value.languages.length > 0 && !value.languages.some((e) => e.rank === 1)) {
      ctx.addIssue({
        code: "custom",
        message: "languages must include a primary language with rank 1",
        path: ["languages"],
      });
    }
    const ranks = value.languages.map((entry) => entry.rank);
    if (new Set(ranks).size !== ranks.length) {
      ctx.addIssue({
        code: "custom",
        message: "language ranks must be unique",
        path: ["languages"],
      });
    }
  })
  .openapi("UpdateClubRequest");

export const ClubAddressFieldsSchema = z.object({
  streetName: z.string().trim().min(1).max(60),
  streetNumber: z.string().trim().min(1).max(20),
  zip: z.string().trim().min(1).max(14),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().max(100).optional().nullable(),
  name: z.string().trim().min(1).max(60),
  short: z.string().trim().min(1).max(20),
  directions: z.string().trim().max(255).optional().nullable(),
  primary: z.boolean(),
  active: z.boolean().optional().default(true),
});

function refinePrimaryActive(
  value: { primary?: boolean; active?: boolean },
  ctx: z.RefinementCtx,
): void {
  if (value.primary === true && value.active === false) {
    ctx.addIssue({
      code: "custom",
      message: "primary address cannot be inactive",
      path: ["primary"],
    });
  }
}

export const ClubAddressBodySchema = ClubAddressFieldsSchema.superRefine(
  refinePrimaryActive,
).openapi("ClubAddressRequest");

export const UpdateClubAddressSchema = ClubAddressFieldsSchema.partial()
  .superRefine(refinePrimaryActive)
  .openapi("UpdateClubAddressRequest");

export const ClubIdParamSchema = z
  .object({
    clubId: z.coerce.number().int().positive(),
  })
  .openapi("ClubIdParam");

export const ClubAddressIdParamSchema = z
  .object({
    clubId: z.coerce.number().int().positive(),
    addressId: z.coerce.number().int().positive(),
  })
  .openapi("ClubAddressIdParam");

export const AvatarsResponseSchema = z
  .object({
    avatar1: z.string().url().nullable(),
    avatar2: z.string().url().nullable(),
    avatar3: z.string().url().nullable(),
  })
  .openapi("ClubAvatarsResponse");

export const ClubAddressResponseSchema = z
  .object({
    id: z.number().int(),
    streetName: z.string(),
    streetNumber: z.string(),
    zip: z.string(),
    city: z.string(),
    region: z.string().nullable(),
    countryId: z.number().int().nullable(),
    name: z.string(),
    short: z.string(),
    directions: z.string().nullable(),
    primary: z.boolean(),
    active: z.boolean().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("ClubAddressResponse");

export const ClubLanguageResponseSchema = z
  .object({
    languageId: z.number().int(),
    code: z.string(),
    name: z.string(),
    rank: z.number().int(),
  })
  .openapi("ClubLanguageResponse");

export const ClubActivityResponseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    sn: z.string(),
  })
  .openapi("ClubActivityResponse");

export const ClubDetailResponseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    sn: z.string(),
    date: z.string().nullable(),
    active: z.boolean(),
    countryCode: z.string(),
    activities: z.array(ClubActivityResponseSchema),
    languages: z.array(ClubLanguageResponseSchema),
    addresses: z.array(ClubAddressResponseSchema),
    adminUserIds: z.array(z.string().uuid()),
    avatars: AvatarsResponseSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("ClubDetailResponse");

export const ActivityCatalogItemSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    sn: z.string(),
    active: z.boolean(),
  })
  .openapi("ActivityCatalogItem");

export const LanguageCatalogItemSchema = z
  .object({
    id: z.number().int(),
    code: z.string(),
    name: z.string(),
    active: z.boolean(),
  })
  .openapi("LanguageCatalogItem");

export const ActivitiesResponseSchema = z
  .object({
    activities: z.array(ActivityCatalogItemSchema),
  })
  .openapi("ActivitiesResponse");

export const LanguagesResponseSchema = z
  .object({
    languages: z.array(LanguageCatalogItemSchema),
  })
  .openapi("LanguagesResponse");

export type CreateClubInput = z.infer<typeof CreateClubSchema>;
export type UpdateClubInput = z.infer<typeof UpdateClubSchema>;
export type ClubAddressBody = z.infer<typeof ClubAddressBodySchema>;
export type UpdateClubAddressInput = z.infer<typeof UpdateClubAddressSchema>;
