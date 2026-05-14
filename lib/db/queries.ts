import { eq, desc } from "drizzle-orm";
import { db } from "./index";
import { accounts, transactions, type AccountAnalytics, type AccountWithAnalytics, type HalfYearStats } from "./schema";

const OWNER_TAX_RATE = 0.30;
const DEFAULT_ANNUAL_INTEREST_RATE = 0.17;

const MS_PER_DAY = 86_400_000;
const HALF_YEAR_MONTHS = 6;

function halfOf(date: Date): 1 | 2 {
  return date.getMonth() < 6 ? 1 : 2;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function halfStart(year: number, half: 1 | 2): Date {
  return new Date(year, half === 1 ? 0 : 6, 1);
}

function halfEnd(year: number, half: 1 | 2): Date {
  // last day of June (half 1) or December (half 2)
  return new Date(year, half === 1 ? 6 : 12, 0);
}

// O(n_txns) average daily balance: walk the piecewise-constant balance curve
// segment-by-segment instead of day-by-day.
function adbOverPeriod(
  initialBalance: number,
  txns: { amount: number; date: Date }[],
  periodStart: Date,
  periodEnd: Date,
): number {
  if (periodEnd.getTime() < periodStart.getTime()) return 0;
  const totalDays = Math.floor((periodEnd.getTime() - periodStart.getTime()) / MS_PER_DAY) + 1;

  // Group by day, applying anything before the period to the opening balance.
  let balanceAtStart = initialBalance;
  const dayDeltas = new Map<number, number>();
  for (const t of txns) {
    const day = startOfDay(t.date).getTime();
    if (day < periodStart.getTime()) {
      balanceAtStart += t.amount;
    } else if (day <= periodEnd.getTime()) {
      dayDeltas.set(day, (dayDeltas.get(day) ?? 0) + t.amount);
    }
  }

  const deltaDays = Array.from(dayDeltas.entries())
    .map(([time, amount]) => ({ time, amount }))
    .sort((a, b) => a.time - b.time);

  let sum = 0;
  let balance = balanceAtStart;
  let cursor = periodStart.getTime();
  for (const { time, amount } of deltaDays) {
    const daysAtPrev = Math.floor((time - cursor) / MS_PER_DAY);
    if (daysAtPrev > 0) sum += balance * daysAtPrev;
    balance += amount;
    cursor = time;
  }
  const trailingDays = Math.floor((periodEnd.getTime() - cursor) / MS_PER_DAY) + 1;
  sum += balance * trailingDays;

  return sum / totalDays;
}

function computeAverageMonthlyBalance(
  initialBalance: number,
  txns: { amount: number; date: Date }[],
  year: number,
  half: 1 | 2,
): number {
  const periodStart = halfStart(year, half);
  const today = startOfDay(new Date());
  const monthsToCover: { start: Date; end: Date }[] = [];
  for (let i = 0; i < HALF_YEAR_MONTHS; i++) {
    const mStart = new Date(periodStart.getFullYear(), periodStart.getMonth() + i, 1);
    if (mStart.getTime() > today.getTime()) break;
    const mEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + i + 1, 0);
    const effectiveEnd = mEnd.getTime() > today.getTime() ? today : mEnd;
    monthsToCover.push({ start: mStart, end: effectiveEnd });
  }
  if (monthsToCover.length === 0) return 0;
  const monthlyAvgs = monthsToCover.map(({ start, end }) =>
    adbOverPeriod(initialBalance, txns, start, end),
  );
  return monthlyAvgs.reduce((s, v) => s + v, 0) / monthlyAvgs.length;
}

