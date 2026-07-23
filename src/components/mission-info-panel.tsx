import Link from "next/link";
import { MissionReserveButton } from "@/components/mission-reserve-button";

type Reservation = { characterId: number; name: string; slug: string };

export function MissionInfoPanel({
  threadId,
  deadline,
  maxSpots,
  reservations,
  viewerCharacterId,
  canInteract,
}: {
  threadId: number;
  deadline: Date | null;
  maxSpots: number | null;
  reservations: Reservation[];
  viewerCharacterId: number | null;
  canInteract: boolean;
}) {
  const isPastDeadline = Boolean(deadline && deadline <= new Date());
  const isFull = maxSpots != null && reservations.length >= maxSpots;
  const isReserved = viewerCharacterId != null && reservations.some((r) => r.characterId === viewerCharacterId);

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-4 mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        {deadline && (
          <p className="text-ink-300">
            <span className="text-ink-500">Deadline:</span>{" "}
            {deadline.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </p>
        )}
        {maxSpots != null && (
          <p className="text-ink-300">
            <span className="text-ink-500">Spots:</span> {reservations.length}/{maxSpots}
          </p>
        )}
      </div>

      {reservations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {reservations.map((r) => (
            <Link
              key={r.characterId}
              href={`/c/${r.slug}`}
              className="text-xs bg-ink-800 border border-ink-600 rounded-full px-2.5 py-1 hover:border-gunmetal-500/50 transition-colors"
            >
              {r.name}
            </Link>
          ))}
        </div>
      )}

      {canInteract && (
        <MissionReserveButton
          threadId={threadId}
          isReserved={isReserved}
          isFull={isFull}
          isPastDeadline={isPastDeadline}
        />
      )}
    </div>
  );
}
