import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { standardErrorResponses } from "@/docs/openapi";
import { z } from "@/shared/validation/zod";

import {
  AdminClubsResponseSchema,
  AvatarsResponseSchema,
  ClubAddressBodySchema,
  ClubAddressResponseSchema,
  ClubDetailResponseSchema,
  ClubSummaryResponseSchema,
  CreateClubSchema,
  CreateLocationSchema,
  LanguagesResponseSchema,
  LocationResponseSchema,
  LocationsListResponseSchema,
  UpdateClubAddressSchema,
  UpdateClubSchema,
  UpdateLocationSchema,
} from "../schemas/clubs.schema";

const CLUBS_TAG = "Clubs";

const avatarBinaryField = z.string().openapi({
  type: "string",
  format: "binary",
  description:
    "Single club image as File or Blob (JPEG, PNG, HEIC, HEIF, WebP, or AVIF, max 8 MB). MIME may be omitted or application/octet-stream; format is detected from content. Server creates 384×384, 96×96, and 32×32 AVIF variants.",
});

const UploadClubAvatarsRequestSchema = z
  .object({
    avatar: avatarBinaryField,
  })
  .openapi("UploadClubAvatarsRequest");

const CreateClubMultipartSchema = z
  .object({
    name: z.string().openapi({ example: "Example Club" }),
    shortName: z.string().openapi({ example: "ExC" }),
    establishedDate: z.string().optional().openapi({
      example: "2020-05-04",
      description: "Optional club established date YYYY-MM-DD",
    }),
    active: z.string().optional().openapi({
      example: "true",
      description: "Boolean as string: true/false",
    }),
    countryCode: z.string().openapi({ example: "DK" }),
    activityIds: z.string().optional().openapi({
      example: "[1,2]",
      description:
        "Activity IDs from GET /api/reference/activities. Enter as JSON `[1,2]` or comma-separated `1,2` (no extra quotes around the whole value).",
    }),
    languages: z.string().optional().openapi({
      example: '[{"languageId":"da","rank":1},{"languageId":"en-US","rank":2}]',
      description:
        'Languages as JSON array, e.g. [{"languageId":"da","rank":1}] — do not wrap the whole value in extra quotes.',
    }),
    addresses: z.string().optional().openapi({
      example:
        '[{"streetName":"Lyngbyvej","streetNumber":"1","zip":"2100","city":"Copenhagen","name":"Main hall","shortName":"MH","active":true}]',
      description:
        "Optional addresses as a JSON array. `primary` is optional/ignored — the first address becomes primary and the rest are non-primary. Do not wrap the whole value in extra quotes.",
    }),
    avatar: avatarBinaryField.optional().openapi({
      description:
        "Optional club avatar as File or Blob; MIME may be omitted or application/octet-stream. Omitted leaves avatars null.",
    }),
  })
  .openapi("CreateClubMultipartRequest");

