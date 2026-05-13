"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { AccountAnalytics } from "@/lib/db/schema";

export function ContributionChart({ analytics }: { analytics: AccountAnalytics }) {
  const data = analytics.contributors
    .filter(c => c.totalContributed > 0 || c.allocatedInterest > 0)
    .map(c => ({
      name: c.name,
      Contributions: c.totalContributed,
      Interest: c.allocatedInterest,
    }));

  if (!data.length) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg font-medium tracking-tight">
          Contributions vs Interest
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v) => formatCurrency(Number(v))}
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.5rem" }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="Contributions" fill="var(--tone-indigo)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Interest" fill="var(--tone-amber)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
