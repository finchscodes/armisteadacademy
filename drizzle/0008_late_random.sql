ALTER TABLE "xp_ledger" DROP CONSTRAINT "xp_ledger_related_pet_id_pets_id_fk";
--> statement-breakpoint
ALTER TABLE "xp_ledger" DROP COLUMN "related_pet_id";
--> statement-breakpoint
DROP TABLE "pets" CASCADE;
