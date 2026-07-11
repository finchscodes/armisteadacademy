CREATE TABLE "site_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar(60) NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
