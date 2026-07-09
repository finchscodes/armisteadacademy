CREATE TYPE "public"."character_job" AS ENUM('none', 'spymaster', 'secretary', 'field_agent', 'head_staff', 'instructor', 'chief_editor', 'assistant_instructor', 'enforcer', 'school_board_member', 'writer', 'media_team', 'library_handler', 'gatekeeper', 'operator');--> statement-breakpoint
CREATE TABLE "class_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"board_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "boards" ALTER COLUMN "min_role_to_view" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "boards" ALTER COLUMN "min_role_to_view" SET DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "boards" ALTER COLUMN "min_role_to_post" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "boards" ALTER COLUMN "min_role_to_post" SET DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "job" character_job DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Preserve admin access: any account that was 'spymaster' (or the older 'admin')
-- becomes is_admin = true before the role column is dropped.
UPDATE "users" SET "is_admin" = true WHERE "role" IN ('spymaster', 'admin');--> statement-breakpoint
ALTER TABLE "class_assignments" ADD CONSTRAINT "class_assignments_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_assignments" ADD CONSTRAINT "class_assignments_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "class_assignments_character_board_idx" ON "class_assignments" USING btree ("character_id","board_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";--> statement-breakpoint
DROP TYPE "public"."user_role";