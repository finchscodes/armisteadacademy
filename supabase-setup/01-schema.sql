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
