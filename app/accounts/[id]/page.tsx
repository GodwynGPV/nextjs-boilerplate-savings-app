"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Download, Pencil, Check, X, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/stats/stat-card";
import { BiannualLimitCard } from "@/components/stats/biannual-limit-card";
import { BiannualLog } from "@/components/stats/biannual-log";
import { ProjectedInterestCard } from "@/components/stats/projected-interest-card";
import { OwnershipChart } from "@/components/charts/ownership-chart";
import { ContributionChart } from "@/components/charts/contribution-chart";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { TransactionHistory } from "@/components/transactions/transaction-history";
import { useAccount, useDeleteAccount, useUpdateAccount } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency, formatDate } from "@/lib/utils";

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-foreground/55">
      {children}
    </p>
  );
}

function CollapsibleSection({
  eyebrow,
  defaultOpen = false,
  children,
}: {
  eyebrow: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="group flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <ChevronDown
          className={`h-3.5 w-3.5 text-foreground/45 transition-transform ${open ? "" : "-rotate-90"}`}
        />
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </section>
  );
}

export default function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const accountId = parseInt(id);
  const router = useRouter();

  const { data: account, isLoading } = useAccount(accountId);
  const { data: transactions = [] } = useTransactions(accountId);
  const { mutate: deleteAccount } = useDeleteAccount();
  const { mutate: updateAccount, isPending: isUpdating } = useUpdateAccount();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  function startEditName() {
    if (!account) return;
    setNameValue(account.name);
    setEditingName(true);
  }

  function cancelEditName() {
    setEditingName(false);
  }

  function saveEditName() {
    if (!account || !nameValue.trim()) return;
    updateAccount({ id: account.id, name: nameValue.trim() }, { onSuccess: () => setEditingName(false) });
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveEditName();
    if (e.key === "Escape") cancelEditName();
  }

  function handleDelete() {
    if (!account) return;
    if (confirm(`Delete "${account.name}" and all its transactions?`)) {
      deleteAccount(account.id, { onSuccess: () => router.push("/") });
    }
  }

  function handleExport() {
    window.location.href = `/api/accounts/${accountId}/export`;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!account) return <p className="text-muted-foreground">Account not found.</p>;

  const { analytics } = account;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  className="font-display text-3xl font-medium h-auto py-0 px-1 w-64"
                  disabled={isUpdating}
                />
                <Button variant="ghost" size="icon" onClick={saveEditName} disabled={isUpdating || !nameValue.trim()}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={cancelEditName} disabled={isUpdating}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="font-display text-3xl font-medium tracking-tight">{account.name}</h1>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={startEditName}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <p className="text-muted-foreground text-sm mt-0.5 tabular-nums">
              {formatCurrency(analytics.totalBalance)} total balance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddTransactionDialog accountId={accountId} members={account.members} />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <SectionEyebrow>At a Glance</SectionEyebrow>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            tone="emerald"
            size="hero"
            label="Total Balance"
            value={analytics.totalBalance}
            className="col-span-2"
            info="Initial balance plus all deposits and recorded interest. The single number that tells you what the account is worth right now."
          />
          <StatCard
            tone="amber"
            label="Last Interest"
            value={analytics.lastInterest?.amount ?? null}
            emptyLabel="None yet"
            info="Most recent interest payout posted to the account. Banks usually credit interest at the end of each cycle — confirms the account is still earning."
          >
            {analytics.lastInterest && (
              <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
                {formatDate(analytics.lastInterest.date)}
              </p>
            )}
          </StatCard>
          <StatCard
            tone={
              analytics.growth.halfOverHalf === null
                ? "slate"
                : analytics.growth.halfOverHalf >= 0
                  ? "emerald"
                  : "rust"
            }
            label="HoH Growth"
            value={analytics.growth.halfOverHalf}
            format="delta-percent"
            emptyLabel="—"
            info="Half-over-Half growth. How much the total balance has changed since the end of the previous half-year. Quick read on whether the account is growing or shrinking this cycle."
          />
        </div>
      </section>

      <CollapsibleSection eyebrow="Composition">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            tone="indigo"
            label="Total Contributions"
            value={analytics.totalContributions}
            info="Sum of every deposit ever made by all members. Excludes interest — this is just the money you put in."
          />
          <StatCard
            tone="amber"
            label="Total Interest"
            value={analytics.totalInterest}
            info="All interest the bank has paid the account, all-time. The portion of the balance that wasn't contributed by you."
          />
          <StatCard
            tone="rust"
            label={account.owner ? `Owner Tax (${account.owner})` : "Owner Tax"}
            value={analytics.ownerTax}
            info="30% of every interest payout is allocated to the account owner before the rest is split among members — compensation for holding the account in their name and paying the BIR's 20% final withholding tax on interest."
          />
          <StatCard
            tone="violet"
            label="Effective Yield (APY)"
            value={analytics.effectiveYield}
            format="percent"
            emptyLabel="—"
            info="Annualized return on the money actually sitting in the account. Computed as total interest ÷ all-time average daily balance, scaled to a year. Lets you compare against the bank's advertised rate."
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        eyebrow={
          <>
            This Half Year <span className="text-foreground/40">·</span> H{analytics.biannual.current.half} {analytics.biannual.current.year}
          </>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BiannualLimitCard accountId={accountId} limit={analytics.biannual.limit} />
          <StatCard
            tone="indigo"
            label="Deposited"
            value={analytics.biannual.current.deposited}
            info="Total deposits made so far in this half-year window. Counts toward the biannual limit."
          />
          <StatCard
            tone="sky"
            label="Remaining"
            value={analytics.biannual.current.remaining}
            emptyLabel="No limit"
            info="Biannual limit minus what's been deposited so far. How much room you still have this half-year before hitting the cap."
          />
          <StatCard
            tone="slate"
            label="Avg Monthly Balance"
            value={analytics.averageMonthlyBalance}
            info="Average of each month's average daily balance within the current half-year. The figure most banks use to compute interest payouts — high ADB means a bigger interest credit."
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ProjectedInterestCard
            accountId={accountId}
            annualRate={analytics.projectedInterest.annualRate}
            halfYearTarget={analytics.projectedInterest.halfYearTarget}
            earnedThisHalf={analytics.projectedInterest.earnedThisHalf}
            remaining={analytics.projectedInterest.remaining}
            variance={analytics.projectedInterest.variance}
            variancePct={analytics.projectedInterest.variancePct}
          />
        </div>
      </CollapsibleSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OwnershipChart analytics={analytics} />
        <ContributionChart analytics={analytics} />
      </div>

      <BiannualLog
        history={analytics.biannual.history}
        limit={analytics.biannual.limit}
        currentYear={analytics.biannual.current.year}
        currentHalf={analytics.biannual.current.half}
      />

      <div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-foreground/55">
              Activity
            </p>
            <h2 className="font-display text-xl font-medium tracking-tight mt-0.5">
              Transaction History
            </h2>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{transactions.length} total</span>
        </div>
        <TransactionHistory accountId={accountId} transactions={transactions} members={account.members} />
      </div>
    </div>
  );
}
