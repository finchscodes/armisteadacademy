import Link from "next/link";
import { RichTextDisplay } from "@/components/rich-text-display";
import { FollowButton } from "@/components/follow-button";
import { CameraIcon } from "@/components/nav-icons";

type PhotoPost = { id: number; imageUrl: string | null; createdAt: Date };

export function SocialProfileHeader({
  threadId,
  threadSlug,
  handle,
  avatarUrl,
  description,
  postCount,
  followerCount,
  followingCount,
  isFollowing,
  canFollow,
  recentPhotos,
}: {
  threadId: number;
  threadSlug: string;
  handle: string;
  avatarUrl: string | null;
  description: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  canFollow: boolean;
  recentPhotos: PhotoPost[];
}) {
  return (
    <div className="bg-ink-900 border border-ink-700 rounded-lg overflow-hidden mb-4">
      <div className="px-4 py-2 border-b border-ink-700 text-ink-500">
        <CameraIcon className="w-4 h-4" />
      </div>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-ink-700 shrink-0 bg-ink-800">
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={handle} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="font-display text-lg text-parchment-100">{handle}</h2>
              {canFollow && <FollowButton threadId={threadId} isFollowing={isFollowing} />}
            </div>
            {description && (
              <div className="text-sm text-parchment-100/80 mb-2">
                <RichTextDisplay html={description} />
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-ink-300">
              <span>
                <strong className="text-parchment-100">{postCount}</strong> posts
              </span>
              <span>
                <strong className="text-parchment-100">{followerCount}</strong> followers
              </span>
              <span>
                <strong className="text-parchment-100">{followingCount}</strong> following
              </span>
            </div>
          </div>
        </div>
      </div>

      {recentPhotos.length > 0 && (
        <div className="grid grid-cols-3 border-t border-ink-700">
          {recentPhotos.map((p) => (
            <Link
              key={p.id}
              href={`/t/${threadSlug}#post-${p.id}`}
              className="aspect-square relative block overflow-hidden group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl ?? undefined}
                alt=""
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
