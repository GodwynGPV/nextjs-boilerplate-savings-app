"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/stats/stat-card";
import { OwnershipChart } from "@/components/charts/ownership-chart";
import { ContributionChart } from "@/components/charts/contribution-chart";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { TransactionHistory } from "@/components/transactions/transaction-history";
import { useAccount, useDeleteAccount } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency } from "@/lib/utils";

export default function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const accountId = parseInt(id);
  const router = useRouter();

  const { data: account, isLoading } = useAccount(accountId);
  const { data: transactions = [] } = useTransactions(accountId);
  const { mutate: deleteAccount } = useDeleteAccount();

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
            <h1 className="text-2xl font-bold">{account.name}</h1>
            <p className="text-muted-foreground text-sm">
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
        <StatCard label="Total Balance" value={analytics.totalBalance} />
        <StatCard label="Total Contributions" value={analytics.totalContributions} />
        <StatCard label="Total Interest" value={analytics.totalInterest} />
        <StatCard
          label="Monthly Growth"
          value={analytics.growth.monthOverMonth}
          isCurrency={false}
          trend={analytics.growth.monthOverMonth}
          trendLabel="MoM"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OwnershipChart analytics={analytics} />
        <ContributionChart analytics={analytics} />
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Transaction History</h2>
          <span className="text-sm text-muted-foreground">{transactions.length} transactions</span>
        </div>
        <TransactionHistory accountId={accountId} transactions={transactions} members={account.members} />
      </div>
    </div>
  );
}
