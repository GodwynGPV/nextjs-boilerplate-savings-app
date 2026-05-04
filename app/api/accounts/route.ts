import { NextRequest } from "next/server";
import { getAllAccounts, createAccount } from "@/lib/db/queries";
import { insertAccountSchema } from "@/lib/db/schema";

export async function GET() {
  try {
    const accounts = await getAllAccounts();
    return Response.json(accounts);
  } catch (err) {
    console.error("GET /api/accounts failed:", err);
    return Response.json({ error: "Failed to load accounts" }, { status: 500 });
  }
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
