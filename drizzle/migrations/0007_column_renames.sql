-- Column renames and additions (opaque naming cleanup)
-- Prefer RENAME over drop/recreate to preserve data.

ALTER TABLE "app"."activities" RENAME COLUMN "sn" TO "short_name";--> statement-breakpoint
ALTER TABLE "app"."activities" RENAME CONSTRAINT "activities_sn_key" TO "activities_short_name_key";--> statement-breakpoint

ALTER TABLE "app"."club_addresses" RENAME COLUMN "short" TO "short_name";--> statement-breakpoint

ALTER TABLE "app"."club_age_groups" RENAME COLUMN "sn" TO "short_name";--> statement-breakpoint

ALTER TABLE "app"."club_emails" RENAME COLUMN "sorting_order" TO "sort";--> statement-breakpoint

ALTER TABLE "app"."club_questionnaires" RENAME COLUMN "save" TO "retention_days";--> statement-breakpoint
ALTER TABLE "app"."club_questionnaires" DROP CONSTRAINT "club_questionnaire_save_check";--> statement-breakpoint
ALTER TABLE "app"."club_questionnaires" ADD CONSTRAINT "club_questionnaire_retention_days_check" CHECK ((retention_days > 0) AND (retention_days <= 999));--> statement-breakpoint

ALTER TABLE "app"."clubs" RENAME COLUMN "sn" TO "short_name";--> statement-breakpoint
ALTER TABLE "app"."clubs" RENAME COLUMN "date" TO "established_date";--> statement-breakpoint
ALTER TABLE "app"."clubs" RENAME CONSTRAINT "clubs_sn_key" TO "clubs_short_name_key";--> statement-breakpoint

ALTER TABLE "app"."location_groups" RENAME COLUMN "sn" TO "short_name";--> statement-breakpoint
ALTER TABLE "app"."location_groups" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint

ALTER TABLE "app"."locations" DROP CONSTRAINT "locations_mbr_book_no_mbr_check";--> statement-breakpoint
ALTER TABLE "app"."locations" DROP CONSTRAINT "locations_no_mbr_check";--> statement-breakpoint
ALTER TABLE "app"."locations" RENAME COLUMN "sn" TO "short_name";--> statement-breakpoint
ALTER TABLE "app"."locations" RENAME COLUMN "mbr_book" TO "can_member_book";--> statement-breakpoint
ALTER TABLE "app"."locations" RENAME COLUMN "t_book" TO "can_team_book";--> statement-breakpoint
ALTER TABLE "app"."locations" RENAME COLUMN "no_mbr" TO "member_req_to_book";--> statement-breakpoint
ALTER TABLE "app"."locations" RENAME COLUMN "pub" TO "public";--> statement-breakpoint
ALTER TABLE "app"."locations" RENAME COLUMN "fc" TO "can_friendship_club_book";--> statement-breakpoint
ALTER TABLE "app"."locations" ADD CONSTRAINT "locations_can_member_book_member_req_to_book_check" CHECK ((can_member_book IS NOT TRUE) OR (member_req_to_book IS NOT NULL));--> statement-breakpoint
ALTER TABLE "app"."locations" ADD CONSTRAINT "locations_member_req_to_book_check" CHECK ((member_req_to_book > 0) AND (member_req_to_book <= 30));--> statement-breakpoint

ALTER TABLE "app"."users" RENAME COLUMN "gender" TO "gender_id";--> statement-breakpoint
ALTER TABLE "app"."users" RENAME CONSTRAINT "users_gender_fkey" TO "users_gender_id_fkey";--> statement-breakpoint
ALTER INDEX "app"."users_gender_idx" RENAME TO "users_gender_id_idx";--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN "active" boolean DEFAULT true NOT NULL;
