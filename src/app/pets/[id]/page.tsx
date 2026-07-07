import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pets } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { CharacterBadge } from "@/components/character-badge";
import { cuddlePetAction } from "@/actions/pets";

const CUDDLE_COOLDOWN_MS = 8 * 60 * 60 * 1000;

export default async function PetProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const [pet] = await db.select().from(pets).where(eq(pets.id, Number(id)));
  if (!pet) notFound();

  const isOwner = current.characters.some((c) => c.id === pet.characterId);

  let onCooldown = false;
  let availableAt: Date | null = null;
  if (pet.lastCuddledAt) {
    availableAt = new Date(pet.lastCuddledAt.getTime() + CUDDLE_COOLDOWN_MS);
    // eslint-disable-next-line react-hooks/purity -- server component, evaluated once per request
    onCooldown = availableAt.getTime() > Date.now();
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-ink-900 border border-ink-700 rounded-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <CharacterBadge name={pet.name} avatarUrl={pet.avatarUrl} />
        </div>
        <h1 className="font-display text-2xl text-parchment-100">{pet.name}</h1>
        <p className="text-sm text-ink-400 mb-4">{pet.species}</p>

        {pet.bio && (
          <p className="text-sm text-parchment-100/90 whitespace-pre-wrap text-left border-t border-ink-700 pt-4 mt-4">
            {pet.bio}
          </p>
        )}

        {isOwner && (
          <div className="mt-6">
            <form action={cuddlePetAction}>
              <input type="hidden" name="petId" value={pet.id} />
              <button
                type="submit"
                disabled={onCooldown}
                className="bg-claret-600 text-parchment-100 rounded-md px-6 py-2.5 font-medium hover:bg-claret-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {onCooldown ? "Already cuddled" : "Cuddle"}
              </button>
            </form>
            {onCooldown && availableAt && (
              <p className="text-xs text-ink-400 mt-2">
                Available again at{" "}
                {availableAt.toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
