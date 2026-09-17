-- Keep the lowest-id primary per club; demote the rest before enforcing uniqueness.
UPDATE "app"."club_addresses" AS ca
SET "primary" = false,
    "updated_at" = CURRENT_TIMESTAMP
FROM (
	SELECT "id"
	FROM (
		SELECT
			"id",
			ROW_NUMBER() OVER (PARTITION BY "club_id" ORDER BY "id") AS rn
		FROM "app"."club_addresses"
		WHERE "primary" IS TRUE
	) ranked
	WHERE rn > 1
) dupes
WHERE ca."id" = dupes."id";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "club_addresses_club_id_idx" ON "app"."club_addresses" USING btree ("club_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "club_addresses_one_primary_per_club" ON "app"."club_addresses" ("club_id") WHERE "primary" IS TRUE;
