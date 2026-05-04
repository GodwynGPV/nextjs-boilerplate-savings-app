import { NextRequest } from "next/server";
import { getAccount, updateAccount, deleteAccount } from "@/lib/db/queries";
import { updateAccountSchema } from "@/lib/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const account = await getAccount(parseInt(id));
  if (!account) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(account);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = updateAccountSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const account = await updateAccount(parseInt(id), parsed.data);
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
