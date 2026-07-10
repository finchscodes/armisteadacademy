import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { NewMessageForm } from "@/components/new-message-form";

export const dynamic = "force-dynamic";

export default async function NewMessagePage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!current.activeCharacter) redirect("/characters");

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/messages" className="text-sm text-ink-400 hover:text-brass-400">
        &larr; Back to messages
      </Link>
      <h1 className="font-display text-3xl text-brass-400 mt-2 mb-6">New Message</h1>
      <NewMessageForm />
    </div>
  );
}
