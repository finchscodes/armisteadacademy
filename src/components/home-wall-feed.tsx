import { getRecentWallActivity, getLikesForWallPosts, getCommentsForWallPosts } from "@/lib/wall";
import { getCurrentUser } from "@/lib/current-user";
import { characterHasAnyJob } from "@/lib/character-jobs";
import { MANAGEMENT_JOBS } from "@/lib/roles";
import { WallPostItem } from "@/components/wall-post-item";

export async function HomeWallFeed() {
  const [activity, current] = await Promise.all([getRecentWallActivity(15), getCurrentUser()]);
  if (activity.length === 0) return null;

  const viewerCharacterId = current?.activeCharacter?.id ?? null;
  const wallPostIds = activity.map((a) => a.id);
  const [likes, comments, canModerate] = await Promise.all([
    getLikesForWallPosts(wallPostIds, viewerCharacterId),
    getCommentsForWallPosts(wallPostIds),
    viewerCharacterId ? characterHasAnyJob(viewerCharacterId, MANAGEMENT_JOBS) : Promise.resolve(false),
  ]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-display text-sm text-gunmetal-400 uppercase tracking-wider">Wall activity</h2>
        <div className="flex-1 gunmetal-rule" />
      </div>
      <div className="space-y-2">
        {activity.map((a) => {
          if (!a.poster || !a.wallOwner) return null;
          return (
            <WallPostItem
              key={a.id}
              post={{
                id: a.id,
                content: a.content,
                isPinned: false,
                createdAt: a.createdAt,
                posterCharacterId: a.poster.id,
                posterName: a.poster.name,
                posterFirstName: a.poster.firstName,
                posterLastName: a.poster.lastName,
                posterSlug: a.poster.slug,
                posterAvatarUrl: a.poster.avatarUrl,
                posterJob: a.poster.job,
              }}
              like={likes.get(a.id) ?? { count: 0, likedByViewer: false }}
              comments={comments.get(a.id) ?? []}
              isWallOwner={viewerCharacterId === a.wallOwner.id}
              isPoster={viewerCharacterId === a.poster.id}
              canInteract={Boolean(viewerCharacterId)}
              canModerate={Boolean(current?.session.isAdmin) || canModerate}
              wallOwner={
                a.poster.id === a.wallOwner.id
                  ? undefined
                  : { name: `${a.wallOwner.firstName} ${a.wallOwner.lastName}`, slug: a.wallOwner.slug }
              }
            />
          );
        })}
      </div>
    </div>
  );
}
