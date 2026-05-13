"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Download, Pencil, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/stats/stat-card";
import { QuarterlyLimitCard } from "@/components/stats/quarterly-limit-card";
import { QuarterlyLog } from "@/components/stats/quarterly-log";
import { OwnershipChart } from "@/components/charts/ownership-chart";
import { ContributionChart } from "@/components/charts/contribution-chart";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { TransactionHistory } from "@/components/transactions/transaction-history";
import { useAccount, useDeleteAccount, useUpdateAccount } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency } from "@/lib/utils";

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard tone="emerald" label="Total Balance" value={analytics.totalBalance} />
        <StatCard tone="indigo" label="Total Contributions" value={analytics.totalContributions} />
        <StatCard tone="amber" label="Total Interest" value={analytics.totalInterest} />
        {analytics.ownerTax > 0 ? (
          <StatCard tone="rust" label={`Owner Tax (${account.owner})`} value={analytics.ownerTax} />
        ) : (
          <StatCard
            tone="rust"
            label="Monthly Growth"
            value={analytics.growth.monthOverMonth}
            isCurrency={false}
            trend={analytics.growth.monthOverMonth}
            trendLabel="MoM"
          />
        )}
        <QuarterlyLimitCard accountId={accountId} limit={analytics.quarterly.limit} />
        {analytics.quarterly.current.remaining === null ? (
          <StatCard
            tone="sky"
            label={`Q${analytics.quarterly.current.quarter} ${analytics.quarterly.current.year} Deposited`}
            value={analytics.quarterly.current.deposited}
          />
        ) : (
          <StatCard
            tone="sky"
            label={`Remaining Q${analytics.quarterly.current.quarter} ${analytics.quarterly.current.year}`}
            value={analytics.quarterly.current.remaining}
          />
        )}
        <StatCard
          tone="slate"
          label={`Avg Daily Balance (Q${analytics.quarterly.current.quarter} ${analytics.quarterly.current.year})`}
          value={analytics.averageDailyBalance}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OwnershipChart analytics={analytics} />
        <ContributionChart analytics={analytics} />
      </div>

      <QuarterlyLog
        history={analytics.quarterly.history}
        limit={analytics.quarterly.limit}
        currentYear={analytics.quarterly.current.year}
        currentQuarter={analytics.quarterly.current.quarter}
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
