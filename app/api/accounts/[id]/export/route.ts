import { NextRequest } from "next/server";
import { getAccount, getTransactions } from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accountId = parseInt(id);

  const [account, transactions] = await Promise.all([
    getAccount(accountId),
    getTransactions(accountId),
  ]);

  if (!account) return Response.json({ error: "Not found" }, { status: 404 });

  const rows = [
    ["Date", "Type", "Depositor", "Amount (PHP)"],
    ...transactions.map(t => [
      t.date,
      t.type,
      t.depositorName ?? "",
      t.amount,
    ]),
  ];

  const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${account.name.replace(/[^a-z0-9]/gi, "_")}_transactions.csv"`,
    },
  });
}
