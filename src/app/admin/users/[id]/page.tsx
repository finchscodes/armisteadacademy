import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserDetail, getAllBoardsFlat, getBoardGrantsForCharacter } from "@/actions/admin";
import { EditUserForm } from "@/components/edit-user-form";
import { AdminMajorEditor } from "@/components/admin-major-editor";
import { AdminJobEditor } from "@/components/admin-job-editor";
import { AdminBoardAccessEditor } from "@/components/admin-board-access-editor";
import { AdminChatTimeoutStatus } from "@/components/admin-chat-timeout-status";
import { AdminStatusEditor } from "@/components/admin-status-editor";
import { AdminNameEditor } from "@/components/admin-name-editor";
import { AdminAgeEditor } from "@/components/admin-age-editor";
import { AdminBirthdayEditor } from "@/components/admin-birthday-editor";
import { AdminSlugEditor } from "@/components/admin-slug-editor";
import { AdminYearEditor } from "@/components/admin-year-editor";
import { AdminLevelEditor } from "@/components/admin-level-editor";
import { AdminBalanceEditor } from "@/components/admin-balance-editor";
import { AdminGenderEditor } from "@/components/admin-gender-editor";
import { AdminSocialStatusEditor } from "@/components/admin-social-status-editor";
import { AdminHallEditor } from "@/components/admin-hall-editor";
import { DeleteCharacterButton, DeleteAccountButton } from "@/components/delete-buttons";
import { BanControls } from "@/components/ban-controls";
import { levelForXp } from "@/lib/xp";
import { getCurrentUser } from "@/lib/current-user";
import { getAdminAccessContext } from "@/lib/admin-access";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await getCurrentUser();
  const access = await getAdminAccessContext(
    current?.activeCharacter?.id ?? null,
    Boolean(current?.session.isAdmin)
  );

  const [detail, allBoards] = await Promise.all([getUserDetail(Number(id)), getAllBoardsFlat()]);
  if (!detail) notFound();

  const { user, characters } = detail;

  // Limited (hire-only) access — just the job editor per character, nothing else.
  if (!access.isFullAdmin) {
    return (
      <div className="max-w-xl mx-auto">
        <Link href="/admin/users" className="text-sm text-ink-400 hover:text-brass-400">
          &larr; All users
        </Link>
        <h1 className="font-display text-2xl text-parchment-100 mt-2 mb-6">{user.email}</h1>
        <div className="space-y-6">
          {characters.map((c) => (
            <div key={c.id} className="bg-ink-900 border border-ink-700 rounded-lg p-4">
              <p className="font-display text-lg text-parchment-100 mb-2">
                {c.firstName} {c.lastName}
              </p>
              <AdminJobEditor characterId={c.id} userId={user.id} currentJobs={c.jobs} boards={allBoards} />
            </div>
          ))}
          {characters.length === 0 && <p className="text-sm text-ink-400">No characters yet.</p>}
        </div>
      </div>
    );
  }

  const boardGrantsByCharacter = new Map(
    await Promise.all(
      characters.map(async (c) => [c.id, await getBoardGrantsForCharacter(c.id)] as const)
    )
  );

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/admin/users" className="text-sm text-ink-400 hover:text-brass-400">
        &larr; All users
      </Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <h1 className="font-display text-2xl text-parchment-100">{user.email}</h1>
        <DeleteAccountButton userId={user.id} email={user.email} />
      </div>

      <EditUserForm userId={user.id} email={user.email} isAdmin={user.isAdmin} />

      <BanControls
        userId={user.id}
        isBanned={user.isBanned}
        banReason={user.banReason}
        lastIpAddress={user.lastIpAddress}
      />

      <div className="mt-6">
        <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">
          Chat (applies to every character on this account)
        </p>
        <AdminChatTimeoutStatus
          userId={user.id}
          timeoutUntil={user.chatTimeoutUntil ? user.chatTimeoutUntil.toISOString() : null}
        />
      </div>

      <div className="mt-6">
        <h2 className="font-display text-sm uppercase tracking-wider text-ink-400 mb-2">
          Characters
        </h2>
        {characters.length === 0 ? (
          <p className="text-sm text-ink-400">No characters.</p>
        ) : (
          <div className="bg-ink-900 border border-ink-700 rounded-lg divide-y divide-ink-700">
            {characters.map((c) => (
              <div key={c.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Link href={`/c/${c.slug}`} className="text-parchment-100 hover:text-brass-400">
                    {c.firstName} {c.lastName}
                  </Link>
                  <DeleteCharacterButton characterId={c.id} userId={user.id} characterName={c.name} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">
                    Legal name
                  </p>
                  <AdminNameEditor
                    characterId={c.id}
                    userId={user.id}
                    firstName={c.firstName}
                    middleName={c.middleName}
                    lastName={c.lastName}
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">
                    Profile URL
                  </p>
                  <AdminSlugEditor characterId={c.id} userId={user.id} currentSlug={c.slug} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">Age</p>
                  <AdminAgeEditor characterId={c.id} userId={user.id} currentAge={c.age} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">Birthday</p>
                  <AdminBirthdayEditor
                    characterId={c.id}
                    userId={user.id}
                    birthdayQuarter={c.birthdayQuarter}
                    birthdayWeek={c.birthdayWeek}
                    birthdayDayOfWeek={c.birthdayDayOfWeek}
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">Gender</p>
                  <AdminGenderEditor characterId={c.id} userId={user.id} currentGender={c.gender} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">
                    Social status
                  </p>
                  <AdminSocialStatusEditor
                    characterId={c.id}
                    userId={user.id}
                    currentSocialStatus={c.socialStatus}
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">Hall</p>
                  <AdminHallEditor characterId={c.id} userId={user.id} currentHall={c.hall} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">Major</p>
                  <AdminMajorEditor characterId={c.id} userId={user.id} currentMajor={c.major} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">Year</p>
                  <AdminYearEditor
                    characterId={c.id}
                    userId={user.id}
                    currentYearOverride={c.yearOverride}
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">Jobs</p>
                  <AdminJobEditor characterId={c.id} userId={user.id} currentJobs={c.jobs} boards={allBoards} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">Board access</p>
                  <AdminBoardAccessEditor
                    characterId={c.id}
                    userId={user.id}
                    currentGrants={boardGrantsByCharacter.get(c.id) ?? []}
                    boards={allBoards}
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">
                    Statuses
                  </p>
                  <AdminStatusEditor characterId={c.id} userId={user.id} currentStatuses={c.statuses} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">Level</p>
                  <AdminLevelEditor
                    characterId={c.id}
                    userId={user.id}
                    currentLevel={levelForXp(c.xp)}
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">Money</p>
                  <AdminBalanceEditor characterId={c.id} userId={user.id} currentBalance={c.balance} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
