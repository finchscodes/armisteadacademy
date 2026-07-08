import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { getRecentFeedPosts } from "@/lib/feed";
import { getRecentChatMessages } from "@/actions/chat";
import { CharacterCard } from "@/components/character-card";
import { FeedItemCard } from "@/components/feed-item";
import { ChatSidebar } from "@/components/chat-sidebar";

export default async function HomePage() {
  const [current, feed, chatMessages] = await Promise.all([
    getCurrentUser(),
    getRecentFeedPosts(20),
    getRecentChatMessages(50),
  ]);

  const canChat = Boolean(current?.activeCharacter);
  const initialChatMessages = chatMessages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
      <div className="space-y-6 min-w-0">
        {current ? (
          current.activeCharacter ? (
            <CharacterCard character={current.activeCharacter} />
          ) : (
            <div className="bg-ink-900 border border-ink-700 rounded-lg p-5">
              <p className="text-parchment-100">You don&apos;t have a character yet.</p>
              <Link href="/characters/new" className="text-sm text-brass-400 hover:underline">
                Create one to start posting &rarr;
              </Link>
            </div>
          )
        ) : (
          <div className="bg-ink-900 border border-ink-700 rounded-lg p-6">
            <h1 className="font-display text-2xl text-brass-400 mb-1">Armistead Academy</h1>
            <p className="text-ink-400 text-sm mb-4">
              A spy academy roleplay: forums, lessons, and an in-world economy.
            </p>
            <div className="flex gap-3">
              <Link
                href="/register"
                className="text-sm bg-brass-500 text-ink-950 px-4 py-2 rounded-md font-medium hover:bg-brass-400 transition-colors"
              >
                Join
              </Link>
              <Link
                href="/login"
                className="text-sm text-ink-200 hover:text-brass-400 px-4 py-2"
              >
                Log in
              </Link>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-display text-lg text-parchment-100">Recent activity</h2>
            <div className="flex-1 brass-rule" />
          </div>

          {feed.length === 0 ? (
            <p className="text-sm text-ink-400">
              Nothing posted yet.{" "}
              <Link href="/boards" className="text-brass-400 hover:underline">
                Browse the boards
              </Link>{" "}
              to start a thread.
            </p>
          ) : (
            <div className="space-y-3">
              {feed.map((item) => (
                <FeedItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-20">
        <ChatSidebar initialMessages={initialChatMessages} canChat={canChat} />
      </div>
    </div>
  );
}
