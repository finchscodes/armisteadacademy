CREATE TABLE "chat_messages" (
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
ALTER TABLE "characters" DROP COLUMN "year_or_role";