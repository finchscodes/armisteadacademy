import { ne } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";

/**
 * Every character that holds a job (job != "none"). The Job List shows the
 * CHARACTER holding the job, not the account behind it.
 */
export async function getStaffDirectory() {
  return db
    .select({
      id: characters.id,
      name: characters.name,
      slug: characters.slug,
      job: characters.job,
      avatarUrl: characters.avatarUrl,
    })
    .from(characters)
    .where(ne(characters.job, "none"));
}
