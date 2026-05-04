"use client";

import { TransactionCalendar } from "@/components/calendar/transaction-calendar";
import { useCalendarTransactions } from "@/hooks/use-transactions";

export default function CalendarPage() {
  const { data: transactions = [], isLoading } = useCalendarTransactions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transaction Calendar</h1>
        <p className="text-muted-foreground mt-0.5">View all transactions across accounts by date.</p>
      </div>
      {isLoading ? (
        <div className="h-80 bg-muted rounded-xl animate-pulse" />
      ) : (
        <TransactionCalendar transactions={transactions} />
      )}
    </div>
  );
}
