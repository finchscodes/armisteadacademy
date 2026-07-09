import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { getCharacterBalance } from "@/lib/economy";
import { getCharacterLevelProgress } from "@/lib/xp";
import { getBoardTree } from "@/lib/forum";
import { CharacterSwitcher } from "./character-switcher";
import { BoardsDropdown } from "./boards-dropdown";
import { logoutAction } from "@/actions/auth";

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
          <BoardsDropdown tree={boardTree} />
        </div>

        {current ? (
          <div className="flex items-center gap-4">
            {current.activeCharacter && (
              <div className="hidden md:flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-brass-400">
                  <span className="text-ink-400">&#9670;</span>
                  {balance ?? 0}
                </span>
                {levelProgress && (
                  <span className="flex items-center gap-1.5 text-ink-200">
                    <span className="text-[10px] uppercase tracking-wider text-ink-400 border border-ink-600 rounded px-1.5 py-0.5">
                      Lv {levelProgress.level}
                    </span>
                    <span className="text-xs text-ink-400">
                      {levelProgress.xpIntoLevel}/{levelProgress.nextLevelFloor - levelProgress.currentLevelFloor} xp
                    </span>
                  </span>
                )}
              </div>
            )}
            <CharacterSwitcher
              characters={current.characters}
              activeCharacterId={current.activeCharacter?.id ?? null}
            />
            <Link
              href="/characters"
              className="text-sm text-ink-200 hover:text-brass-400 transition-colors hidden sm:inline"
            >
              Characters
            </Link>
            {current.session.isAdmin && (
              <Link
                href="/admin/users"
                className="text-sm text-claret-500 hover:text-claret-400 transition-colors hidden sm:inline"
              >
                Admin
              </Link>
            )}
            <form action={logoutAction}>
              <button className="text-sm text-ink-400 hover:text-claret-500 transition-colors">
                Log out
              </button>
            </form>
          </div>
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
