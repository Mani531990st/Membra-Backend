import { z } from "@/shared/validation/zod";

export const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, "countryCode must be a 2-letter ISO code")
  .openapi({ example: "DK" });

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "establishedDate must be YYYY-MM-DD")
  .openapi({ example: "2020-05-04" });

export const ClubLanguageInputSchema = z
  .object({
    languageId: z.string().trim().min(1).max(15).openapi({
      example: "da",
      description: "Language id from GET /api/clubs/languages",
    }),
    rank: z.number().int().min(1).max(20).openapi({
      example: 1,
      description: "1 = primary language; ranks must be unique per club",
    }),
  })
  .openapi("ClubLanguageInput");

export const ClubAddressFieldsSchema = z.object({
  streetName: z.string().trim().min(1).max(60),
  streetNumber: z.string().trim().min(1).max(20),
  zip: z.string().trim().min(1).max(14),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().max(100).optional().nullable(),
  name: z.string().trim().min(1).max(60),
  shortName: z.string().trim().min(1).max(20),
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

/** Address fields on create-club; `primary` is ignored — first entry becomes primary. */
export const CreateClubAddressInputSchema = ClubAddressFieldsSchema.omit({
  primary: true,
})
  .extend({
    primary: z.boolean().optional().openapi({
      description:
        "Optional and ignored on create-club; the first address is always primary",
    }),
  })
  .openapi("CreateClubAddressInput");

export const CreateClubSchema = z
  .object({
    name: z.string().trim().min(1).max(255).openapi({ example: "Example Club" }),
    shortName: z.string().trim().min(1).max(10).openapi({ example: "ExC" }),
    establishedDate: isoDateSchema.optional().nullable(),
    active: z.boolean().optional().default(true).openapi({ example: true }),
    countryCode: countryCodeSchema,
    activityIds: z
      .array(z.number().int().positive())
      .default([])
      .openapi({
        example: [1, 2],
        description: "Activity IDs from GET /api/reference/activities",
      }),
    languages: z
      .array(ClubLanguageInputSchema)
      .default([])
      .openapi({
        example: [
          { languageId: "da", rank: 1 },
          { languageId: "en-US", rank: 2 },
        ],
        description:
          "Club languages with rank; if non-empty, exactly one entry must have rank 1 (primary)",
      }),
    addresses: z
      .array(CreateClubAddressInputSchema)
      .default([])
      .openapi({
        example: [
          {
            streetName: "Lyngbyvej",
            streetNumber: "1",
            zip: "2100",
            city: "Copenhagen",
            region: null,
            name: "Main hall",
            shortName: "MH",
            directions: null,
            active: true,
          },
        ],
        description:
          "Optional club addresses. `primary` is optional/ignored; the first address becomes primary and the rest are non-primary.",
      }),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.activityIds).size !== value.activityIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "activityIds must be unique",
        path: ["activityIds"],
      });
    }

    if (value.languages.length > 0) {
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
      const languageIds = value.languages.map((entry) => entry.languageId);
      if (new Set(languageIds).size !== languageIds.length) {
        ctx.addIssue({
          code: "custom",
          message: "languageId values must be unique",
          path: ["languages"],
        });
      }
    }

    if (value.addresses.length > 0 && value.addresses[0]?.active === false) {
      ctx.addIssue({
        code: "custom",
        message: "first address becomes primary and cannot be inactive",
        path: ["addresses", 0, "active"],
      });
    }
  })
  .openapi("CreateClubRequest", {
    example: {
      name: "Example Club",
      shortName: "ExC",
      establishedDate: "2020-05-04",
      active: true,
      countryCode: "DK",
      activityIds: [1, 2],
      languages: [
        { languageId: "da", rank: 1 },
        { languageId: "en-US", rank: 2 },
      ],
      addresses: [
        {
          streetName: "Lyngbyvej",
          streetNumber: "1",
          zip: "2100",
          city: "Copenhagen",
          name: "Main hall",
          shortName: "MH",
          active: true,
        },
      ],
    },
  });

export const UpdateClubSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    shortName: z.string().trim().min(1).max(10).optional(),
    establishedDate: isoDateSchema.nullable().optional(),
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
          { languageId: "da", rank: 1 },
          { languageId: "en-US", rank: 2 },
        ],
        description:
          "Replaces the club's languages when provided; if non-empty, one entry must have rank 1",
      }),
  })
  .superRefine((value, ctx) => {
    if (
      value.activityIds !== undefined &&
      new Set(value.activityIds).size !== value.activityIds.length
    ) {
      ctx.addIssue({
        code: "custom",
        message: "activityIds must be unique",
        path: ["activityIds"],
      });
    }

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
    const languageIds = value.languages.map((entry) => entry.languageId);
    if (new Set(languageIds).size !== languageIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "languageId values must be unique",
        path: ["languages"],
      });
    }
  })
  .openapi("UpdateClubRequest");

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
    name: z.string(),
    shortName: z.string(),
    directions: z.string().nullable(),
    primary: z.boolean(),
    active: z.boolean().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("ClubAddressResponse");

