import { WallPostForm } from "@/components/wall-post-form";
import { WallPostItem } from "@/components/wall-post-item";

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
};

export function WallFeed({
  wallCharacterId,
  posts,
  myCharacterId,
  canModerate,
  canPost,
}: {
  wallCharacterId: number;
  posts: WallPost[];
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
            isWallOwner={isWallOwner}
            isPoster={myCharacterId === p.posterCharacterId}
            canModerate={canModerate}
          />
        ))
      )}
    </div>
  );
}
