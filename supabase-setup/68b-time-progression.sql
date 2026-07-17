-- Run this in Supabase's SQL Editor after 68-weekly-payroll-ledger-reason.sql.

CREATE TYPE "quarter" AS ENUM ('fall', 'winter', 'spring', 'summer');

CREATE TABLE "game_time" (
  "id" integer PRIMARY KEY,
  "day_index" integer NOT NULL DEFAULT 0,
  "is_paused" boolean NOT NULL DEFAULT false,
  "last_advanced_at" timestamp NOT NULL DEFAULT now()
);
INSERT INTO "game_time" ("id", "day_index") VALUES (1, 0);

CREATE TABLE "exams" (
  "id" serial PRIMARY KEY,
  "board_id" integer NOT NULL REFERENCES "boards"("id") ON DELETE CASCADE,
  "year" integer NOT NULL,
  "created_by_user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "exam_questions" (
  "id" serial PRIMARY KEY,
  "exam_id" integer NOT NULL REFERENCES "exams"("id") ON DELETE CASCADE,
  "question_text" text NOT NULL,
  "position" integer NOT NULL DEFAULT 0
);

CREATE TABLE "exam_answers" (
  "id" serial PRIMARY KEY,
  "question_id" integer NOT NULL REFERENCES "exam_questions"("id") ON DELETE CASCADE,
  "answer_text" text NOT NULL,
  "is_correct" boolean NOT NULL DEFAULT false,
  "position" integer NOT NULL DEFAULT 0
);

CREATE TABLE "exam_attempts" (
  "id" serial PRIMARY KEY,
  "exam_id" integer NOT NULL REFERENCES "exams"("id") ON DELETE CASCADE,
  "character_id" integer NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "score" integer NOT NULL,
  "total_questions" integer NOT NULL,
  "passed" boolean NOT NULL,
  "taken_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "characters" ADD COLUMN "current_year_number" integer NOT NULL DEFAULT 1;
ALTER TABLE "characters" ADD COLUMN "last_year_progressed_in_game_year" integer;
ALTER TABLE "characters" ADD COLUMN "birthday_quarter" "quarter";
ALTER TABLE "characters" ADD COLUMN "birthday_week" integer;
ALTER TABLE "characters" ADD COLUMN "birthday_day_of_week" integer;

ALTER TABLE "boards" ADD COLUMN "restricted_year_min" integer;
ALTER TABLE "boards" ADD COLUMN "restricted_year_max" integer;