export const ClubLanguageResponseSchema = z
  .object({
    languageId: z.string(),
    name: z.string(),
    rank: z.number().int(),
  })
  .openapi("ClubLanguageResponse");

export const ClubActivityResponseSchema = z
  .object({
    id: z.number().int(),
    activity: z.string(),
  })
  .openapi("ClubActivityResponse");

export const ClubDetailResponseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    shortName: z.string(),
    establishedDate: z.string().nullable(),
    active: z.boolean(),
    countryCode: z.string(),
    activities: z.array(ClubActivityResponseSchema),
    languages: z.array(ClubLanguageResponseSchema),
    addresses: z.array(ClubAddressResponseSchema),
    adminCount: z.number().int().nonnegative(),
    avatar: z
      .string()
      .url()
      .nullable()
      .openapi({ description: "Signed URL for avatar2 (96×96), or null" }),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("ClubDetailResponse");

export const ClubSummaryResponseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    shortName: z.string(),
    establishedDate: z.string().nullable(),
    active: z.boolean(),
    countryCode: z.string(),
    adminCount: z.number().int().nonnegative(),
    avatar: z
      .string()
      .url()
      .nullable()
      .openapi({ description: "Signed URL for avatar2 (96×96), or null" }),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("ClubSummaryResponse");

export const AdminClubsResponseSchema = z
  .object({
    clubs: z.array(ClubSummaryResponseSchema),
  })
  .openapi("AdminClubsResponse");

export const LanguageCatalogItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    active: z.boolean(),
  })
  .openapi("LanguageCatalogItem");

export const LanguagesResponseSchema = z
  .object({
    languages: z.array(LanguageCatalogItemSchema),
  })
  .openapi("LanguagesResponse");

function refineMemberBooking(
  value: {
    canMemberBook?: boolean | null;
    memberReqToBook?: number | null;
  },
  ctx: z.RefinementCtx,
): void {
  if (value.canMemberBook === true && value.memberReqToBook == null) {
    ctx.addIssue({
      code: "custom",
      message: "memberReqToBook is required when canMemberBook is true",
      path: ["memberReqToBook"],
    });
  }
}

export const CreateLocationFieldsSchema = z.object({
  name: z.string().trim().min(1).max(60).openapi({ example: "HH inde" }),
  shortName: z.string().trim().min(1).max(8).openapi({ example: "HH" }),
  parentLocationId: z.number().int().positive().nullable().optional().openapi({
    example: null,
    description: "Parent location in the same club; null for root",
  }),
  directions: z.string().trim().max(255).nullable().optional(),
  clubAddressId: z.number().int().positive().nullable().optional(),
  canMemberBook: z.boolean().nullable().optional().openapi({ example: true }),
  canTeamBook: z.boolean().openapi({ example: true }),
  memberReqToBook: z
    .number()
    .int()
    .min(1)
    .max(30)
    .nullable()
    .optional()
    .openapi({ example: 4 }),
  public: z.boolean().openapi({ example: false }),
  canFriendshipClubBook: z.boolean().openapi({ example: true }),
  active: z.boolean().optional().default(true),
});

export const CreateLocationSchema = CreateLocationFieldsSchema.superRefine(
  refineMemberBooking,
).openapi("CreateLocationRequest");

export const UpdateLocationSchema = CreateLocationFieldsSchema.partial()
  .superRefine(refineMemberBooking)
  .openapi("UpdateLocationRequest");

export const ClubLocationIdParamSchema = z
  .object({
    clubId: z.coerce.number().int().positive(),
    locationId: z.coerce.number().int().positive(),
  })
  .openapi("ClubLocationIdParam");

export const LocationResponseSchema = z
  .object({
    id: z.number().int(),
    clubId: z.number().int(),
    name: z.string(),
    shortName: z.string(),
    shownName: z.string(),
    parentLocationId: z.number().int().nullable(),
    directions: z.string().nullable(),
    clubAddressId: z.number().int().nullable(),
    canMemberBook: z.boolean().nullable(),
    canTeamBook: z.boolean(),
    memberReqToBook: z.number().int().nullable(),
    public: z.boolean(),
    canFriendshipClubBook: z.boolean(),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("LocationResponse");

export const LocationsListResponseSchema = z
  .object({
    locations: z.array(LocationResponseSchema),
  })
  .openapi("LocationsListResponse");

export type CreateClubInput = z.infer<typeof CreateClubSchema>;
export type UpdateClubInput = z.infer<typeof UpdateClubSchema>;
export type ClubAddressBody = z.infer<typeof ClubAddressBodySchema>;
export type UpdateClubAddressInput = z.infer<typeof UpdateClubAddressSchema>;
export type CreateLocationInput = z.infer<typeof CreateLocationSchema>;
export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>;
