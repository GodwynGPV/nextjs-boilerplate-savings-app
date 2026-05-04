import { NextRequest } from "next/server";
import { getAllAccounts, createAccount } from "@/lib/db/queries";
import { insertAccountSchema } from "@/lib/db/schema";

export async function GET() {
  const accounts = await getAllAccounts();
  return Response.json(accounts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = insertAccountSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const account = await createAccount(parsed.data);
  return Response.json(account, { status: 201 });
}
