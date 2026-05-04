import { NextRequest } from "next/server";
import { deleteTransaction, updateTransaction } from "@/lib/db/queries";
import { updateTransactionSchema } from "@/lib/db/schema";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const txn = await updateTransaction(parseInt(id), parsed.data);
  return Response.json(txn);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteTransaction(parseInt(id));
  return new Response(null, { status: 204 });
}
