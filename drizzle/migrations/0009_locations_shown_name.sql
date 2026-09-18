ALTER TABLE "app"."locations" ADD COLUMN "shown_name" varchar(120);--> statement-breakpoint
WITH RECURSIVE tree AS (
	SELECT
		id,
		short_name,
		parent_location_id,
		short_name::varchar(120) AS shown_name
	FROM "app"."locations"
	WHERE parent_location_id IS NULL
	UNION ALL
	SELECT
		l.id,
		l.short_name,
		l.parent_location_id,
		(t.shown_name || '.' || l.short_name)::varchar(120) AS shown_name
	FROM "app"."locations" l
	INNER JOIN tree t ON l.parent_location_id = t.id
)
UPDATE "app"."locations" AS loc
SET shown_name = tree.shown_name
FROM tree
WHERE loc.id = tree.id AND loc.shown_name IS NULL;--> statement-breakpoint
UPDATE "app"."locations" SET shown_name = short_name WHERE shown_name IS NULL;--> statement-breakpoint
ALTER TABLE "app"."locations" ALTER COLUMN "shown_name" SET NOT NULL;
