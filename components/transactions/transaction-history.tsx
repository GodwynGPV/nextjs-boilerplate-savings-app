"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EditTransactionDialog } from "./edit-transaction-dialog";
import { useDeleteTransaction } from "@/hooks/use-transactions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/lib/db/schema";

interface Props {
  accountId: number;
  transactions: Transaction[];
  members: string[];
}

type TypeFilter = "all" | "deposit" | "interest";

export function TransactionHistory({ accountId, transactions, members }: Props) {
  const { mutate: deleteTransaction } = useDeleteTransaction(accountId);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [depositorFilter, setDepositorFilter] = useState<string>("all");

  const depositorOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const m of members) seen.add(m);
    for (const t of transactions) if (t.depositorName) seen.add(t.depositorName);
    return Array.from(seen);
  }, [members, transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (depositorFilter !== "all" && t.depositorName !== depositorFilter) return false;
      return true;
    });
  }, [transactions, typeFilter, depositorFilter]);

  const hasFilter = typeFilter !== "all" || depositorFilter !== "all";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={typeFilter} onValueChange={v => setTypeFilter(v as TypeFilter)}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="interest">Interest</SelectItem>
          </SelectContent>
        </Select>
        <Select value={depositorFilter} onValueChange={setDepositorFilter}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="Depositor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All depositors</SelectItem>
            {depositorOptions.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setTypeFilter("all"); setDepositorFilter("all"); }}
          >
            Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto tabular-nums">
          {hasFilter ? `${filtered.length} of ${transactions.length}` : `${transactions.length}`} shown
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {transactions.length === 0 ? "No transactions yet." : "No transactions match these filters."}
        </p>
      ) : (
        <ScrollArea className="h-[400px] rounded-xl border border-border/60 bg-card">
          <div className="divide-y divide-border/60">
            {filtered.map(txn => {
              const isInterest = txn.type === "interest";
              return (
                <div key={txn.id} className="flex items-center justify-between px-4 py-3 group">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${isInterest ? "bg-[var(--tone-amber)]" : "bg-[var(--tone-indigo)]"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-[0.14em] font-semibold ${
                          isInterest ? "text-[var(--tone-amber)]" : "text-[var(--tone-indigo)]"
                        }`}>
                          {txn.type}
                        </span>
                        {txn.depositorName && (
                          <span className="text-sm font-medium">{txn.depositorName}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">{formatDate(txn.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`font-display text-base font-medium mr-1 tabular-nums ${
                      isInterest ? "text-[var(--tone-emerald)]" : ""
                    }`}>
                      +{formatCurrency(parseFloat(txn.amount))}
                    </span>
                    <EditTransactionDialog accountId={accountId} transaction={txn} members={members} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        if (confirm("Delete this transaction?")) deleteTransaction(txn.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
