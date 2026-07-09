ALTER TYPE "public"."board_kind" ADD VALUE 'article';--> statement-breakpoint
CREATE TABLE "board_post_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"board_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board_post_permissions" ADD CONSTRAINT "board_post_permissions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_post_permissions" ADD CONSTRAINT "board_post_permissions_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "board_post_permissions_character_board_idx" ON "board_post_permissions" USING btree ("character_id","board_id");