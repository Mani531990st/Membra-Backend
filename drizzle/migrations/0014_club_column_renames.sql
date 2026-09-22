-- Club-side column renames to is_* / clearer booking names.
-- Keep API JS property names via Drizzle aliases in schema.ts.

-- clubs
ALTER TABLE "app"."clubs" RENAME COLUMN "active" TO "is_active";--> statement-breakpoint

-- club_phone_numbers
ALTER TABLE "app"."club_phone_numbers" RENAME COLUMN "primary" TO "is_primary";--> statement-breakpoint
ALTER TABLE "app"."club_phone_numbers" RENAME COLUMN "active" TO "is_active";--> statement-breakpoint

-- club_emails
ALTER TABLE "app"."club_emails" RENAME COLUMN "sort" TO "sort_order";--> statement-breakpoint
ALTER TABLE "app"."club_emails" RENAME COLUMN "primary" TO "is_primary";--> statement-breakpoint
ALTER TABLE "app"."club_emails" RENAME COLUMN "active" TO "is_active";--> statement-breakpoint

-- club_addresses (drop dependent index/check first)
DROP INDEX IF EXISTS "app"."club_addresses_one_primary_per_club";--> statement-breakpoint
ALTER TABLE "app"."club_addresses" DROP CONSTRAINT IF EXISTS "club_address_primary_active_check";--> statement-breakpoint
ALTER TABLE "app"."club_addresses" RENAME COLUMN "primary" TO "is_primary";--> statement-breakpoint
ALTER TABLE "app"."club_addresses" RENAME COLUMN "active" TO "is_active";--> statement-breakpoint
CREATE UNIQUE INDEX "club_addresses_one_primary_per_club" ON "app"."club_addresses" ("club_id") WHERE "is_primary" IS TRUE;--> statement-breakpoint
ALTER TABLE "app"."club_addresses" ADD CONSTRAINT "club_address_primary_active_check" CHECK (("is_active" IS DISTINCT FROM false) OR ("is_primary" IS DISTINCT FROM true));--> statement-breakpoint

-- club_waitlists
ALTER TABLE "app"."club_waitlists" RENAME COLUMN "active" TO "is_active";--> statement-breakpoint

-- locations (drop dependent checks first)
ALTER TABLE "app"."locations" DROP CONSTRAINT IF EXISTS "locations_can_member_book_member_req_to_book_check";--> statement-breakpoint
ALTER TABLE "app"."locations" DROP CONSTRAINT IF EXISTS "locations_member_req_to_book_check";--> statement-breakpoint
ALTER TABLE "app"."locations" RENAME COLUMN "member_req_to_book" TO "min_members_required";--> statement-breakpoint
ALTER TABLE "app"."locations" RENAME COLUMN "public" TO "can_public_book";--> statement-breakpoint
ALTER TABLE "app"."locations" RENAME COLUMN "active" TO "is_active";--> statement-breakpoint
ALTER TABLE "app"."locations" ADD CONSTRAINT "locations_can_member_book_min_members_required_check" CHECK ((can_member_book IS NOT TRUE) OR (min_members_required IS NOT NULL));--> statement-breakpoint
ALTER TABLE "app"."locations" ADD CONSTRAINT "locations_min_members_required_check" CHECK ((min_members_required > 0) AND (min_members_required <= 30));
