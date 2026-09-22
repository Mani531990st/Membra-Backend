-- Align user contact boolean columns with is_* convention
-- (phones, emails, addresses, aliases).

ALTER TABLE "app"."user_phone_numbers" RENAME COLUMN "primary" TO "is_primary";--> statement-breakpoint
ALTER TABLE "app"."user_phone_numbers" RENAME COLUMN "active" TO "is_active";--> statement-breakpoint
ALTER TABLE "app"."user_emails" RENAME COLUMN "primary" TO "is_primary";--> statement-breakpoint
ALTER TABLE "app"."user_emails" RENAME COLUMN "active" TO "is_active";--> statement-breakpoint
ALTER TABLE "app"."user_addresses" RENAME COLUMN "primary" TO "is_primary";--> statement-breakpoint
ALTER TABLE "app"."user_addresses" RENAME COLUMN "active" TO "is_active";--> statement-breakpoint
ALTER TABLE "app"."user_aliases" RENAME COLUMN "primary" TO "is_primary";--> statement-breakpoint
ALTER TABLE "app"."user_aliases" RENAME COLUMN "active" TO "is_active";
