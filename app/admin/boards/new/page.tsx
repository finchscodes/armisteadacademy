import Link from "next/link";
import { getCategoriesForAdmin } from "@/actions/admin";
import { NewBoardForm } from "@/components/new-board-form";

export default async function NewBoardPage() {
  const categories = await getCategoriesForAdmin();

  return (
    <div className="max-w-xl">
      <Link href="/admin/boards" className="text-sm text-ink-400 hover:text-brass-400">
        &larr; All boards
      </Link>
      <h1 className="font-display text-2xl text-parchment-100 mt-2 mb-6">New board</h1>
      <NewBoardForm categories={categories} />
    </div>
  );
}
