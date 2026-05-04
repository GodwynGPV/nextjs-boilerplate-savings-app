"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/lib/db/schema";

type TxnWithAccount = Transaction & { account: { id: number; name: string } };

function groupByDate(transactions: TxnWithAccount[]): Record<string, TxnWithAccount[]> {
  return transactions.reduce((acc, t) => {
    acc[t.date] = acc[t.date] ? [...acc[t.date], t] : [t];
    return acc;
  }, {} as Record<string, TxnWithAccount[]>);
}

export function TransactionCalendar({ transactions }: { transactions: TxnWithAccount[] }) {
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const byDate = groupByDate(transactions);

  const firstDay = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();

  const monthName = new Date(current.year, current.month).toLocaleDateString("en-PH", { month: "long", year: "numeric" });

  function dateKey(day: number) {
    return `${current.year}-${String(current.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function prevMonth() {
    setCurrent(c => {
      const d = new Date(c.year, c.month - 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrent(c => {
      const d = new Date(c.year, c.month + 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelectedDate(null);
  }

  const selectedTxns = selectedDate ? (byDate[selectedDate] ?? []) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{monthName}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = dateKey(day);
                const txns = byDate[key] ?? [];
                const hasDeposit = txns.some(t => t.type === "deposit");
                const hasInterest = txns.some(t => t.type === "interest");
                const isSelected = selectedDate === key;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    className={`relative aspect-square rounded-md flex flex-col items-center justify-start p-1 text-xs transition-colors ${
                      isSelected ? "bg-primary text-primary-foreground" : txns.length ? "bg-accent hover:bg-accent/80" : "hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium">{day}</span>
                    {txns.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {hasDeposit && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                        {hasInterest && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" }) : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate && <p className="text-sm text-muted-foreground">Click a date to see transactions.</p>}
            {selectedDate && !selectedTxns.length && <p className="text-sm text-muted-foreground">No transactions on this date.</p>}
            {selectedTxns.length > 0 && (
              <div className="space-y-3">
                {selectedTxns.map(txn => (
                  <div key={txn.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={txn.type === "interest" ? "secondary" : "default"} className="text-xs capitalize">
                          {txn.type}
                        </Badge>
                        {txn.depositorName && <span className="text-sm font-medium">{txn.depositorName}</span>}
                      </div>
                      <span className={`text-sm font-semibold ${txn.type === "interest" ? "text-green-600" : ""}`}>
                        +{formatCurrency(parseFloat(txn.amount))}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{txn.account.name}</p>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">{formatCurrency(selectedTxns.reduce((s, t) => s + parseFloat(t.amount), 0))}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
