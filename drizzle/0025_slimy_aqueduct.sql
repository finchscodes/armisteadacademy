CREATE TABLE "hall_welcome_messages" (
	"hall" "hall" PRIMARY KEY NOT NULL,
	"title" varchar(120) DEFAULT 'Welcome!' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "is_announcement" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "ooc" text;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "rating" integer;