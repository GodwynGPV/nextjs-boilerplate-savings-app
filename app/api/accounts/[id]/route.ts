import { NextRequest } from "next/server";
import { getAccount, deleteAccount } from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const account = await getAccount(parseInt(id));
  if (!account) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(account);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteAccount(parseInt(id));
  return new Response(null, { status: 204 });
}