export function registerClubsDocs(registry: OpenAPIRegistry): void {
  registry.register("CreateClubRequest", CreateClubSchema);
  registry.register("UpdateClubRequest", UpdateClubSchema);
  registry.register("ClubAddressRequest", ClubAddressBodySchema);
  registry.register("UpdateClubAddressRequest", UpdateClubAddressSchema);
  registry.register("ClubDetailResponse", ClubDetailResponseSchema);
  registry.register("ClubSummaryResponse", ClubSummaryResponseSchema);
  registry.register("AdminClubsResponse", AdminClubsResponseSchema);
  registry.register("ClubAddressResponse", ClubAddressResponseSchema);
  registry.register("ClubAvatarsResponse", AvatarsResponseSchema);
  registry.register("LanguagesResponse", LanguagesResponseSchema);
  registry.register("UploadClubAvatarsRequest", UploadClubAvatarsRequestSchema);
  registry.register("CreateClubMultipartRequest", CreateClubMultipartSchema);
  registry.register("CreateLocationRequest", CreateLocationSchema);
  registry.register("UpdateLocationRequest", UpdateLocationSchema);
  registry.register("LocationResponse", LocationResponseSchema);
  registry.register("LocationsListResponse", LocationsListResponseSchema);

  registry.registerPath({
    method: "get",
    path: "/api/clubs",
    tags: [CLUBS_TAG],
    summary: "List clubs the current user admins",
    description:
      "Returns summary cards for every club where the authenticated user is in `club_admins` (includes inactive clubs). Ordered by name. Each card includes a single signed `avatar` URL (96×96 / avatar2). Use GET /api/clubs/{clubId} for full detail.",
    security: [{ SessionCookie: [] }],
    responses: {
      200: {
        description: "Admin clubs",
        content: {
          "application/json": { schema: AdminClubsResponseSchema },
        },
      },
      ...standardErrorResponses([401, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/clubs/languages",
    tags: [CLUBS_TAG],
    summary: "List languages catalog",
    security: [{ SessionCookie: [] }],
    responses: {
      200: {
        description: "Active languages",
        content: {
          "application/json": { schema: LanguagesResponseSchema },
        },
      },
      ...standardErrorResponses([401, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/clubs",
    tags: [CLUBS_TAG],
    summary: "Create club",
    description:
      "Any authenticated user can create a club and becomes its first admin. Multipart form: text fields for club data (`activityIds`, `languages`, and `addresses` as JSON strings) plus optional `avatar` File or Blob (three AVIF size variants stored like PUT /avatars; MIME may be omitted or octet-stream).",
    security: [{ SessionCookie: [] }],
    request: {
      body: {
        required: true,
        content: {
          "multipart/form-data": { schema: CreateClubMultipartSchema },
        },
      },
    },
    responses: {
      201: {
        description: "Club created",
        content: {
          "application/json": { schema: ClubDetailResponseSchema },
        },
      },
      ...standardErrorResponses([400, 401, 409, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/clubs/{clubId}",
    tags: [CLUBS_TAG],
    summary: "Get club",
    description:
      "Returns club profile, addresses, activities, languages, admin count, and a single signed `avatar` URL (96×96 / avatar2). Only club members (currently club admins) may read; strangers get 404.",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
      }),
    },
    responses: {
      200: {
        description: "Club detail",
        content: {
          "application/json": { schema: ClubDetailResponseSchema },
        },
      },
      ...standardErrorResponses([401, 404, 500]),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/clubs/{clubId}",
    tags: [CLUBS_TAG],
    summary: "Update club",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
      }),
      body: {
        required: true,
        content: { "application/json": { schema: UpdateClubSchema } },
      },
    },
    responses: {
      200: {
        description: "Club updated",
        content: {
          "application/json": { schema: ClubDetailResponseSchema },
        },
      },
      ...standardErrorResponses([400, 401, 403, 404, 409, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/clubs/{clubId}/addresses",
    tags: [CLUBS_TAG],
    summary: "Add club address",
    description:
      "Admin only. If the club has no primary address yet, this row is forced primary (even when `primary` is false). Setting `primary: true` demotes other primaries. A primary address cannot be inactive.",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
      }),
      body: {
        required: true,
        content: { "application/json": { schema: ClubAddressBodySchema } },
      },
    },
    responses: {
      201: {
        description: "Address created",
        content: {
          "application/json": { schema: ClubAddressResponseSchema },
        },
      },
      ...standardErrorResponses([400, 401, 403, 404, 409, 500]),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/clubs/{clubId}/addresses/{addressId}",
    tags: [CLUBS_TAG],
    summary: "Update club address",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
        addressId: z.coerce.number().int().positive(),
      }),
      body: {
        required: true,
        content: { "application/json": { schema: UpdateClubAddressSchema } },
      },
    },
    responses: {
      200: {
        description: "Address updated",
        content: {
          "application/json": { schema: ClubAddressResponseSchema },
        },
      },
      ...standardErrorResponses([400, 401, 403, 404, 409, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/clubs/{clubId}/addresses/{addressId}/primary",
    tags: [CLUBS_TAG],
    summary: "Make club address primary",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
        addressId: z.coerce.number().int().positive(),
      }),
    },
    responses: {
      200: {
        description: "Address is now primary",
        content: {
          "application/json": { schema: ClubAddressResponseSchema },
        },
      },
      ...standardErrorResponses([401, 403, 404, 409, 500]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/clubs/{clubId}/avatars",
    tags: [CLUBS_TAG],
    summary: "Upload club avatars",
    description:
      "Admin only. Multipart field `avatar` as File or Blob (JPEG, PNG, HEIC, HEIF, WebP, or AVIF). MIME may be omitted or application/octet-stream; format is sniffed from content. Stores three AVIF size variants.",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
      }),
      body: {
        required: true,
        content: {
          "multipart/form-data": { schema: UploadClubAvatarsRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Signed avatar URLs",
        content: {
          "application/json": { schema: AvatarsResponseSchema },
        },
      },
      ...standardErrorResponses([400, 401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/clubs/{clubId}/avatars",
    tags: [CLUBS_TAG],
    summary: "Get club avatars",
    description:
      "Signed GET URLs for club avatar variants. Only club members (currently club admins) may read; strangers get 404.",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
      }),
    },
    responses: {
      200: {
        description: "Signed avatar URLs",
        content: {
          "application/json": { schema: AvatarsResponseSchema },
        },
      },
      ...standardErrorResponses([401, 404, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/clubs/{clubId}/locations",
    tags: [CLUBS_TAG],
    summary: "List club locations",
    description:
      "Returns all locations for the club in depth-first hierarchy order. shownName is the short-name path (e.g. HH.i.JJ). Member/admin only.",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
      }),
    },
    responses: {
      200: {
        description: "Locations in hierarchy order",
        content: {
          "application/json": { schema: LocationsListResponseSchema },
        },
      },
      ...standardErrorResponses([401, 404, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/clubs/{clubId}/locations",
    tags: [CLUBS_TAG],
    summary: "Create club location",
    description:
      "Creates a location. shownName is computed from parent.shownName + shortName (or shortName alone for roots). Admin only.",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
      }),
      body: {
        required: true,
        content: { "application/json": { schema: CreateLocationSchema } },
      },
    },
    responses: {
      201: {
        description: "Location created",
        content: {
          "application/json": { schema: LocationResponseSchema },
        },
      },
      ...standardErrorResponses([400, 401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/clubs/{clubId}/locations/{locationId}",
    tags: [CLUBS_TAG],
    summary: "Get club location",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
        locationId: z.coerce.number().int().positive(),
      }),
    },
    responses: {
      200: {
        description: "Location detail",
        content: {
          "application/json": { schema: LocationResponseSchema },
        },
      },
      ...standardErrorResponses([401, 404, 500]),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/clubs/{clubId}/locations/{locationId}",
    tags: [CLUBS_TAG],
    summary: "Update club location",
    description:
      "Updates a location. Changing shortName or parentLocationId recomputes shownName for this node and all descendants. Admin only.",
    security: [{ SessionCookie: [] }],
    request: {
      params: z.object({
        clubId: z.coerce.number().int().positive(),
        locationId: z.coerce.number().int().positive(),
      }),
      body: {
        required: true,
        content: { "application/json": { schema: UpdateLocationSchema } },
      },
    },
    responses: {
      200: {
        description: "Location updated",
        content: {
          "application/json": { schema: LocationResponseSchema },
        },
      },
      ...standardErrorResponses([400, 401, 403, 404, 500]),
    },
  });
}
