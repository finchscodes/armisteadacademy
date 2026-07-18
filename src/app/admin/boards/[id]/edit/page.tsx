import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoardForAdmin, getShopItemsForAdmin, getAllItemsForAdmin } from "@/actions/admin";
import { EditBoardForm } from "@/components/edit-board-form";
import { DeleteBoardButton } from "@/components/delete-board-button";
import { ShopItemsEditor } from "@/components/shop-items-editor";

// Forced dynamic — several pages in this app were getting statically
// prerendered at build time despite reading the database, which hit the
// live DB during the Vercel build itself and caused repeated timeouts.
// Every page renders per-request now; none should ever be prerendered.
export const dynamic = "force-dynamic";

export default async function EditBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await getBoardForAdmin(Number(id));
  if (!board) notFound();

  const shopItems = board.kind === "shop" ? await getShopItemsForAdmin(board.id) : null;
  const allItems = board.kind === "class" ? await getAllItemsForAdmin() : [];

  return (
    <div className="max-w-xl">
      <Link href="/admin/boards" className="text-sm text-ink-400 hover:text-gunmetal-400">
        &larr; All boards
      </Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <h1 className="font-display text-2xl text-parchment-100">Edit board</h1>
        <DeleteBoardButton boardId={board.id} boardName={board.name} />
      </div>
      <EditBoardForm
        boardId={board.id}
        name={board.name}
        description={board.description}
        imageUrl={board.imageUrl}
        isClass={board.kind === "class"}
        restrictedYearMin={board.restrictedYearMin}
        restrictedYearMax={board.restrictedYearMax}
        clearance={board.clearance}
        requiredItemId={board.requiredItemId}
        itemOptions={allItems}
      />

      {shopItems && (
        <div className="mt-8">
          <h2 className="font-display text-lg text-gunmetal-400 mb-3">Items</h2>
          <ShopItemsEditor boardId={board.id} items={shopItems} />
        </div>
      )}
    </div>
  );
}
