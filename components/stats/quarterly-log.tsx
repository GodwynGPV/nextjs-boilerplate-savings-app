"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { QuarterStats } from "@/lib/db/schema";

interface Props {
  history: QuarterStats[];
  limit: number | null;
  currentYear: number;
  currentQuarter: number;
}

function quarterLabel(year: number, quarter: number) {
  return `Q${quarter} ${year}`;
}

export function QuarterlyLog({ history, limit, currentYear, currentQuarter }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quarterly Deposits</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deposits yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map(q => {
              const isCurrent = q.year === currentYear && q.quarter === currentQuarter;
              const pct = limit && limit > 0 ? Math.min(100, (q.deposited / limit) * 100) : null;
              const over = limit !== null && q.deposited > limit;
              return (
                <div key={`${q.year}-${q.quarter}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {quarterLabel(q.year, q.quarter)}
                      {isCurrent && <span className="ml-2 text-xs text-muted-foreground">(current)</span>}
                    </span>
                    <span className={over ? "text-destructive font-semibold" : ""}>
                      {formatCurrency(q.deposited)}
                      {limit !== null && (
                        <span className="text-muted-foreground"> / {formatCurrency(limit)}</span>
                      )}
                    </span>
                  </div>
                  {pct !== null && (
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${over ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
