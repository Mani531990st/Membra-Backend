# Frontend API changelog

Breaking field renames and behavior changes for clients.

**Convention:** Postgres columns stay **snake_case**. Public API JSON keys are **camelCase** everywhere.

Live OpenAPI/Swagger remains the source of truth for full schemas.

---

## Quick rename map

| Prior API key | Current API key | Where |
|---------------|-----------------|--------|
| `sn` / `short_name` | `shortName` | Clubs create/update/detail; activities catalog; club activities |
| `established_date` | `establishedDate` | Clubs create/update/detail |
| `country_code` | `countryCode` | Clubs create/update/detail |
| `language_id` | `languageId` | Club languages input + club detail languages |
| `street_name` | `streetName` | Club addresses request + response |
| `street_number` | `streetNumber` | Club addresses request + response |
| `short` / `short_name` (address) | `shortName` | Club addresses request + response |
| `country_id` | `countryId` | Club address response |
| `created_at` / `updated_at` | `createdAt` / `updatedAt` | Club detail + address responses |
| `gender` (enum string) / `gender_id` | `genderId` (number) | Complete-profile request; user object in auth responses |
| `preferred_lang` | `preferredLang` | Complete-profile; SafeUser |
| `session_id` | `sessionId` | Logout request (optional) |

**Unchanged (by design):** `activityIds`, multipart `avatar`, auth `email` / `password`, `profileComplete`, `adminUserIds`, `rememberMe`.

---

## Auth

### `POST /api/users/complete-profile`

| Before | After |
|--------|--------|
| `"gender": "female"` or `"gender_id": 1` | `"genderId": 1` |
| `"preferred_lang": "en"` | `"preferredLang": "en"` |

- `genderId` is a **positive integer** from `GET /api/genders` (`genders[].id`).
- Do **not** send `"male" | "female" | "others"` on this endpoint.

Example:

```json
{
  "firstname": "Ada",
  "surname": "Lovelace",
  "nickname": "Ada",
  "dob": "1990-01-15",
  "genderId": 1,
  "preferredLang": "en"
}
```

### User object (`SafeUser`)

Returned by signup, login, complete-profile, and `GET /api/users/me` (`user`):

| Before | After |
|--------|--------|
| `"gender"` / `"gender_id"` | `"genderId": 1 \| null` |
| `"preferred_lang"` | `"preferredLang": "en" \| null` |

Display label: look up `genderId` in `GET /api/genders` (`{ id, gender }`).

### `POST /api/auth/logout`

| Before | After |
|--------|--------|
| Optional `session_id` | Optional `sessionId` |

Behavior:

- Omit `sessionId` or send `{}` → log out **current** cookie session and clear the session cookie.
- `{ "sessionId": "<uuid>" }` → revoke that session; cookie cleared only if it is the current one.

Use `id` from `GET /api/auth/active-sessions` when logging out another device.

### Unchanged auth endpoints

- `POST /api/auth/signup`, `login`, `forgot-password`, `reset-password`
- `GET /api/genders`, `GET /api/auth/active-sessions`
- `PUT /api/users/avatars` (still multipart field `avatar`)

---

## Clubs

### `POST /api/clubs` (multipart) and `PATCH /api/clubs/:clubId` (JSON)

| Before | After |
|--------|--------|
| `sn` / `short_name` | `shortName` |
| `established_date` | `establishedDate` |
| `country_code` | `countryCode` |
| `languages[].language_id` | `languages[].languageId` |

Still the same:

- `name`, `active`
- `activityIds` (array of numbers; multipart may send JSON string or `1,2`)
- optional `avatar` file on create

Multipart form field names must use camelCase (`shortName`, `establishedDate`, `countryCode`, etc.).

Example JSON body (`PATCH`):

```json
{
  "name": "Example Club",
  "shortName": "ExC",
  "establishedDate": "2020-05-04",
  "active": true,
  "countryCode": "DK",
  "activityIds": [1, 2],
  "languages": [
    { "languageId": 1, "rank": 1 },
    { "languageId": 2, "rank": 2 }
  ]
}
```

### Club detail response

Same renames as above, plus:

| Before | After |
|--------|--------|
| `created_at` / `updated_at` | `createdAt` / `updatedAt` |
| `activities[].short_name` | `activities[].shortName` |
| `languages[].language_id` | `languages[].languageId` |
| nested address fields | see Addresses below |

### `GET /api/clubs/activities`

| Before | After |
|--------|--------|
| `activities[].sn` / `short_name` | `activities[].shortName` |

### `GET /api/clubs/languages`

No field renames (`id`, `code`, `name`, `active`).

---

## Club addresses

### `POST /api/clubs/:clubId/addresses`  
### `PATCH /api/clubs/:clubId/addresses/:addressId`  
### Primary endpoint response

| Before | After |
|--------|--------|
| `street_name` | `streetName` |
| `street_number` | `streetNumber` |
| `short` / `short_name` | `shortName` |
| `country_id` (response) | `countryId` |
| `created_at` / `updated_at` (response) | `createdAt` / `updatedAt` |

Unchanged: `zip`, `city`, `region`, `name`, `directions`, `primary`, `active`.

Example request:

```json
{
  "streetName": "Lyngbyvej",
  "streetNumber": "1",
  "zip": "2100",
  "city": "Copenhagen",
  "region": null,
  "name": "Main hall",
  "shortName": "RP",
  "directions": null,
  "primary": true,
  "active": true
}
```

### Unchanged

- `PUT /api/clubs/:clubId/avatars` (multipart `avatar`)
- `POST …/addresses/:addressId/primary` (no body)

---

## Avatars (no client contract break)

User and club avatar upload/get still return signed URLs in `avatar1` / `avatar2` / `avatar3`.  
Object-storage key layout changed server-side only; clients should keep treating these as opaque URLs.

---

## Migration checklist for frontend

1. Use camelCase for all club/auth JSON keys (`shortName`, `establishedDate`, `countryCode`, `streetName`, …).
2. Complete-profile + user store: use `genderId` (number) and `preferredLang`; resolve gender label via genders catalog.
3. Logout: send `sessionId` if targeting a specific session; otherwise omit.
4. Update TypeScript types / Zod client schemas / form field names (including club create multipart).
5. Re-test club create (multipart), club patch, addresses, complete-profile, me, logout.
