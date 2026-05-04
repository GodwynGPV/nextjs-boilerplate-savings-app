"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { AccountAnalytics } from "@/lib/db/schema";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b"];

export function OwnershipChart({ analytics }: { analytics: AccountAnalytics }) {
  const data = analytics.contributors
    .filter(c => c.totalValue > 0)
    .map(c => ({ name: c.name, value: c.totalValue }));

  if (!data.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Ownership Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 mt-2">
          {analytics.contributors.filter(c => c.totalValue > 0).map((c, i) => (
            <div key={c.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span>{c.name}</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{formatCurrency(c.totalValue)}</span>
                <span className="text-muted-foreground ml-2">({c.ownershipPercentage.toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
