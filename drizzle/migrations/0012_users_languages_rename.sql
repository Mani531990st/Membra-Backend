-- Users column renames + languages PK becomes former code (varchar).
-- Remap club_languages / questionnaire language_id before dropping languages.bigint id.

-- 1. Remap club_languages.language_id: bigint -> varchar(code)
ALTER TABLE "app"."club_languages" ADD COLUMN "language_code" varchar(15);--> statement-breakpoint
UPDATE "app"."club_languages" AS cl
SET "language_code" = l."code"
FROM "app"."languages" AS l
WHERE cl."language_id" = l."id";--> statement-breakpoint
ALTER TABLE "app"."club_languages" ALTER COLUMN "language_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."club_languages" DROP CONSTRAINT "club_languages_language_id_fkey";--> statement-breakpoint
ALTER TABLE "app"."club_languages" DROP CONSTRAINT "club_languages_pkey";--> statement-breakpoint
ALTER TABLE "app"."club_languages" DROP COLUMN "language_id";--> statement-breakpoint
ALTER TABLE "app"."club_languages" RENAME COLUMN "language_code" TO "language_id";--> statement-breakpoint

-- 2. Remap questionnaire language_id columns (no FK today; align type to varchar)
-- Postgres forbids subqueries in ALTER COLUMN ... USING, so add/update/drop/rename.
ALTER TABLE "app"."club_questionnaire_details" ADD COLUMN "language_code" varchar(15);--> statement-breakpoint
UPDATE "app"."club_questionnaire_details" AS d
SET "language_code" = l."code"
FROM "app"."languages" AS l
WHERE d."language_id" = l."id";--> statement-breakpoint
ALTER TABLE "app"."club_questionnaire_details" DROP COLUMN "language_id";--> statement-breakpoint
ALTER TABLE "app"."club_questionnaire_details" RENAME COLUMN "language_code" TO "language_id";--> statement-breakpoint
ALTER TABLE "app"."club_questionnaires" ADD COLUMN "language_code" varchar(15);--> statement-breakpoint
UPDATE "app"."club_questionnaires" AS q
SET "language_code" = l."code"
FROM "app"."languages" AS l
WHERE q."language_id" = l."id";--> statement-breakpoint
ALTER TABLE "app"."club_questionnaires" DROP COLUMN "language_id";--> statement-breakpoint
ALTER TABLE "app"."club_questionnaires" RENAME COLUMN "language_code" TO "language_id";--> statement-breakpoint

-- 3. Rebuild languages: code becomes varchar PK id
ALTER TABLE "app"."languages" DROP CONSTRAINT "languages_pkey";--> statement-breakpoint
ALTER TABLE "app"."languages" DROP CONSTRAINT "languages_code_key";--> statement-breakpoint
ALTER TABLE "app"."languages" DROP COLUMN "id";--> statement-breakpoint
DROP SEQUENCE IF EXISTS "app"."languages_id_seq";--> statement-breakpoint
ALTER TABLE "app"."languages" RENAME COLUMN "code" TO "id";--> statement-breakpoint
ALTER TABLE "app"."languages" ADD CONSTRAINT "languages_pkey" PRIMARY KEY ("id");--> statement-breakpoint

-- 4. Restore club_languages PK + FK to languages(id)
ALTER TABLE "app"."club_languages" ADD CONSTRAINT "club_languages_pkey" PRIMARY KEY ("club_id", "language_id");--> statement-breakpoint
ALTER TABLE "app"."club_languages" ADD CONSTRAINT "club_languages_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "app"."languages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- 5. Users renames + preferred_language_id FK
UPDATE "app"."users"
SET "preferred_lang" = NULL
WHERE "preferred_lang" IS NOT NULL
	AND NOT EXISTS (
		SELECT 1 FROM "app"."languages" AS l WHERE l."id" = "preferred_lang"
	);--> statement-breakpoint
ALTER TABLE "app"."users" RENAME COLUMN "firstname" TO "first_name";--> statement-breakpoint
ALTER TABLE "app"."users" RENAME COLUMN "dob" TO "birth_date";--> statement-breakpoint
ALTER TABLE "app"."users" RENAME COLUMN "active" TO "is_active";--> statement-breakpoint
ALTER TABLE "app"."users" RENAME COLUMN "preferred_lang" TO "preferred_language_id";--> statement-breakpoint
ALTER TABLE "app"."users" ADD CONSTRAINT "users_preferred_language_id_fkey" FOREIGN KEY ("preferred_language_id") REFERENCES "app"."languages"("id") ON UPDATE cascade ON DELETE restrict;--> statement-breakpoint
