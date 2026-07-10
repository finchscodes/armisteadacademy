import { getAllCharactersDirectory } from "@/lib/characters";
import { MemberDirectory } from "@/components/member-directory";

export default async function MembersPage() {
  const members = await getAllCharactersDirectory();

  return (
    <div>
      <h1 className="font-display text-3xl text-brass-400 mb-1">Members</h1>
      <p className="text-ink-400 text-sm mb-6">
        Every character at Armistead Academy — {members.length} so far.
      </p>
      <MemberDirectory members={members} />
    </div>
  );
}
