import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { getCharacterBalance } from "@/lib/economy";
import { getCharacterLevelProgress, canGradeHomework } from "@/lib/xp";
import { getBoardTree, filterBoardTreeForViewer } from "@/lib/forum";
import { getGradingQueueCount } from "@/lib/lessons";
import { getOnlineCount } from "@/lib/online-status";
import { getNotifications } from "@/lib/notifications";
import { characterHasAnyJob } from "@/lib/character-jobs";
import { MANAGEMENT_JOBS } from "@/lib/roles";
import { getAdminAccessContext, hasAnyAdminAccess } from "@/lib/admin-access";
import { BoardsDropdown } from "./boards-dropdown";
import { MobileNav } from "./mobile-nav";
import { AccountMenu } from "./account-menu";
import { NotificationBell } from "./notification-bell";
import { GradingIcon, SocialIcon, MailIcon } from "./nav-icons";
import { getUnreadMessageCount } from "@/lib/messages";
import { getCurrentGameDate } from "@/lib/game-time";

export async function NavBar() {
  const [current, rawBoardTree, onlineCount] = await Promise.all([
    getCurrentUser(),
    getBoardTree(),
    getOnlineCount(),
    // Not displayed here anymore (see GameTimeWidget on the homepage) — but
    // still called so this remains a reliable trigger for the lazy time
    // advancement (payroll, birthdays) that lives inside it.
    getCurrentGameDate(),
  ]);
  const [balance, levelProgress] = current?.activeCharacter
    ? await Promise.all([
        getCharacterBalance(current.activeCharacter.id),
        getCharacterLevelProgress(current.activeCharacter.id),
      ])
    : [null, null];

  const canGrade = current?.activeCharacter
    ? await canGradeHomework(current.activeCharacter.id)
    : false;
  const gradingCount =
    canGrade && current?.activeCharacter
      ? await getGradingQueueCount(current.activeCharacter.id)
      : 0;
  const notifications = current?.activeCharacter
    ? await getNotifications(current.activeCharacter.id)
    : [];
  const unreadMessageCount = current?.activeCharacter
    ? await getUnreadMessageCount(current.activeCharacter.id)
    : 0;

  // Hall boards are only shown in the nav to their own hall's members —
  // management and admin see every hall.
  const canSeeAllHalls =
    Boolean(current?.session.isAdmin) ||
    (current?.activeCharacter
      ? await characterHasAnyJob(current.activeCharacter.id, MANAGEMENT_JOBS)
      : false);
  const boardTree = filterBoardTreeForViewer(
    rawBoardTree,
    current?.activeCharacter?.hall ?? null,
    canSeeAllHalls
  );

  // Same limited-admin-panel logic used by /admin itself — a character with
  // a scoped job (Resident Advisor, Instructor, etc.) or a management/hiring
  // job should see the Admin link too, not just true site admins.
  const adminAccess = current
    ? await getAdminAccessContext(current.activeCharacter?.id ?? null, current.session.isAdmin)
    : null;
  const canAccessAdminPanel = adminAccess ? hasAnyAdminAccess(adminAccess) : false;

  return (
    <header className="border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-4 h-11 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="flex items-baseline gap-1.5 shrink-0 leading-none">
            <span
              className="font-hero text-base md:text-lg uppercase tracking-normal text-gunmetal-400"
              style={{
                fontWeight: 400,
                fontVariantLigatures: "common-ligatures discretionary-ligatures",
                fontFeatureSettings: '"liga" 1, "dlig" 1',
              }}
            >
              armistead
            </span>
            <span
              className="font-hero text-base md:text-lg uppercase tracking-normal text-parchment-100"
              style={{
                fontWeight: 400,
                fontVariantLigatures: "common-ligatures discretionary-ligatures",
                fontFeatureSettings: '"liga" 1, "dlig" 1',
              }}
            >
              academy
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <BoardsDropdown
              tree={boardTree}
              label="Inside Armistead"
              excludeCategorySlugs={["outside-armistead", "shops"]}
            />
            <BoardsDropdown
              tree={boardTree}
              label="Outside Armistead"
              onlyCategorySlugs={["outside-armistead", "shops"]}
            />
            <Link href="/guide" className="text-sm text-ink-200 hover:text-gunmetal-400 transition-colors">
              Rules &amp; Guidelines
            </Link>
          </div>
          <MobileNav tree={boardTree} />
        </div>

        {current ? (
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/social"
              data-tooltip="Socials" data-tooltip-side="bottom"
              className="relative flex items-center gap-1 text-ink-200 hover:text-gunmetal-400 transition-colors"
            >
              <SocialIcon />
              {onlineCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-green-600 text-parchment-100 text-[10px] leading-none rounded-full px-1.5 py-0.5 min-w-[1rem] text-center">
                  {onlineCount}
                </span>
              )}
            </Link>
            {current.activeCharacter && (
              <Link
                href="/grading"
                data-tooltip="Grading" data-tooltip-side="bottom"
                className="relative flex items-center gap-1 text-ink-200 hover:text-gunmetal-400 transition-colors"
              >
                <GradingIcon />
                {gradingCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-claret-600 text-parchment-100 text-[10px] leading-none rounded-full px-1.5 py-0.5 min-w-[1rem] text-center">
                    {gradingCount}
                  </span>
                )}
              </Link>
            )}
            {current.activeCharacter && (
              <Link
                href="/messages"
                data-tooltip="Messages" data-tooltip-side="bottom"
                className="relative flex items-center gap-1 text-ink-200 hover:text-gunmetal-400 transition-colors"
              >
                <MailIcon />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-claret-600 text-parchment-100 text-[10px] leading-none rounded-full px-1.5 py-0.5 min-w-[1rem] text-center">
                    {unreadMessageCount}
                  </span>
                )}
              </Link>
            )}
            {current.activeCharacter && (
              <NotificationBell
                initial={notifications.map((n) => ({
                  ...n,
                  createdAt: n.createdAt.toISOString(),
                }))}
              />
            )}
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
                      major: current.activeCharacter.major,
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
              canAccessAdminPanel={canAccessAdminPanel}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-ink-200 hover:text-gunmetal-400">
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-gunmetal-500 text-ink-950 px-3 py-1.5 rounded-md font-medium hover:bg-gunmetal-400 transition-colors"
            >
              Join
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
