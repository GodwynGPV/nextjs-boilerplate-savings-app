"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeleteTransaction } from "@/hooks/use-transactions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/lib/db/schema";

export function TransactionHistory({ accountId, transactions }: { accountId: number; transactions: Transaction[] }) {
  const { mutate: deleteTransaction } = useDeleteTransaction(accountId);

  if (!transactions.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">No transactions yet.</p>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2 pr-4">
        {transactions.map(txn => (
          <div key={txn.id} className="flex items-center justify-between py-2 border-b last:border-0">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={txn.type === "interest" ? "secondary" : "default"} className="text-xs capitalize">
                    {txn.type}
                  </Badge>
                  {txn.depositorName && (
                    <span className="text-sm font-medium">{txn.depositorName}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(txn.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${txn.type === "interest" ? "text-green-600" : ""}`}>
                +{formatCurrency(parseFloat(txn.amount))}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm("Delete this transaction?")) deleteTransaction(txn.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
