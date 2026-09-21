-- Rename phone dialing-code columns for clarity (distinct from clubs.country_code ISO).

ALTER TABLE "app"."club_phone_numbers" RENAME COLUMN "country_code" TO "phone_country_code";--> statement-breakpoint
ALTER TABLE "app"."club_phone_numbers" DROP CONSTRAINT "club_telephone_country_code_check";--> statement-breakpoint
ALTER TABLE "app"."club_phone_numbers" ADD CONSTRAINT "club_telephone_phone_country_code_check" CHECK ((phone_country_code > 0) AND (phone_country_code <= 999));--> statement-breakpoint

ALTER TABLE "app"."user_phone_numbers" RENAME COLUMN "country_code" TO "phone_country_code";--> statement-breakpoint
ALTER TABLE "app"."user_phone_numbers" RENAME CONSTRAINT "user_phone_numbers_country_code_phone_number_unique" TO "user_phone_numbers_phone_country_code_phone_number_unique";--> statement-breakpoint
ALTER TABLE "app"."user_phone_numbers" DROP CONSTRAINT "phone_check";--> statement-breakpoint
ALTER TABLE "app"."user_phone_numbers" DROP CONSTRAINT "phone_country_code_check";--> statement-breakpoint
ALTER TABLE "app"."user_phone_numbers" ADD CONSTRAINT "phone_check" CHECK ((phone_country_code IS NULL) OR (phone_number IS NULL) OR ((length((phone_country_code)::text) + length((phone_number)::text)) <= 14));--> statement-breakpoint
ALTER TABLE "app"."user_phone_numbers" ADD CONSTRAINT "phone_country_code_check" CHECK ((phone_country_code > 0) AND (phone_country_code <= 9999));
