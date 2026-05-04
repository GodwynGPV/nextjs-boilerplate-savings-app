import { getAllTransactions } from "@/lib/db/queries";

export async function GET() {
  const txns = await getAllTransactions();
  return Response.json(txns);
}
