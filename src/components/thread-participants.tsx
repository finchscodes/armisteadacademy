"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addParticipantAction, removeParticipantAction } from "@/actions/messages";
import { RecipientPicker } from "@/components/recipient-picker";

type Participant = { characterId: number; characterFirstName: string; characterLastName: string };
type CharacterOption = { id: number; name: string; firstName: string; lastName: string; slug: string };

export function ThreadParticipants({
  threadId,
  participants,
  isCreator,
  myCharacterId,
}: {
  threadId: number;
  participants: Participant[];
  isCreator: boolean;
  myCharacterId: number;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState<CharacterOption[]>([]);
  const [pending, startTransition] = useTransition();

  function handleRemove(characterId: number) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("threadId", String(threadId));
      formData.set("characterId", String(characterId));
      await removeParticipantAction(formData);
      router.refresh();
    });
  }

  function handleAdd() {
    if (adding.length === 0) return;
    startTransition(async () => {
      for (const c of adding) {
        const formData = new FormData();
        formData.set("threadId", String(threadId));
        formData.set("characterId", String(c.id));
        await addParticipantAction(formData);
      }
      setAdding([]);
      router.refresh();
    });
  }

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-1.5">
        {participants.map((p) => (
          <span
            key={p.characterId}
            className="inline-flex items-center gap-2 text-xs bg-ink-800 border border-ink-600 rounded-full pl-3.5 pr-1.5 py-1.5"
          >
            {p.characterFirstName} {p.characterLastName}
            {isCreator && p.characterId !== myCharacterId && (
              <button
                type="button"
                onClick={() => handleRemove(p.characterId)}
                disabled={pending}
                className="w-4 h-4 rounded-full bg-ink-700 hover:bg-claret-600 text-parchment-100 flex items-center justify-center leading-none disabled:opacity-50"
                data-tooltip="Remove from conversation"
              >
                &times;
              </button>
            )}
          </span>
        ))}
      </div>

      {isCreator && (
        <div className="mt-2 flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <RecipientPicker
              selected={adding}
              onChange={setAdding}
              name="newParticipant"
              excludeIds={participants.map((p) => p.characterId)}
            />
          </div>
          {adding.length > 0 && (
            <button
              type="button"
              onClick={handleAdd}
              disabled={pending}
              className="text-xs bg-gunmetal-500 text-ink-950 px-3 py-2 rounded-md font-medium hover:bg-gunmetal-400 transition-colors disabled:opacity-60 shrink-0"
            >
              Add to conversation
            </button>
          )}
        </div>
      )}
    </div>
  );
}
