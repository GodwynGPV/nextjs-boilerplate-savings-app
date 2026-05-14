"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { HalfYearStats } from "@/lib/db/schema";

interface Props {
  history: HalfYearStats[];
  limit: number | null;
  currentYear: number;
  currentHalf: 1 | 2;
}

function halfLabel(year: number, half: 1 | 2) {
  return `H${half} · ${year}`;
}

export function BiannualLog({ history, limit, currentYear, currentHalf }: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg font-medium tracking-tight">
            Half-Year Deposits
          </CardTitle>
          {limit !== null && (
            <span className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-foreground/55">
              Limit · {formatCurrency(limit)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deposits yet.</p>
        ) : (
          <div className="space-y-4">
            {history.map(h => {
              const isCurrent = h.year === currentYear && h.half === currentHalf;
              const pct = limit && limit > 0 ? Math.min(100, (h.deposited / limit) * 100) : null;
              const over = limit !== null && h.deposited > limit;
              return (
                <div key={`${h.year}-${h.half}`} className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        isCurrent ? "bg-[var(--tone-violet)]" : "bg-foreground/20"
                      }`} />
                      <span className="font-medium tabular-nums">
                        {halfLabel(h.year, h.half)}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--tone-violet)] font-semibold">
                          Current
                        </span>
                      )}
                    </span>
                    <span className={`tabular-nums ${over ? "text-destructive font-semibold" : ""}`}>
                      <span className="font-display text-base">{formatCurrency(h.deposited)}</span>
                      {limit !== null && (
                        <span className="text-muted-foreground text-xs ml-1">
                          / {formatCurrency(limit)}
                        </span>
                      )}
                    </span>
                  </div>
                  {pct !== null && (
                    <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          over
                            ? "bg-destructive"
                            : isCurrent
                              ? "bg-gradient-to-r from-[var(--tone-violet)] to-[var(--tone-sky)]"
                              : "bg-foreground/40"
                        }`}
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