function computeBiannual(
  deposits: { amount: number; date: Date }[],
  limit: number | null,
): AccountAnalytics["biannual"] {
  const buckets = new Map<string, HalfYearStats>();
  for (const d of deposits) {
    const year = d.date.getFullYear();
    const half = halfOf(d.date);
    const key = `${year}-${half}`;
    const existing = buckets.get(key);
    if (existing) existing.deposited += d.amount;
    else buckets.set(key, { year, half, deposited: d.amount });
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentHalf = halfOf(now);
  const currentKey = `${currentYear}-${currentHalf}`;
  if (!buckets.has(currentKey)) {
    buckets.set(currentKey, { year: currentYear, half: currentHalf, deposited: 0 });
  }

  const history = Array.from(buckets.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.half - a.half;
  });

  const current = buckets.get(currentKey)!;

  return {
    limit,
    current: {
      year: current.year,
      half: current.half,
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
  biannualLimit?: number | null,
  annualInterestRate: number = DEFAULT_ANNUAL_INTEREST_RATE,
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

  const biannual = computeBiannual(deposits, biannualLimit ?? null);
  const sortedAmountDate = sorted.map(t => ({ amount: t.amount, date: t.date }));
  const averageMonthlyBalance = computeAverageMonthlyBalance(
    initialBalance,
    sortedAmountDate,
    biannual.current.year,
    biannual.current.half,
  );

  // Half-over-Half: balance at end of previous half vs current balance
  const currHalfStart = halfStart(biannual.current.year, biannual.current.half);
  const prevHalfEnd = new Date(currHalfStart.getTime() - MS_PER_DAY);
  const balPrevHalf = balanceAtDate(prevHalfEnd);
  const halfOverHalf = balPrevHalf > 0
    ? ((totalBalance - balPrevHalf) / balPrevHalf) * 100
    : sorted.length > 0 && sorted[0].date.getTime() < currHalfStart.getTime() ? 0 : null;

  // Last interest
  const lastInterestTxn = interests.length > 0 ? interests[interests.length - 1] : null;
  const lastInterest = lastInterestTxn
    ? { date: lastInterestTxn.date.toISOString().slice(0, 10), amount: lastInterestTxn.amount }
    : null;

  // Effective yield = annualized return based on all-time ADB
  let effectiveYield: number | null = null;
  if (sorted.length > 0 && totalInterest > 0) {
    const firstDate = startOfDay(sorted[0].date);
    const today = startOfDay(new Date());
    const days = Math.floor((today.getTime() - firstDate.getTime()) / MS_PER_DAY) + 1;
    if (days >= 30) {
      const allTimeADB = adbOverPeriod(initialBalance, sortedAmountDate, firstDate, today);
      if (allTimeADB > 0) {
        effectiveYield = (totalInterest / allTimeADB) * (365 / days) * 100;
      }
    }
  }

  // Projected interest for the current half-year at the annual rate.
  // halfYearTarget = avgMonthlyBalance * (rate / 2)
  const halfYearTarget = averageMonthlyBalance * (annualInterestRate / 2);
  const currHalfEndDate = halfEnd(biannual.current.year, biannual.current.half);
  const earnedThisHalf = interests
    .filter(t => t.date >= currHalfStart && t.date <= currHalfEndDate)
    .reduce((s, t) => s + t.amount, 0);
  const variance = earnedThisHalf - halfYearTarget;
  const projectedInterest = {
    annualRate: annualInterestRate,
    halfYearTarget,
    earnedThisHalf,
    remaining: Math.max(0, halfYearTarget - earnedThisHalf),
    variance,
    variancePct: halfYearTarget > 0 ? (variance / halfYearTarget) * 100 : null,
  };

  return {
    totalBalance,
    totalInterest,
    totalContributions,
    ownerTax,
    contributors,
    growth: {
      monthOverMonth: balMonth > 0 ? ((totalBalance - balMonth) / balMonth) * 100 : 0,
      yearOverYear: balYear > 0 ? ((totalBalance - balYear) / balYear) * 100 : 0,
      halfOverHalf,
    },
    biannual,
    averageMonthlyBalance,
    projectedInterest,
    lastInterest,
    effectiveYield,
  };
}

function rowsToAnalytics(
  initialBalance: string,
  members: string[],
  rows: { type: string; depositorName: string | null; amount: string; date: string }[],
  owner?: string | null,
  biannualLimit?: string | null,
  annualInterestRate?: string | null,
): AccountAnalytics {
  const txns = rows.map(r => ({
    type: r.type,
    depositorName: r.depositorName,
    amount: parseFloat(r.amount),
    date: new Date(r.date),
  }));
  const limit = biannualLimit == null ? null : parseFloat(biannualLimit);
  const rate = annualInterestRate == null ? DEFAULT_ANNUAL_INTEREST_RATE : parseFloat(annualInterestRate);
  return computeAnalytics(parseFloat(initialBalance), members, txns, owner, limit, rate);
}

export async function getAllAccounts(): Promise<AccountWithAnalytics[]> {
  const rows = await db.query.accounts.findMany({
    with: { transactions: true },
    orderBy: [desc(accounts.createdAt)],
  });

  return rows.map(acc => ({
    ...acc,
    analytics: rowsToAnalytics(acc.initialBalance, acc.members, acc.transactions, acc.owner, acc.biannualLimit, acc.annualInterestRate),
  }));
}

export async function getAccount(id: number): Promise<AccountWithAnalytics | null> {
  const acc = await db.query.accounts.findFirst({
    where: eq(accounts.id, id),
    with: { transactions: { orderBy: [desc(transactions.date), desc(transactions.createdAt)] } },
  });
  if (!acc) return null;
  return { ...acc, analytics: rowsToAnalytics(acc.initialBalance, acc.members, acc.transactions, acc.owner, acc.biannualLimit, acc.annualInterestRate) };
}

export async function createAccount(data: { name: string; initialBalance?: string; members?: string[]; owner?: string | null; biannualLimit?: string | null; annualInterestRate?: string }) {
  const [acc] = await db
    .insert(accounts)
    .values({
      name: data.name,
      initialBalance: data.initialBalance ?? "0",
      members: data.members ?? ["Wil", "Wyn", "Bam"],
      owner: data.owner ?? null,
      biannualLimit: data.biannualLimit ?? null,
      ...(data.annualInterestRate !== undefined ? { annualInterestRate: data.annualInterestRate } : {}),
    })
    .returning();
  return acc;
}

export async function updateAccount(id: number, data: { name?: string; owner?: string | null; biannualLimit?: string | null; annualInterestRate?: string }) {
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
