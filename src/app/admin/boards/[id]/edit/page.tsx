import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoardForAdmin } from "@/actions/admin";
import { EditBoardForm } from "@/components/edit-board-form";

export default async function EditBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await getBoardForAdmin(Number(id));
  if (!board) notFound();

  return (
    <div className="max-w-xl">
      <Link href="/admin/boards" className="text-sm text-ink-400 hover:text-brass-400">
        &larr; All boards
      </Link>
      <h1 className="font-display text-2xl text-parchment-100 mt-2 mb-6">Edit board</h1>
      <EditBoardForm boardId={board.id} name={board.name} description={board.description} />
    </div>
  );
}
