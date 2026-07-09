-- Run this in Supabase's SQL Editor after 06-armistead-boards.sql.
-- Replaces the old 4-role system (member/instructor/staff/admin) with the
-- full job list (Spymaster, Secretary, Instructor, etc — see src/lib/roles.ts).
-- Safely migrates existing accounts: 'staff' becomes 'instructor',
-- 'admin' becomes 'spymaster' — nobody loses access, the role just gets
-- renamed to match the new system.
-- Also adds locked legal-name fields (first/middle/last) to characters.
-- Existing characters get "Unknown Unknown" as a placeholder since there's
-- no way to know what their real name should be — edit those directly in
-- Supabase's Table Editor if you want to fix them up (the app itself locks
-- these fields after creation).

ALTER TABLE "boards" ALTER COLUMN "min_role_to_view" SET DATA TYPE text;
ALTER TABLE "boards" ALTER COLUMN "min_role_to_view" SET DEFAULT 'member'::text;
ALTER TABLE "boards" ALTER COLUMN "min_role_to_post" SET DATA TYPE text;
ALTER TABLE "boards" ALTER COLUMN "min_role_to_post" SET DEFAULT 'member'::text;
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'::text;
DROP TYPE "public"."user_role";
CREATE TYPE "public"."user_role" AS ENUM('member', 'spymaster', 'secretary', 'field_agent', 'head_staff', 'instructor', 'chief_editor', 'assistant_instructor', 'enforcer', 'school_board_member', 'writer', 'media_team', 'library_handler', 'gatekeeper', 'operator');

ALTER TABLE "boards" ALTER COLUMN "min_role_to_view" SET DEFAULT 'member'::"public"."user_role";
ALTER TABLE "boards" ALTER COLUMN "min_role_to_view" SET DATA TYPE "public"."user_role" USING (
  CASE "min_role_to_view"
    WHEN 'staff' THEN 'instructor'
    WHEN 'admin' THEN 'spymaster'
    ELSE "min_role_to_view"
  END
)::"public"."user_role";

ALTER TABLE "boards" ALTER COLUMN "min_role_to_post" SET DEFAULT 'member'::"public"."user_role";
ALTER TABLE "boards" ALTER COLUMN "min_role_to_post" SET DATA TYPE "public"."user_role" USING (
  CASE "min_role_to_post"
    WHEN 'staff' THEN 'instructor'
    WHEN 'admin' THEN 'spymaster'
    ELSE "min_role_to_post"
  END
)::"public"."user_role";

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."user_role";
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING (
  CASE "role"
    WHEN 'staff' THEN 'instructor'
    WHEN 'admin' THEN 'spymaster'
    ELSE "role"
  END
)::"public"."user_role";

ALTER TABLE "characters" ADD COLUMN "first_name" varchar(50) DEFAULT 'Unknown' NOT NULL;
ALTER TABLE "characters" ADD COLUMN "middle_name" varchar(50);
ALTER TABLE "characters" ADD COLUMN "last_name" varchar(50) DEFAULT 'Unknown' NOT NULL;
