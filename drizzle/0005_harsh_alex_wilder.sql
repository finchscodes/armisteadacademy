ALTER TABLE "boards" ALTER COLUMN "min_role_to_view" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "boards" ALTER COLUMN "min_role_to_view" SET DEFAULT 'member'::text;--> statement-breakpoint
ALTER TABLE "boards" ALTER COLUMN "min_role_to_post" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "boards" ALTER COLUMN "min_role_to_post" SET DEFAULT 'member'::text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('member', 'spymaster', 'secretary', 'field_agent', 'head_staff', 'instructor', 'chief_editor', 'assistant_instructor', 'enforcer', 'school_board_member', 'writer', 'media_team', 'library_handler', 'gatekeeper', 'operator');--> statement-breakpoint
ALTER TABLE "boards" ALTER COLUMN "min_role_to_view" SET DEFAULT 'member'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "boards" ALTER COLUMN "min_role_to_view" SET DATA TYPE "public"."user_role" USING (
  CASE "min_role_to_view"
    WHEN 'staff' THEN 'instructor'
    WHEN 'admin' THEN 'spymaster'
    ELSE "min_role_to_view"
  END
)::"public"."user_role";--> statement-breakpoint
ALTER TABLE "boards" ALTER COLUMN "min_role_to_post" SET DEFAULT 'member'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "boards" ALTER COLUMN "min_role_to_post" SET DATA TYPE "public"."user_role" USING (
  CASE "min_role_to_post"
    WHEN 'staff' THEN 'instructor'
    WHEN 'admin' THEN 'spymaster'
    ELSE "min_role_to_post"
  END
)::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."user_role";--> statement-breakpoint
-- Existing 'staff' accounts become 'instructor' (both could post lessons);
-- existing 'admin' accounts become 'spymaster' (the new admin-dashboard role).
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING (
  CASE "role"
    WHEN 'staff' THEN 'instructor'
    WHEN 'admin' THEN 'spymaster'
    ELSE "role"
  END
)::"public"."user_role";--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "first_name" varchar(50) DEFAULT 'Unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "middle_name" varchar(50);--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "last_name" varchar(50) DEFAULT 'Unknown' NOT NULL;
