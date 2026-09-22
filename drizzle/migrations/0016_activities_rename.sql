-- activities: name → activity, drop short_name, active → is_active

ALTER TABLE "app"."activities" DROP CONSTRAINT IF EXISTS "activities_short_name_key";--> statement-breakpoint
ALTER TABLE "app"."activities" DROP COLUMN "short_name";--> statement-breakpoint
ALTER TABLE "app"."activities" RENAME COLUMN "name" TO "activity";--> statement-breakpoint
ALTER TABLE "app"."activities" RENAME COLUMN "active" TO "is_active";--> statement-breakpoint
ALTER TABLE "app"."activities" ADD CONSTRAINT "activities_activity_key" UNIQUE ("activity");
