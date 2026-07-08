import { eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { users, characters } from "@/db/schema";

export async function getStaffDirectory() {
  const staffUsers = await db
    .select({ id: users.id, username: users.username, role: users.role })
    .from(users)
    .where(ne(users.role, "member"));

  const withCharacters = await Promise.all(
    staffUsers.map(async (u) => {
      const userCharacters = await db
        .select({ name: characters.name, slug: characters.slug })
        .from(characters)
        .where(eq(characters.userId, u.id));
      return { ...u, characters: userCharacters };
    })
  );

  return withCharacters;
}
