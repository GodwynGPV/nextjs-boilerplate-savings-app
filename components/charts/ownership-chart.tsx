"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { AccountAnalytics } from "@/lib/db/schema";

const TONE_VARS = [
  "var(--tone-emerald)",
  "var(--tone-indigo)",
  "var(--tone-amber)",
  "var(--tone-violet)",
  "var(--tone-rust)",
];

export function OwnershipChart({ analytics }: { analytics: AccountAnalytics }) {
  const data = analytics.contributors
    .filter(c => c.totalValue > 0)
    .map(c => ({ name: c.name, value: c.totalValue }));

  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg font-medium tracking-tight">
          Ownership Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={90}
                paddingAngle={3}
                cornerRadius={4}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={TONE_VARS[i % TONE_VARS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] uppercase tracking-[0.14em] text-foreground/55 font-medium">Total</p>
            <p className="font-display text-xl font-medium tabular-nums mt-0.5">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
        <div className="space-y-2 mt-4">
          {analytics.contributors.filter(c => c.totalValue > 0).map((c, i) => (
            <div key={c.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: TONE_VARS[i % TONE_VARS.length] }}
                />
                <span className="font-medium">{c.name}</span>
              </div>
              <div className="text-right tabular-nums">
                <span className="font-medium">{formatCurrency(c.totalValue)}</span>
                <span className="text-muted-foreground ml-2 text-xs">({c.ownershipPercentage.toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
