import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { getCharacterBalance } from "@/lib/economy";
import { getCharacterLevelProgress } from "@/lib/xp";
import { getBoardTree } from "@/lib/forum";
import { BoardsDropdown } from "./boards-dropdown";
import { AccountMenu } from "./account-menu";

export async function NavBar() {
  const [current, boardTree] = await Promise.all([getCurrentUser(), getBoardTree()]);
  const [balance, levelProgress] = current?.activeCharacter
    ? await Promise.all([
        getCharacterBalance(current.activeCharacter.id),
        getCharacterLevelProgress(current.activeCharacter.id),
      ])
    : [null, null];

  return (
    <header className="border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-xl tracking-wide text-brass-400 shrink-0">
            Armistead <span className="text-parchment-100">Academy</span>
          </Link>
          <BoardsDropdown tree={boardTree} label="Inside Armistead" excludeCategorySlugs={["outside-armistead"]} />
          <BoardsDropdown tree={boardTree} label="Outside Armistead" onlyCategorySlugs={["outside-armistead"]} />
          <Link href="/guide" className="text-sm text-ink-200 hover:text-brass-400 transition-colors">
            Rules &amp; Guidelines
          </Link>
        </div>

        {current ? (
          <AccountMenu
            characters={current.characters}
            activeCharacter={
              current.activeCharacter
                ? {
                    id: current.activeCharacter.id,
                    name: current.activeCharacter.name,
                    firstName: current.activeCharacter.firstName,
                    lastName: current.activeCharacter.lastName,
                    slug: current.activeCharacter.slug,
                    avatarUrl: current.activeCharacter.avatarUrl,
                  }
                : null
            }
            balance={balance}
            level={levelProgress?.level ?? null}
            xpIntoLevel={levelProgress?.xpIntoLevel ?? null}
            xpForLevel={
              levelProgress ? levelProgress.nextLevelFloor - levelProgress.currentLevelFloor : null
            }
            isAdmin={current.session.isAdmin}
          />
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-ink-200 hover:text-brass-400">
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-brass-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-brass-400 transition-colors"
            >
              Join
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
