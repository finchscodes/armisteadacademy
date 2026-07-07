import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pets } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";

export default async function PetsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!current.activeCharacter) redirect("/characters");

  const myPets = await db
    .select()
    .from(pets)
    .where(eq(pets.characterId, current.activeCharacter.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-brass-400">
            {current.activeCharacter.name}&apos;s pets
          </h1>
          <p className="text-ink-400 text-sm mt-1">Cuddle a pet once every few hours for XP.</p>
        </div>
        <Link
          href="/pets/new"
          className="text-sm bg-brass-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors"
        >
          + Adopt a pet
        </Link>
      </div>

      {myPets.length === 0 ? (
        <p className="text-ink-400">
          No pets yet.{" "}
          <Link href="/pets/new" className="text-brass-400 hover:underline">
            Adopt your first one
          </Link>
          .
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {myPets.map((pet) => (
            <Link
              key={pet.id}
              href={`/pets/${pet.id}`}
              className="bg-ink-900 border border-ink-700 rounded-lg p-4 hover:border-brass-500/50 transition-colors"
            >
              <p className="font-display text-lg text-parchment-100">{pet.name}</p>
              <p className="text-xs text-ink-400">{pet.species}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
