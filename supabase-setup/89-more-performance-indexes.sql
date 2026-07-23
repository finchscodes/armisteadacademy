-- Run this in Supabase's SQL Editor after 88-rename-missions-board.sql.
--
-- A second pass after the first round of indexes (87) didn't fully
-- resolve the loading/hanging issue. Found two more genuinely global
-- culprits: chat_messages (the persistent chat widget's recent-messages
-- query, sorted by created_at, runs on literally every page load) and
-- characters.last_active_at (the "who's online" query, also every page
-- load) had zero indexes. Also covered inventory and pets, which are
-- queried on every Arsenal/Pets tab view on a profile.

CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages" ("created_at");
CREATE INDEX "characters_last_active_at_idx" ON "characters" ("last_active_at");
CREATE INDEX "inventory_character_id_idx" ON "inventory" ("character_id");
CREATE INDEX "pets_character_id_idx" ON "pets" ("character_id");
