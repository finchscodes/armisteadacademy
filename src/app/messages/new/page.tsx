import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { NewMessageForm } from "@/components/new-message-form";

export const dynamic = "force-dynamic";

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!current.activeCharacter) redirect("/characters");

  const { to } = await searchParams;
  const toId = to ? Number(to) : null;
  const initialRecipient =
    toId && toId !== current.activeCharacter.id
      ? await (async () => {
          const [c] = await db
            .select({ id: characters.id, name: characters.name, firstName: characters.firstName, lastName: characters.lastName, slug: characters.slug })
            .from(characters)
            .where(eq(characters.id, toId));
          return c ?? null;
        })()
      : null;

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/messages" className="text-sm text-ink-400 hover:text-gunmetal-400">
        &larr; Back to messages
      </Link>
      <h1 className="font-display text-3xl text-gunmetal-400 mt-2 mb-6">New Message</h1>
      <NewMessageForm initialRecipient={initialRecipient} />
    </div>
  );
}
