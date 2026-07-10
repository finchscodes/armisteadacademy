CREATE TABLE "class_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"board_id" integer NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "reward" integer DEFAULT 20 NOT NULL;--> statement-breakpoint
-- Preserve what instructors already had tuned: existing lessons keep their
-- old reward_max as the new flat reward, instead of every lesson silently
-- resetting to the bare default of 20.
UPDATE "lessons" SET "reward" = "reward_max";--> statement-breakpoint
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "class_enrollments_unique_idx" ON "class_enrollments" USING btree ("character_id","board_id");--> statement-breakpoint
-- Anyone who already submitted homework for a class is enrolled in it
-- automatically — the new enrollment requirement shouldn't retroactively
-- lock out people already partway through a class.
INSERT INTO "class_enrollments" ("character_id", "board_id")
SELECT DISTINCT s.character_id, l.board_id
FROM "submissions" s
JOIN "lessons" l ON s.lesson_id = l.id
ON CONFLICT DO NOTHING;--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "reward_min";--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "reward_max";
