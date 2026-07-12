import Link from "next/link";
import { CharacterBadge } from "@/components/character-badge";
import { CharacterHoverCard } from "@/components/character-hover-card";
import { EditablePost } from "@/components/editable-post";
import { DeletePostButton } from "@/components/delete-buttons";
import { jobColor, type CharacterJob } from "@/lib/roles";

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
  canDelete,
  isOpeningPost,
  subject,
  senderCharacterId,
  senderName,
  senderSlug,
  senderAvatarUrl,
  senderJob,
  postedAt,
}: {
  postId: number;
  content: string;
  editedAt: Date | null;
  canEdit: boolean;
  canDelete: boolean;
  isOpeningPost: boolean;
  subject: string;
  senderCharacterId: number;
  senderName: string;
  senderSlug: string;
  senderAvatarUrl: string | null;
  senderJob: CharacterJob;
  postedAt: Date;
}) {
  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4 min-w-0">
          {/* Avatar is decorative here — the hover card lives on the name below. */}
          <Link href={`/c/${senderSlug}`} className="shrink-0">
            <CharacterBadge name={senderName} avatarUrl={senderAvatarUrl} size="lg" />
          </Link>
          <div className="min-w-0 pt-1 space-y-1">
            <p className="text-sm">
              <span className="text-[10px] uppercase tracking-wider text-ink-400 font-medium mr-1.5">
                From:
              </span>
              <CharacterHoverCard characterId={senderCharacterId} slug={senderSlug} className="relative inline">
                <Link
                  href={`/c/${senderSlug}`}
                  className="hover:underline transition-colors"
                  style={{ color: jobColor(senderJob) ?? "#f6efdc" }}
                >
                  {senderName}
                </Link>
              </CharacterHoverCard>
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
        {canDelete && <DeletePostButton postId={postId} isOpeningPost={isOpeningPost} />}
      </div>

      <hr className="border-ink-700 mb-4" />

      <EditablePost postId={postId} content={content} editedAt={editedAt} canEdit={canEdit} />
    </div>
  );
}
