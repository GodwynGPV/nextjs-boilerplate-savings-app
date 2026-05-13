import { eq, desc } from "drizzle-orm";
import { db } from "./index";
import { accounts, transactions, type AccountAnalytics, type AccountWithAnalytics, type QuarterStats } from "./schema";

const OWNER_TAX_RATE = 0.30;

const MS_PER_DAY = 86_400_000;

function quarterOf(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function computeAverageDailyBalance(
  initialBalance: number,
  txns: { amount: number; date: Date }[],
  year: number,
  quarter: number,
): number {
  const periodStart = new Date(year, (quarter - 1) * 3, 1);
  const periodEnd = startOfDay(new Date());
  if (periodEnd.getTime() < periodStart.getTime()) return 0;

  const totalDays = Math.floor((periodEnd.getTime() - periodStart.getTime()) / MS_PER_DAY) + 1;

  let balance = initialBalance;
  const periodTxns: { time: number; amount: number }[] = [];
  for (const t of txns) {
    const day = startOfDay(t.date);
    if (day.getTime() < periodStart.getTime()) {
      balance += t.amount;
    } else if (day.getTime() <= periodEnd.getTime()) {
      periodTxns.push({ time: day.getTime(), amount: t.amount });
    }
  }
  periodTxns.sort((a, b) => a.time - b.time);

  let sum = 0;
  let idx = 0;
  for (let t = periodStart.getTime(); t <= periodEnd.getTime(); t += MS_PER_DAY) {
    while (idx < periodTxns.length && periodTxns[idx].time === t) {
      balance += periodTxns[idx].amount;
      idx++;
    }
    sum += balance;
  }

  return sum / totalDays;
}

function computeQuarterly(
  deposits: { amount: number; date: Date }[],
  limit: number | null,
): AccountAnalytics["quarterly"] {
  const buckets = new Map<string, QuarterStats>();
  for (const d of deposits) {
    const year = d.date.getFullYear();
    const quarter = quarterOf(d.date);
    const key = `${year}-${quarter}`;
    const existing = buckets.get(key);
    if (existing) existing.deposited += d.amount;
    else buckets.set(key, { year, quarter, deposited: d.amount });
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = quarterOf(now);
  const currentKey = `${currentYear}-${currentQuarter}`;
  if (!buckets.has(currentKey)) {
    buckets.set(currentKey, { year: currentYear, quarter: currentQuarter, deposited: 0 });
  }

  const history = Array.from(buckets.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.quarter - a.quarter;
  });

  const current = buckets.get(currentKey)!;

  return {
    limit,
    current: {
      year: current.year,
      quarter: current.quarter,
      deposited: current.deposited,
      remaining: limit === null ? null : limit - current.deposited,
    },
    history,
  };
}

function computeAnalytics(
  initialBalance: number,
  members: string[],
  txns: { type: string; depositorName: string | null; amount: number; date: Date }[],
  owner?: string | null,
  quarterlyLimit?: number | null,
): AccountAnalytics {
  const sorted = [...txns].sort((a, b) => a.date.getTime() - b.date.getTime());

  const deposits = sorted.filter(t => t.type === "deposit");
  const interests = sorted.filter(t => t.type === "interest");

  const totalContributions = deposits.reduce((s, t) => s + t.amount, 0);
  const totalInterest = interests.reduce((s, t) => s + t.amount, 0);
  const totalBalance = initialBalance + totalContributions + totalInterest;

  const interestAllocated: Record<string, number> = Object.fromEntries(members.map(m => [m, 0]));
  const contributed: Record<string, number> = Object.fromEntries(members.map(m => [m, 0]));
  let runningInterest = 0;
  let ownerTax = 0;

  const activeOwner = owner && members.includes(owner) ? owner : null;

  for (const t of sorted) {
    if (t.type === "deposit" && t.depositorName) {
      contributed[t.depositorName] = (contributed[t.depositorName] ?? 0) + t.amount;
    } else if (t.type === "interest") {
      let distributable = t.amount;

      // 30% account owner tax goes to the owner first
      if (activeOwner) {
        const tax = t.amount * OWNER_TAX_RATE;
        interestAllocated[activeOwner] = (interestAllocated[activeOwner] ?? 0) + tax;
        ownerTax += tax;
        distributable = t.amount - tax;
      }

      const snapshotTotal =
        initialBalance +
        Object.values(contributed).reduce((s, v) => s + v, 0) +
        runningInterest;

      if (snapshotTotal > 0) {
        for (const name of members) {
          const snapShare =
            (initialBalance / members.length + (contributed[name] ?? 0) + (interestAllocated[name] ?? 0)) /
            snapshotTotal;
          interestAllocated[name] = (interestAllocated[name] ?? 0) + distributable * snapShare;
        }
      }
      runningInterest += t.amount;
    }
  }

  const totalContrib = Object.values(contributed).reduce((s, v) => s + v, 0);

  const contributors = members.map(name => {
    const totalContributed = contributed[name] ?? 0;
    const allocatedInterest = interestAllocated[name] ?? 0;
    return {
      name,
      totalContributed,
      ownershipPercentage: totalContrib > 0 ? (totalContributed / totalContrib) * 100 : 0,
      allocatedInterest,
      totalValue: totalContributed + allocatedInterest,
    };
  });

  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  function balanceAtDate(date: Date): number {
    const before = sorted.filter(t => t.date <= date);
    return initialBalance + before.reduce((s, t) => s + t.amount, 0);
  }

  const balMonth = balanceAtDate(oneMonthAgo);
  const balYear = balanceAtDate(oneYearAgo);

  const quarterly = computeQuarterly(deposits, quarterlyLimit ?? null);
  const averageDailyBalance = computeAverageDailyBalance(
    initialBalance,
    sorted.map(t => ({ amount: t.amount, date: t.date })),
    quarterly.current.year,
    quarterly.current.quarter,
  );

  return {
    totalBalance,
    totalInterest,
    totalContributions,
    ownerTax,
    contributors,
    growth: {
      monthOverMonth: balMonth > 0 ? ((totalBalance - balMonth) / balMonth) * 100 : 0,
      yearOverYear: balYear > 0 ? ((totalBalance - balYear) / balYear) * 100 : 0,
    },
    quarterly,
    averageDailyBalance,
  };
}

function rowsToAnalytics(
  initialBalance: string,
  members: string[],
  rows: { type: string; depositorName: string | null; amount: string; date: string }[],
  owner?: string | null,
  quarterlyLimit?: string | null,
): AccountAnalytics {
  const txns = rows.map(r => ({
    type: r.type,
    depositorName: r.depositorName,
    amount: parseFloat(r.amount),
    date: new Date(r.date),
  }));
  const limit = quarterlyLimit == null ? null : parseFloat(quarterlyLimit);
  return computeAnalytics(parseFloat(initialBalance), members, txns, owner, limit);
}

export async function getAllAccounts(): Promise<AccountWithAnalytics[]> {
  const rows = await db.query.accounts.findMany({
    with: { transactions: true },
    orderBy: [desc(accounts.createdAt)],
  });

  return rows.map(acc => ({
    ...acc,
    analytics: rowsToAnalytics(acc.initialBalance, acc.members, acc.transactions, acc.owner, acc.quarterlyLimit),
  }));
}

export async function getAccount(id: number): Promise<AccountWithAnalytics | null> {
  const acc = await db.query.accounts.findFirst({
    where: eq(accounts.id, id),
    with: { transactions: { orderBy: [desc(transactions.date), desc(transactions.createdAt)] } },
  });
  if (!acc) return null;
  return { ...acc, analytics: rowsToAnalytics(acc.initialBalance, acc.members, acc.transactions, acc.owner, acc.quarterlyLimit) };
}

export async function createAccount(data: { name: string; initialBalance?: string; members?: string[]; owner?: string | null; quarterlyLimit?: string | null }) {
  const [acc] = await db
    .insert(accounts)
    .values({
      name: data.name,
      initialBalance: data.initialBalance ?? "0",
      members: data.members ?? ["Wil", "Wyn", "Bam"],
      owner: data.owner ?? null,
      quarterlyLimit: data.quarterlyLimit ?? null,
    })
    .returning();
  return acc;
}

export async function updateAccount(id: number, data: { name?: string; owner?: string | null; quarterlyLimit?: string | null }) {
  const [acc] = await db.update(accounts).set(data).where(eq(accounts.id, id)).returning();
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
  depositorName?: string | null;
  amount: string;
  date: string;
}) {
  const [txn] = await db.insert(transactions).values(data).returning();
  return txn;
}

export async function updateTransaction(id: number, data: {
  type?: "deposit" | "interest";
  depositorName?: string | null;
  amount?: string;
  date?: string;
}) {
  const [txn] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
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
