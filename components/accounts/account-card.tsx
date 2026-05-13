"use client";

import Link from "next/link";
import { Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteAccount } from "@/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";
import type { AccountWithAnalytics } from "@/lib/db/schema";

const MEMBER_TONES = [
  "bg-[var(--tone-emerald)]",
  "bg-[var(--tone-indigo)]",
  "bg-[var(--tone-amber)]",
  "bg-[var(--tone-violet)]",
  "bg-[var(--tone-rust)]",
];

export function AccountCard({ account }: { account: AccountWithAnalytics }) {
  const { mutate: deleteAccount } = useDeleteAccount();
  const { analytics } = account;
  const mom = analytics.growth.monthOverMonth;

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (confirm(`Delete "${account.name}" and all its transactions?`)) {
      deleteAccount(account.id);
    }
  }

  const TrendIcon = mom > 0 ? TrendingUp : mom < 0 ? TrendingDown : Minus;
  const trendColor = mom > 0 ? "text-[var(--tone-emerald)]" : mom < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <Link href={`/accounts/${account.id}`} className="group">
      <div className="relative h-full rounded-xl border border-border/60 bg-card p-5 transition-all hover:shadow-[0_2px_24px_-6px_oklch(0_0_0/0.08)] hover:border-border overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-16 -right-16 h-32 w-32 rounded-full opacity-30 bg-[var(--tone-emerald)] blur-2xl group-hover:opacity-50 transition-opacity"
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-foreground/55">
                Account
              </p>
              <h3 className="font-display text-xl font-medium tracking-tight mt-0.5">
                {account.name}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="mt-4">
            <p className="font-display text-3xl font-medium tabular-nums leading-none">
              {formatCurrency(analytics.totalBalance)}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor} tabular-nums`}>
                {mom >= 0 ? "+" : ""}{mom.toFixed(1)}% MoM
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-border/60">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-foreground/55 font-medium">Contributions</p>
              <p className="text-sm font-medium tabular-nums mt-0.5">{formatCurrency(analytics.totalContributions)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-foreground/55 font-medium">Interest</p>
              <p className="text-sm font-medium tabular-nums mt-0.5 text-[var(--tone-amber)]">
                {formatCurrency(analytics.totalInterest)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-4">
            {analytics.contributors.filter(c => c.totalValue > 0).map((c, i) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.04] px-2.5 py-1 text-[11px] font-medium"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${MEMBER_TONES[i % MEMBER_TONES.length]}`} />
                <span>{c.name}</span>
                <span className="text-muted-foreground tabular-nums">{formatCurrency(c.totalValue)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
