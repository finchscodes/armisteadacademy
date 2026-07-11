CREATE TYPE "public"."board_kind" AS ENUM('category', 'board', 'class');--> statement-breakpoint
CREATE TYPE "public"."ledger_reason" AS ENUM('grading_reward', 'grading_payment', 'shop_purchase', 'admin_adjustment', 'starting_balance');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('open', 'claimed', 'graded');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('member', 'staff', 'admin');--> statement-breakpoint
CREATE TABLE "boards" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"kind" "board_kind" DEFAULT 'board' NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"min_role_to_view" "user_role" DEFAULT 'member' NOT NULL,
	"min_role_to_post" "user_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(64) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"faceclaim" varchar(120),
	"house" varchar(40),
	"year_or_role" varchar(40),
	"bio" text,
	"avatar_url" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currency_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"reason" "ledger_reason" NOT NULL,
	"related_submission_id" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"acquired_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"stock" integer,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"prompt" text NOT NULL,
	"created_by_user_id" integer NOT NULL,
	"reward_min" integer DEFAULT 10 NOT NULL,
	"reward_max" integer DEFAULT 25 NOT NULL,
	"grader_fee" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"content" text NOT NULL,
	"status" "submission_status" DEFAULT 'open' NOT NULL,
	"grader_character_id" integer,
	"grade" integer,
	"feedback" text,
	"payout" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"graded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_post_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(32) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "currency_ledger" ADD CONSTRAINT "currency_ledger_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "currency_ledger" ADD CONSTRAINT "currency_ledger_related_submission_id_submissions_id_fk" FOREIGN KEY ("related_submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_grader_character_id_characters_id_fk" FOREIGN KEY ("grader_character_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "boards_slug_idx" ON "boards" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "characters_slug_idx" ON "characters" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");CREATE TYPE "public"."xp_reason" AS ENUM('chat_post', 'homework_submission', 'grading', 'pet_cuddle', 'admin_adjustment');--> statement-breakpoint
CREATE TABLE "pets" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"name" varchar(64) NOT NULL,
	"species" varchar(60) NOT NULL,
	"bio" text,
	"avatar_url" text,
	"last_cuddled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xp_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"reason" "xp_reason" NOT NULL,
	"related_submission_id" integer,
	"related_post_id" integer,
	"related_pet_id" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_related_submission_id_submissions_id_fk" FOREIGN KEY ("related_submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_related_post_id_posts_id_fk" FOREIGN KEY ("related_post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_related_pet_id_pets_id_fk" FOREIGN KEY ("related_pet_id") REFERENCES "public"."pets"("id") ON DELETE no action ON UPDATE no action;CREATE TYPE "public"."character_major" AS ENUM('Threat Elimination', 'Precision Shooting', 'Covert Operations', 'Linguistics, Culture, & Assimilation', 'Advanced Encryption', 'Survival, Communications, & Navigation', 'Research & Development', 'Medicine, Chemistry, & Criminology', 'Seduction, Interrogation, & Influence Tactics', 'Protection & Enforcement', 'Undecided/Witness Protection', 'Graduate', 'Faculty');--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "major" character_major DEFAULT 'Undecided/Witness Protection' NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "house";CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" varchar(1000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "faceclaim";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "year_or_role";ALTER TYPE "public"."user_role" ADD VALUE 'instructor' BEFORE 'staff';ALTER TABLE "boards" ALTER COLUMN "min_role_to_view" SET DATA TYPE text;--> statement-breakpoint
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
DROP TYPE "public"."user_role";CREATE TABLE "post_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" varchar(1000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"emoji" varchar(16) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_grader_character_id_characters_id_fk";
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "age" integer DEFAULT 18 NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "year_override" varchar(20);--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "location" varchar(200);--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "time_setting" varchar(100);--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "surroundings" text;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "post_reactions_unique_idx" ON "post_reactions" USING btree ("post_id","character_id","emoji");--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_grader_character_id_characters_id_fk" FOREIGN KEY ("grader_character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;ALTER TABLE "xp_ledger" DROP CONSTRAINT "xp_ledger_related_pet_id_pets_id_fk";
--> statement-breakpoint
ALTER TABLE "xp_ledger" DROP COLUMN "related_pet_id";
--> statement-breakpoint
DROP TABLE "pets" CASCADE;
CREATE TYPE "public"."grade_tier" AS ENUM('perfect', 'excellent', 'good', 'needs_improvement', 'failing');--> statement-breakpoint
CREATE TABLE "submission_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"grader_character_id" integer NOT NULL,
	"tier" "grade_tier" NOT NULL,
	"feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_created_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_grader_character_id_characters_id_fk";
--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "status" SET DEFAULT 'open'::text;--> statement-breakpoint
DROP TYPE "public"."submission_status";--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('open', 'graded');--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."submission_status";--> statement-breakpoint
-- 'claimed' no longer exists as a status — the old single-claim model is gone.
-- Any submission that was claimed-but-not-yet-graded goes back to 'open' so it
-- re-enters the new multi-grader queue.
ALTER TABLE "submissions" ALTER COLUMN "status" SET DATA TYPE "public"."submission_status" USING (
  CASE "status"
    WHEN 'claimed' THEN 'open'
    ELSE "status"
  END
)::"public"."submission_status";--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "created_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "job_title" varchar(100);--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "final_tier" "grade_tier";--> statement-breakpoint
ALTER TABLE "submission_grades" ADD CONSTRAINT "submission_grades_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_grades" ADD CONSTRAINT "submission_grades_grader_character_id_characters_id_fk" FOREIGN KEY ("grader_character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "submission_grades_unique_idx" ON "submission_grades" USING btree ("submission_id","grader_character_id");--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" DROP COLUMN "grader_character_id";--> statement-breakpoint
ALTER TABLE "submissions" DROP COLUMN "feedback";CREATE TABLE "character_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"job" character_job NOT NULL,
	"job_title" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_jobs" ADD CONSTRAINT "character_jobs_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "character_jobs_unique_idx" ON "character_jobs" USING btree ("character_id","job");--> statement-breakpoint
-- Preserve every character's existing single job (if any) as a row in the
-- new table before the old columns are dropped below.
INSERT INTO "character_jobs" ("character_id", "job", "job_title")
SELECT "id", "job", "job_title" FROM "characters" WHERE "job" != 'none';--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "job";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "job_title";ALTER TYPE "public"."board_kind" ADD VALUE 'article';--> statement-breakpoint
CREATE TABLE "board_post_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"board_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board_post_permissions" ADD CONSTRAINT "board_post_permissions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_post_permissions" ADD CONSTRAINT "board_post_permissions_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "board_post_permissions_character_board_idx" ON "board_post_permissions" USING btree ("character_id","board_id");ALTER TABLE "boards" ADD COLUMN "extra_article_job" character_job;CREATE TABLE "guide_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"content" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "guide_sections_slug_idx" ON "guide_sections" USING btree ("slug");ALTER TABLE "threads" ADD COLUMN "scheduled_for" timestamp;CREATE TYPE "public"."relation_status" AS ENUM('pending', 'accepted');--> statement-breakpoint
CREATE TABLE "character_relations" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_character_id" integer NOT NULL,
	"to_character_id" integer NOT NULL,
	"relation_type" text NOT NULL,
	"status" "relation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "social_status" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "personality" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "appearance" text;--> statement-breakpoint
ALTER TABLE "character_relations" ADD CONSTRAINT "character_relations_from_character_id_characters_id_fk" FOREIGN KEY ("from_character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_relations" ADD CONSTRAINT "character_relations_to_character_id_characters_id_fk" FOREIGN KEY ("to_character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "character_relations_unique_idx" ON "character_relations" USING btree ("from_character_id","to_character_id","relation_type");ALTER TABLE "characters" ALTER COLUMN "major" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "major" SET DEFAULT 'Undecided/Witness Protection'::text;--> statement-breakpoint
DROP TYPE "public"."character_major";--> statement-breakpoint
CREATE TYPE "public"."character_major" AS ENUM('Threat Elimination', 'Precision Shooting', 'Covert Operations', 'Linguistics, Culture, & Assimilation', 'Advanced Encryption', 'Survival, Communications, & Navigation', 'Research & Development', 'Medicine, Chemistry, & Criminology', 'Seduction, Interrogation, & Influence Tactics', 'Protection & Enforcement', 'Undecided/Witness Protection');--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "major" SET DEFAULT 'Undecided/Witness Protection'::character_major;--> statement-breakpoint
-- 'Graduate' and 'Faculty' no longer exist as majors (graduation is purely a
-- year label now; Faculty is a job, not a major). Any character currently
-- set to either falls back to Undecided — admin can pick something more
-- accurate afterward via /admin/users if needed.
ALTER TABLE "characters" ALTER COLUMN "major" SET DATA TYPE character_major USING (
  CASE "major"
    WHEN 'Graduate' THEN 'Undecided/Witness Protection'
    WHEN 'Faculty' THEN 'Undecided/Witness Protection'
    ELSE "major"
  END
)::character_major;ALTER TABLE "currency_ledger" DROP CONSTRAINT "currency_ledger_related_submission_id_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "xp_ledger" DROP CONSTRAINT "xp_ledger_related_submission_id_submissions_id_fk";
--> statement-breakpoint
ALTER TABLE "xp_ledger" DROP CONSTRAINT "xp_ledger_related_post_id_posts_id_fk";
--> statement-breakpoint
ALTER TABLE "currency_ledger" ADD CONSTRAINT "currency_ledger_related_submission_id_submissions_id_fk" FOREIGN KEY ("related_submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_related_submission_id_submissions_id_fk" FOREIGN KEY ("related_submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_ledger" ADD CONSTRAINT "xp_ledger_related_post_id_posts_id_fk" FOREIGN KEY ("related_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;ALTER TABLE "characters" ADD COLUMN "last_active_at" timestamp;ALTER TYPE "public"."character_major" RENAME VALUE 'Undecided/Witness Protection' TO 'Undecided';--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "major" SET DEFAULT 'Undecided'::character_major;
CREATE TYPE "public"."notification_type" AS ENUM('thread_reply', 'relation_request', 'homework_graded');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"message" text NOT NULL,
	"link" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;CREATE TABLE "character_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"label" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_announcement" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"title" varchar(120) DEFAULT 'Welcome!' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spotlight_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"blurb" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_statuses" ADD CONSTRAINT "character_statuses_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotlight_entries" ADD CONSTRAINT "spotlight_entries_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;CREATE TYPE "public"."hall" AS ENUM('undercroft', 'veil', 'rampart', 'eaves');--> statement-breakpoint
CREATE TYPE "public"."reputation_reason" AS ENUM('homework_submission', 'grading', 'thread_created', 'thread_reply', 'admin_adjustment');--> statement-breakpoint
CREATE TABLE "reputation_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"reason" "reputation_reason" NOT NULL,
	"related_submission_id" integer,
	"related_post_id" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sorting_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"answer_text" text NOT NULL,
	"hall" "hall" NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sorting_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_text" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "restricted_to_hall" "hall";--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "hall" "hall";--> statement-breakpoint
ALTER TABLE "reputation_ledger" ADD CONSTRAINT "reputation_ledger_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_ledger" ADD CONSTRAINT "reputation_ledger_related_submission_id_submissions_id_fk" FOREIGN KEY ("related_submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_ledger" ADD CONSTRAINT "reputation_ledger_related_post_id_posts_id_fk" FOREIGN KEY ("related_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sorting_answers" ADD CONSTRAINT "sorting_answers_question_id_sorting_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."sorting_questions"("id") ON DELETE cascade ON UPDATE no action;CREATE TABLE "class_enrollments" (
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
ALTER TABLE "lessons" ADD COLUMN "requirements" text;CREATE TABLE "hall_welcome_messages" (
	"hall" "hall" PRIMARY KEY NOT NULL,
	"title" varchar(120) DEFAULT 'Welcome!' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "is_announcement" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "ooc" text;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "rating" integer;CREATE TABLE "message_thread_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"is_read" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" varchar(200) NOT NULL,
	"creator_character_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_thread_participants" ADD CONSTRAINT "message_thread_participants_thread_id_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."message_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_thread_participants" ADD CONSTRAINT "message_thread_participants_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_creator_character_id_characters_id_fk" FOREIGN KEY ("creator_character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."message_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "message_participants_unique_idx" ON "message_thread_participants" USING btree ("thread_id","character_id");ALTER TABLE "boards" ADD COLUMN "image_url" text;CREATE TABLE "site_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar(60) NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
