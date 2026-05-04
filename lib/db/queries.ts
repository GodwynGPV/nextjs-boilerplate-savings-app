import { eq, desc } from "drizzle-orm";
import { db } from "./index";
import { accounts, transactions, type AccountAnalytics, type AccountWithAnalytics } from "./schema";

const CONTRIBUTORS = ["Wil", "Wyn", "Bam"] as const;

function computeAnalytics(
  initialBalance: number,
  txns: { type: string; depositorName: string | null; amount: number; date: Date }[]
): AccountAnalytics {
  const sorted = [...txns].sort((a, b) => {
    const d = a.date.getTime() - b.date.getTime();
    return d !== 0 ? d : 0;
  });

  const deposits = sorted.filter(t => t.type === "deposit");
  const interests = sorted.filter(t => t.type === "interest");

  const totalContributions = deposits.reduce((s, t) => s + t.amount, 0);
  const totalInterest = interests.reduce((s, t) => s + t.amount, 0);
  const totalBalance = initialBalance + totalContributions + totalInterest;

  // Snapshot-based interest allocation
  const interestAllocated: Record<string, number> = { Wil: 0, Wyn: 0, Bam: 0 };
  const contributed: Record<string, number> = { Wil: 0, Wyn: 0, Bam: 0 };
  let runningInterest = 0;

  for (const t of sorted) {
    if (t.type === "deposit" && t.depositorName) {
      contributed[t.depositorName] = (contributed[t.depositorName] || 0) + t.amount;
    } else if (t.type === "interest") {
      const snapshotTotal =
        initialBalance +
        Object.values(contributed).reduce((s, v) => s + v, 0) +
        runningInterest;

      if (snapshotTotal > 0) {
        for (const name of CONTRIBUTORS) {
          const snapPersonal =
            (initialBalance / CONTRIBUTORS.length + (contributed[name] || 0) +
              interestAllocated[name]) /
            snapshotTotal;
          interestAllocated[name] = (interestAllocated[name] || 0) + t.amount * snapPersonal;
        }
      }
      runningInterest += t.amount;
    }
  }

  const totalContrib = Object.values(contributed).reduce((s, v) => s + v, 0);

  const contributors = CONTRIBUTORS.map(name => {
    const totalContributed = contributed[name] || 0;
    const allocatedInterest = interestAllocated[name] || 0;
    return {
      name,
      totalContributed,
      ownershipPercentage: totalContrib > 0 ? (totalContributed / totalContrib) * 100 : 0,
      allocatedInterest,
      totalValue: totalContributed + allocatedInterest,
    };
  });

  // Growth calculations
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  function balanceAt(date: Date): number {
    const txnsBefore = sorted.filter(t => t.date <= date);
    return (
      initialBalance +
      txnsBefore.reduce((s, t) => s + (t.type !== "interest" || true ? t.amount : t.amount), 0)
    );
  }

  function balanceAtDate(date: Date): number {
    const before = sorted.filter(t => t.date <= date);
    return initialBalance + before.reduce((s, t) => s + t.amount, 0);
  }

  const balMonth = balanceAtDate(oneMonthAgo);
  const balYear = balanceAtDate(oneYearAgo);

  return {
    totalBalance,
    totalInterest,
    totalContributions,
    contributors,
    growth: {
      monthOverMonth: balMonth > 0 ? ((totalBalance - balMonth) / balMonth) * 100 : 0,
      yearOverYear: balYear > 0 ? ((totalBalance - balYear) / balYear) * 100 : 0,
    },
  };
}

function rowsToAnalytics(
  initialBalance: string,
  rows: { type: string; depositorName: string | null; amount: string; date: string }[]
): AccountAnalytics {
  const txns = rows.map(r => ({
    type: r.type,
    depositorName: r.depositorName,
    amount: parseFloat(r.amount),
    date: new Date(r.date),
  }));
  return computeAnalytics(parseFloat(initialBalance), txns);
}

export async function getAllAccounts(): Promise<AccountWithAnalytics[]> {
  const rows = await db.query.accounts.findMany({
    with: { transactions: true },
    orderBy: [desc(accounts.createdAt)],
  });

  return rows.map(acc => ({
    ...acc,
    analytics: rowsToAnalytics(acc.initialBalance, acc.transactions),
  }));
}

export async function getAccount(id: number): Promise<AccountWithAnalytics | null> {
  const acc = await db.query.accounts.findFirst({
    where: eq(accounts.id, id),
    with: { transactions: { orderBy: [desc(transactions.date), desc(transactions.createdAt)] } },
  });
  if (!acc) return null;
  return { ...acc, analytics: rowsToAnalytics(acc.initialBalance, acc.transactions) };
}

export async function createAccount(data: { name: string; initialBalance?: string }) {
  const [acc] = await db
    .insert(accounts)
    .values({ name: data.name, initialBalance: data.initialBalance ?? "0" })
    .returning();
  return acc;
}

export async function deleteAccount(id: number) {
  await db.delete(transactions).where(eq(transactions.accountId, id));
  await db.delete(accounts).where(eq(accounts.id, id));
}

export async function getTransactions(accountId: number) {
  return db.query.transactions.findMany({
    where: eq(transactions.accountId, accountId),
    orderBy: [desc(transactions.date), desc(transactions.createdAt)],
  });
}

export async function createTransaction(data: {
  accountId: number;
  type: "deposit" | "interest";
  depositorName?: "Wil" | "Wyn" | "Bam" | null;
  amount: string;
  date: string;
}) {
  const [txn] = await db.insert(transactions).values(data).returning();
  return txn;
}

export async function deleteTransaction(id: number) {
  await db.delete(transactions).where(eq(transactions.id, id));
}

export async function getAllTransactions() {
  return db.query.transactions.findMany({
    with: { account: true },
    orderBy: [desc(transactions.date), desc(transactions.createdAt)],
  });
}
