import { NextRequest } from "next/server";
import { deleteTransaction } from "@/lib/db/queries";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteTransaction(parseInt(id));
  return new Response(null, { status: 204 });
}
