import { redirect } from "next/navigation";

// /hall/[hall] is the short, memorable link to that hall's board — this
// just forwards to the board itself so both URLs work.
export default async function HallShortcutPage({ params }: { params: Promise<{ hall: string }> }) {
  const { hall } = await params;
  redirect(`/b/${hall}-hall`);
}
