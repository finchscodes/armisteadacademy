"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cuddlePetAction, cuddleAllPetsAction, careForPetAction } from "@/actions/pets";
import type { PetRow } from "@/lib/pets";

type FoodItem = { inventoryId: number; itemName: string; petFoodRestore: number };

export function PetsTab({
  pets,
  ownerCharacterId,
  canInteract,
  viewerFoodItems,
}: {
  pets: PetRow[];
  ownerCharacterId: number;
  canInteract: boolean;
  viewerFoodItems: FoodItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [caringForPetId, setCaringForPetId] = useState<number | null>(null);
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");

  function handleCuddle(petId: number) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("petId", String(petId));
      const result = await cuddlePetAction(undefined, formData);
      if (result?.error) setError(result.error);
      else if (result?.success) setMessage(result.success);
      router.refresh();
    });
  }

  function handleCuddleAll() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("ownerCharacterId", String(ownerCharacterId));
      const result = await cuddleAllPetsAction(undefined, formData);
      if (result?.error) setError(result.error);
      else if (result?.success) setMessage(result.success);
      router.refresh();
    });
  }

  function handleCareSubmit(petId: number) {
    if (!selectedFoodId) {
      setError("Pick a food item first");
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("petId", String(petId));
      formData.set("inventoryId", selectedFoodId);
      const result = await careForPetAction(undefined, formData);
      if (result?.error) setError(result.error);
      else if (result?.success) setMessage(result.success);
      setCaringForPetId(null);
      setSelectedFoodId("");
      router.refresh();
    });
  }

  if (pets.length === 0) {
    return <p className="text-sm text-ink-400 italic">No pets yet.</p>;
  }

  return (
    <div>
      {canInteract && (
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={handleCuddleAll}
            disabled={pending}
            className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60"
          >
            Cuddle all
          </button>
          {viewerFoodItems.length === 0 && (
            <span className="text-[11px] text-ink-500">
              (Care for a pet requires pet food in your own Arsenal)
            </span>
          )}
        </div>
      )}
      {message && <p className="text-sm text-green-500 mb-3">{message}</p>}
      {error && <p className="text-sm text-claret-500 mb-3">{error}</p>}

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
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCuddle(pet.id)}
                    disabled={pending || !pet.canCuddleNow}
                    className="text-[11px] text-gunmetal-400 hover:text-gunmetal-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {pet.canCuddleNow ? "Cuddle" : "Cuddled today"}
                  </button>
                  {viewerFoodItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCaringForPetId(caringForPetId === pet.id ? null : pet.id)}
                      disabled={pending}
                      className="text-[11px] text-gunmetal-400 hover:text-gunmetal-300 disabled:opacity-60"
                    >
                      Care for
                    </button>
                  )}
                </div>
                {caringForPetId === pet.id && (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedFoodId}
                      onChange={(e) => setSelectedFoodId(e.target.value)}
                      className="flex-1 min-w-0 rounded-md border border-ink-600 bg-ink-800 px-2 py-1 text-xs focus:outline-none focus:border-gunmetal-500"
                    >
                      <option value="">Pick food...</option>
                      {viewerFoodItems.map((f) => (
                        <option key={f.inventoryId} value={f.inventoryId}>
                          {f.itemName} (+{f.petFoodRestore}%)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleCareSubmit(pet.id)}
                      disabled={pending}
                      className="text-[11px] bg-gunmetal-500 text-ink-950 px-2 py-1 rounded-md font-medium disabled:opacity-60"
                    >
                      Feed
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
