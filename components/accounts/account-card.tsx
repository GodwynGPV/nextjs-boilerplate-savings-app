"use client";

import Link from "next/link";
import { Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeleteAccount } from "@/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";
import type { AccountWithAnalytics } from "@/lib/db/schema";

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
  const trendColor = mom > 0 ? "text-green-600" : mom < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <Link href={`/accounts/${account.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{account.name}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-2xl font-bold">{formatCurrency(analytics.totalBalance)}</p>
            <p className="text-xs text-muted-foreground">Current Balance</p>
          </div>
          <div className="flex items-center gap-2">
            <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
            <span className={`text-xs font-medium ${trendColor}`}>
              {mom >= 0 ? "+" : ""}{mom.toFixed(1)}% MoM
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <p className="text-sm font-medium">{formatCurrency(analytics.totalContributions)}</p>
              <p className="text-xs text-muted-foreground">Contributions</p>
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">{formatCurrency(analytics.totalInterest)}</p>
              <p className="text-xs text-muted-foreground">Interest</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {analytics.contributors.filter(c => c.totalValue > 0).map(c => (
              <Badge key={c.name} variant="secondary" className="text-xs">
                {c.name}: {formatCurrency(c.totalValue)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
