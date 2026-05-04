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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Contributions vs Interest</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Legend />
            <Bar dataKey="Contributions" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Interest" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
