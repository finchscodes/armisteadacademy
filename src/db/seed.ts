import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { boards, shops, items, users } from "./schema";

async function main() {
  console.log("Seeding a staff account...");
  const passwordHash = await bcrypt.hash("changeme123", 10);
  await db
    .insert(users)
    .values({
      email: "staff@ashbourne.local",
      username: "professor",
      passwordHash,
      role: "staff",
    })
    .onConflictDoNothing();
  console.log('  -> login: "professor" / "changeme123" (change this password after first login)');

  console.log("Seeding boards...");

  const [generalCategory] = await db
    .insert(boards)
    .values({ kind: "category", name: "The Grounds", slug: "the-grounds", position: 0 })
    .returning();

  const [academicsCategory] = await db
    .insert(boards)
    .values({ kind: "category", name: "Academics", slug: "academics", position: 1 })
    .returning();

  await db.insert(boards).values([
    {
      kind: "board",
      parentId: generalCategory.id,
      name: "The Dining Hall",
      slug: "dining-hall",
      description: "Open roleplay — meals, announcements, general mingling.",
      position: 0,
    },
    {
      kind: "board",
      parentId: generalCategory.id,
      name: "Common Rooms",
      slug: "common-rooms",
      description: "House-specific threads.",
      position: 1,
    },
    {
      kind: "class",
      parentId: academicsCategory.id,
      name: "Introductory Botany",
      slug: "intro-botany",
      description: "Lessons and homework for first-year Botany.",
      position: 0,
    },
    {
      kind: "class",
      parentId: academicsCategory.id,
      name: "Basic Spellcraft",
      slug: "basic-spellcraft",
      description: "Lessons and homework for first-year Spellcraft.",
      position: 1,
    },
  ]);

  console.log("Seeding a starter shop...");
  const [generalStore] = await db
    .insert(shops)
    .values({
      name: "The General Store",
      slug: "general-store",
      description: "Everyday supplies, sweets, and oddities.",
    })
    .returning();

  await db.insert(items).values([
    { shopId: generalStore.id, name: "Quill & Ink Set", price: 8, stock: null },
    { shopId: generalStore.id, name: "Sugar Toad Sweet", price: 3, stock: null },
    { shopId: generalStore.id, name: "Second-hand Spellbook", price: 15, stock: 20 },
  ]);

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
