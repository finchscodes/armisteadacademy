import { WallPostForm } from "@/components/wall-post-form";
import { WallPostItem } from "@/components/wall-post-item";
import type { WallLikeSummary, WallCommentRow } from "@/lib/wall";

type WallPost = {
  id: number;
  content: string;
  isPinned: boolean;
  createdAt: Date;
  posterCharacterId: number;
  posterName: string;
  posterFirstName: string;
  posterLastName: string;
  posterSlug: string;
  posterAvatarUrl: string | null;
  posterJob: string;
  activityType: string | null;
  activityValue: string | null;
};

export function WallFeed({
  wallCharacterId,
  posts,
  likes,
  comments,
  myCharacterId,
  canModerate,
  canPost,
}: {
  wallCharacterId: number;
  posts: WallPost[];
  likes: Map<number, WallLikeSummary>;
  comments: Map<number, WallCommentRow[]>;
  myCharacterId: number | null;
  canModerate: boolean;
  canPost: boolean;
}) {
  const isWallOwner = myCharacterId === wallCharacterId;

  return (
    <div className="space-y-3">
      {canPost && <WallPostForm wallCharacterId={wallCharacterId} />}
      {posts.length === 0 ? (
        <p className="text-sm text-ink-400 italic">Nothing here yet.</p>
      ) : (
        posts.map((p) => (
          <WallPostItem
            key={p.id}
            post={p}
            like={likes.get(p.id) ?? { count: 0, likedByViewer: false }}
            comments={comments.get(p.id) ?? []}
            isWallOwner={isWallOwner}
            isPoster={myCharacterId === p.posterCharacterId}
            canInteract={Boolean(myCharacterId)}
            canModerate={canModerate}
            allowPinning
          />
        ))
      )}
    </div>
  );
}
