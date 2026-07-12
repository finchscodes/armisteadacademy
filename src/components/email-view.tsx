import Link from "next/link";
import { CharacterBadge } from "@/components/character-badge";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { EditablePost } from "@/components/editable-post";

function formatEmailDate(date: Date) {
  return date.toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EmailView({
  postId,
  content,
  editedAt,
  canEdit,
  subject,
  senderCharacterId,
  senderName,
  senderSlug,
  senderAvatarUrl,
  postedAt,
}: {
  postId: number;
  content: string;
  editedAt: Date | null;
  canEdit: boolean;
  subject: string;
  senderCharacterId: number;
  senderName: string;
  senderSlug: string;
  senderAvatarUrl: string | null;
  postedAt: Date;
}) {
  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-6">
      <div className="flex items-start gap-4 mb-4">
        <CharacterHoverCard characterId={senderCharacterId} slug={senderSlug} className="relative shrink-0">
          <Link href={`/c/${senderSlug}`}>
            <CharacterBadge name={senderName} avatarUrl={senderAvatarUrl} size="lg" />
          </Link>
        </CharacterHoverCard>
        <div className="min-w-0 pt-1 space-y-1">
          <p className="text-sm">
            <span className="text-[10px] uppercase tracking-wider text-ink-400 font-medium mr-1.5">
              From:
            </span>
            <Link href={`/c/${senderSlug}`} className="text-parchment-100 hover:text-brass-400 transition-colors">
              {senderName}
            </Link>
          </p>
          <p className="text-sm">
            <span className="text-[10px] uppercase tracking-wider text-ink-400 font-medium mr-1.5">
              Date:
            </span>
            <span className="text-parchment-100">{formatEmailDate(postedAt)}</span>
          </p>
          <p className="text-sm">
            <span className="text-[10px] uppercase tracking-wider text-ink-400 font-medium mr-1.5">
              Subject:
            </span>
            <span className="text-parchment-100">{subject}</span>
          </p>
        </div>
      </div>

      <hr className="border-ink-700 mb-4" />

      <EditablePost postId={postId} content={content} editedAt={editedAt} canEdit={canEdit} />
    </div>
  );
}
