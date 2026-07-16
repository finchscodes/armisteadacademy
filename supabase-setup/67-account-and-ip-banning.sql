-- Run this in Supabase's SQL Editor after 66-shops-own-category.sql.
--
-- Adds account banning (users.is_banned/ban_reason) and a banned_ips table
-- for IP-level bans, plus captures each user's last-known IP on login so
-- admins have something to go on when deciding whether to also IP-ban.

ALTER TABLE "users" ADD COLUMN "is_banned" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "ban_reason" text;
ALTER TABLE "users" ADD COLUMN "last_ip_address" varchar(64);

CREATE TABLE "banned_ips" (
  "id" serial PRIMARY KEY,
  "ip_address" varchar(64) NOT NULL,
  "reason" text,
  "banned_by_user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
