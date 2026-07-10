import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserDetail } from "@/actions/admin";
import { EditUserForm } from "@/components/edit-user-form";
import { AdminMajorEditor } from "@/components/admin-major-editor";
import { AdminJobEditor } from "@/components/admin-job-editor";
import { AdminNameEditor } from "@/components/admin-name-editor";
import { AdminAgeEditor } from "@/components/admin-age-editor";
import { AdminSlugEditor } from "@/components/admin-slug-editor";
import { AdminYearEditor } from "@/components/admin-year-editor";
import { AdminLevelEditor } from "@/components/admin-level-editor";
import { AdminBalanceEditor } from "@/components/admin-balance-editor";
import { AdminGenderEditor } from "@/components/admin-gender-editor";
import { AdminSocialStatusEditor } from "@/components/admin-social-status-editor";
import { DeleteCharacterButton, DeleteAccountButton } from "@/components/delete-buttons";
import { levelForXp } from "@/lib/xp";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getUserDetail(Number(id));
  if (!detail) notFound();

  const { user, characters } = detail;

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/admin/users" className="text-sm text-ink-400 hover:text-brass-400">
        &larr; All users
      </Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <h1 className="font-display text-2xl text-parchment-100">{user.username}</h1>
        <DeleteAccountButton userId={user.id} username={user.username} />
      </div>

      <EditUserForm
        userId={user.id}
        username={user.username}
        email={user.email}
        isAdmin={user.isAdmin}
      />

      <div className="mt-6">
        <h2 className="font-display text-sm uppercase tracking-wider text-ink-400 mb-2">
          Characters
        </h2>
        <p className="text-xs text-ink-400 mb-2">
          Legal names are shown here for admin reference only &mdash; they&apos;re locked from
          the character owner&apos;s side.
        </p>
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
                  <AdminJobEditor characterId={c.id} userId={user.id} currentJobs={c.jobs} />
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
