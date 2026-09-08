ALTER TABLE "app"."users" ALTER COLUMN "firstname" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."users" ALTER COLUMN "surname" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."users" ALTER COLUMN "nickname" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."users" ALTER COLUMN "dob" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."users" ALTER COLUMN "gender" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."users" ALTER COLUMN "preferred_lang" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."user_credentials" ADD COLUMN "email" varchar(254) NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."user_credentials" ADD CONSTRAINT "user_credentials_email_key" UNIQUE("email");