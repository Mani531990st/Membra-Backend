# Database schema — tables and columns

Source of truth: [`src/db/schema/schema.ts`](../src/db/schema/schema.ts)  
Schema: `app`  
Enum: `app.gender_type` — `'male' | 'female' | 'others'`

Column names below are the **SQL / Postgres** names (snake_case where defined).  
Nullable is marked with `NULL`; otherwise `NOT NULL`.

---

## Table index

1. [activities](#activities)
2. [auth_sessions](#auth_sessions)
3. [club_activities](#club_activities)
4. [club_addresses](#club_addresses)
5. [club_admins](#club_admins)
6. [club_age_groups](#club_age_groups)
7. [club_avatars](#club_avatars)
8. [club_emails](#club_emails)
9. [club_languages](#club_languages)
10. [club_phone_numbers](#club_phone_numbers)
11. [club_questionnaire_details](#club_questionnaire_details)
12. [club_questionnaires](#club_questionnaires)
13. [club_waitlists](#club_waitlists)
14. [clubs](#clubs)
15. [genders](#genders)
16. [languages](#languages)
17. [location_groups](#location_groups)
18. [location_relations](#location_relations)
19. [locations](#locations)
20. [password_reset_tokens](#password_reset_tokens)
21. [user_addresses](#user_addresses)
22. [user_aliases](#user_aliases)
23. [user_avatars](#user_avatars)
24. [user_credentials](#user_credentials)
25. [user_emails](#user_emails)
26. [user_phone_numbers](#user_phone_numbers)
27. [user_security_numbers](#user_security_numbers)
28. [users](#users)

---

## activities

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| name | varchar(80) | NOT NULL |
| sn | varchar(10) | NOT NULL, UNIQUE |                         #short_name
| active | boolean | NOT NULL, default true |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## auth_sessions

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default uuidv7() |
| user_id | uuid | NOT NULL, FK → users.uuid |
| token_hash | text | NOT NULL, UNIQUE |
| expires_at | timestamptz | NOT NULL |
| revoked_at | timestamptz | NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## club_activities

| Column | Type | Notes |
|--------|------|-------|
| club_id | bigint | PK (composite), FK → clubs.id |
| activity_id | bigint | PK (composite), FK → activities.id |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## club_addresses

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| street_name | varchar(60) | NOT NULL |
| street_number | varchar(20) | NOT NULL |
| zip | varchar(14) | NOT NULL |
| city | varchar(100) | NOT NULL |
| region | varchar(100) | NULL |
| country_id | bigint | NULL |
| name | varchar(60) | NOT NULL |
| short | varchar(20) | NOT NULL |
| directions | varchar(255) | NULL |
| primary | boolean | NOT NULL, default false |
| active | boolean | NULL, default true |
| club_id | bigint | NOT NULL, FK → clubs.id |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## club_admins

| Column | Type | Notes |
|--------|------|-------|
| club_id | bigint | PK (composite), FK → clubs.id |
| user_id | uuid | PK (composite), FK → users.uuid |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## club_age_groups

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| club_id | bigint | NOT NULL, FK → clubs.id |
| name | varchar(30) | NOT NULL |
| sn | varchar(8) | NOT NULL |
| age_min | smallint | NULL |
| age_max | smallint | NULL |
| active | boolean | NOT NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## club_avatars

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| club_id | bigint | NOT NULL, UNIQUE, FK → clubs.id |
| avatar1 | text | NULL |
| avatar2 | text | NULL |
| avatar3 | text | NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## club_emails

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| club_id | bigint | NOT NULL, FK → clubs.id |
| email | varchar(255) | NULL |
| description | varchar(30) | NULL |
| sorting_order | smallint | NULL |
| primary | boolean | NULL |
| active | boolean | NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## club_languages

| Column | Type | Notes |
|--------|------|-------|
| club_id | bigint | PK (composite), FK → clubs.id |
| language_id | bigint | PK (composite), FK → languages.id |
| rank | smallint | NOT NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## club_phone_numbers

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| club_id | bigint | NOT NULL, FK → clubs.id |
| country_code | smallint | NULL |
| phone_number | varchar(14) | NULL |
| description | varchar(20) | NULL |
| primary | boolean | NULL |
| active | boolean | NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## club_questionnaire_details

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| questionnaire_id | bigint | NOT NULL, FK → club_questionnaires.id |
| language_id | bigint | NOT NULL |
| sort | smallint | NOT NULL |
| question | varchar(254) | NOT NULL |
| active | boolean | NOT NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## club_questionnaires

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| club_id | bigint | NOT NULL, FK → clubs.id |
| questionnaire_name | varchar(60) | NOT NULL |
| multi_linguistic | boolean | NOT NULL |
| language_id | bigint | NULL |
| save | smallint | NOT NULL, default 90 |
| active | boolean | NOT NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## club_waitlists

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| club_id | bigint | NOT NULL, FK → clubs.id |
| waitlist | varchar(30) | NOT NULL |
| gender_id | bigint | NULL, FK → genders.id |
| questionary_id | bigint | NULL, FK → club_questionnaires.id |
| active | boolean | NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## clubs

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| name | varchar(255) | NOT NULL |
| sn | varchar(10) | NOT NULL, UNIQUE |
| date | date | NULL |
| active | boolean | NOT NULL, default true |
| country_code | varchar(2) | NOT NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## genders

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| gender | app.gender_type | NOT NULL, UNIQUE (`male` \| `female` \| `others`) |

---

## languages

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| code | varchar(15) | NOT NULL, UNIQUE |
| name | varchar(80) | NOT NULL |
| active | boolean | NOT NULL, default true |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## location_groups

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| club_id | bigint | NOT NULL, FK → clubs.id |
| name | varchar(80) | NOT NULL |
| sn | varchar(10) | NOT NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## location_relations

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| location_group_id | bigint | NOT NULL, FK → location_groups.id |
| location_id | bigint | NOT NULL, FK → locations.id |
| active | boolean | NOT NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## locations

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| club_id | bigint | NOT NULL, FK → clubs.id |
| name | varchar(60) | NOT NULL |
| directions | varchar(255) | NULL |
| sn | varchar(8) | NOT NULL |
| club_address_id | bigint | NULL, FK → club_addresses.id |
| mbr_book | boolean | NULL |
| t_book | boolean | NOT NULL |
| no_mbr | smallint | NULL |
| pub | boolean | NOT NULL |
| fc | boolean | NOT NULL |
| active | boolean | NOT NULL |
| parent_location_id | bigint | NULL, FK → locations.id |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## password_reset_tokens

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| user_id | uuid | NOT NULL, FK → users.uuid |
| token_hash | text | NOT NULL, UNIQUE |
| expires_at | timestamptz | NOT NULL |
| consumed_at | timestamptz | NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## user_addresses

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| user_id | uuid | NOT NULL, FK → users.uuid |
| street_name | varchar(60) | NOT NULL |
| street_number | varchar(20) | NOT NULL |
| zip | varchar(14) | NOT NULL |
| city | varchar(100) | NOT NULL |
| region | varchar(100) | NULL |
| country_id | uuid | NOT NULL |
| primary | boolean | NOT NULL, default false |
| active | boolean | NOT NULL, default false |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## user_aliases

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| user_id | uuid | NOT NULL, FK → users.uuid |
| alias | varchar(11) | NOT NULL, UNIQUE |
| primary | boolean | NOT NULL, default false |
| active | boolean | NOT NULL, default false |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## user_avatars

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| user_id | uuid | NOT NULL, UNIQUE, FK → users.uuid |
| avatar1 | text | NULL |
| avatar2 | text | NULL |
| avatar3 | text | NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## user_credentials

| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | PK, FK → users.uuid |
| email | varchar(254) | NOT NULL, UNIQUE |
| password_hash | text | NOT NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## user_emails

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| user_id | uuid | NOT NULL, FK → users.uuid |
| email | varchar(254) | NULL, UNIQUE |
| primary | boolean | NULL, default false |
| active | boolean | NULL, default false |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## user_phone_numbers

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| user_id | uuid | NOT NULL, FK → users.uuid |
| country_code | integer | NULL |
| phone_number | varchar(14) | NULL |
| primary | boolean | NULL, default false |
| active | boolean | NULL, default false |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## user_security_numbers

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, identity |
| user_id | uuid | NOT NULL, FK → users.uuid |
| social_security_number | varchar(11) | NULL |
| active | boolean | NOT NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |

---

## users

| Column | Type | Notes |
|--------|------|-------|
| uuid | uuid | PK, default uuidv7() |
| firstname | text | NULL |
| surname | text | NULL |
| nickname | text | NULL |
| dob | date | NULL |
| gender | bigint | NULL, FK → genders.id |
| preferred_lang | varchar(15) | NULL |
| created_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
| updated_at | timestamptz | NOT NULL, default CURRENT_TIMESTAMP |
