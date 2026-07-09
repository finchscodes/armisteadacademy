import { notFound, redirect } from "next/navigation";
import { getCharacterBySlug } from "@/lib/characters";
import { getSession } from "@/lib/auth";
import { EditCharacterForm } from "@/components/edit-character-form";

export default async function EditCharacterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const character = await getCharacterBySlug(slug);
  if (!character) notFound();
  if (character.userId !== session.userId) redirect(`/c/${slug}`);

  const legalName = [character.firstName, character.middleName, character.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl text-brass-400 mb-1">Edit character</h1>
      <p className="text-ink-400 text-sm mb-6">
        Code name, faceclaim, major, and bio can all be changed here.
      </p>
      <EditCharacterForm
        characterId={character.id}
        legalName={legalName}
        age={character.age}
        name={character.name}
        major={character.major}
        avatarUrl={character.avatarUrl}
        bio={character.bio}
        gender={character.gender}
        socialStatus={character.socialStatus}
        personality={character.personality}
        appearance={character.appearance}
      />
    </div>
  );
}
