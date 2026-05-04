"use client";

import { PiggyBank } from "lucide-react";
import { AccountCard } from "@/components/accounts/account-card";
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog";
import { useAccounts } from "@/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { data: accounts, isLoading, isError } = useAccounts();

  const totalBalance = accounts?.reduce((s, a) => s + a.analytics.totalBalance, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Savings Dashboard</h1>
          {accounts?.length ? (
            <p className="text-muted-foreground mt-0.5">
              Total across all accounts:{" "}
              <span className="font-semibold text-foreground">{formatCurrency(totalBalance)}</span>
            </p>
          ) : null}
        </div>
        <CreateAccountDialog />
      </div>

      {isError && (
        <p className="text-sm text-destructive">Failed to load accounts. Please try refreshing.</p>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && accounts?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <PiggyBank className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">No accounts yet</h2>
          <p className="text-muted-foreground mt-1 mb-4">
            Create your first savings account to get started.
          </p>
          <CreateAccountDialog />
        </div>
      )}

      {accounts && accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
