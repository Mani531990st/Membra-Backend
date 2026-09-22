-- Add gender_short + is_active to genders; backfill short codes for enum rows.

ALTER TABLE "app"."genders" ADD COLUMN "gender_short" varchar(10);--> statement-breakpoint
UPDATE "app"."genders" SET "gender_short" = CASE "gender"
	WHEN 'male' THEN 'M'
	WHEN 'female' THEN 'F'
	WHEN 'others' THEN 'O'
END;--> statement-breakpoint
ALTER TABLE "app"."genders" ALTER COLUMN "gender_short" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."genders" ADD CONSTRAINT "genders_gender_short_key" UNIQUE ("gender_short");--> statement-breakpoint
ALTER TABLE "app"."genders" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;
