"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cuddlePetAction, cuddleAllPetsAction } from "@/actions/pets";
import { useToast } from "@/components/toast-provider";
import type { PetRow } from "@/lib/pets";

export function PetsTab({
  pets,
  ownerCharacterId,
  canInteract,
}: {
  pets: PetRow[];
  ownerCharacterId: number;
  canInteract: boolean;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [pending, startTransition] = useTransition();

  function handleCuddle(petId: number) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("petId", String(petId));
      const result = await cuddlePetAction(undefined, formData);
      if (result?.error) showToast(result.error, "error");
      else if (result?.success) showToast(result.success, "success");
      router.refresh();
    });
  }

  function handleCuddleAll() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("ownerCharacterId", String(ownerCharacterId));
      const result = await cuddleAllPetsAction(undefined, formData);
      if (result?.error) showToast(result.error, "error");
      else if (result?.success) showToast(result.success, "success");
      router.refresh();
    });
  }

  if (pets.length === 0) {
    return <p className="text-sm text-ink-400 italic">No pets yet.</p>;
  }

  return (
    <div>
      {canInteract && (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleCuddleAll}
            disabled={pending}
            className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
          >
            Cuddle all
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pets.map((pet) => (
          <div key={pet.id} className="bg-ink-900 border border-ink-700 rounded-lg p-4 flex flex-col">
            {pet.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pet.imageUrl} alt={pet.name} className="w-full h-28 object-cover rounded-md mb-3" />
            )}
            <p className="text-sm font-medium text-parchment-100">{pet.name}</p>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-ink-400 mb-0.5">
                <span>Hunger</span>
                <span>{pet.hunger}%</span>
              </div>
              <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${pet.hunger <= 20 ? "bg-claret-600" : "bg-gunmetal-500"}`}
                  style={{ width: `${pet.hunger}%` }}
                />
              </div>
            </div>

            {canInteract && (
              <button
                type="button"
                onClick={() => handleCuddle(pet.id)}
                disabled={pending || !pet.canCuddleNow}
                className="text-[11px] text-gunmetal-400 hover:text-gunmetal-300 mt-3 text-left disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pet.canCuddleNow ? "Cuddle" : "Cuddled today"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
