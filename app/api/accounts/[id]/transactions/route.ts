import { NextRequest } from "next/server";
import { getTransactions, createTransaction } from "@/lib/db/queries";
import { insertTransactionSchema } from "@/lib/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const txns = await getTransactions(parseInt(id));
  return Response.json(txns);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = insertTransactionSchema.safeParse({ ...body, accountId: parseInt(id) });
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const txn = await createTransaction(parsed.data as Parameters<typeof createTransaction>[0]);
  return Response.json(txn, { status: 201 });
}
