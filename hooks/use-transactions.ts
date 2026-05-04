"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Transaction, InsertTransaction } from "@/lib/db/schema";

export function useTransactions(accountId: number) {
  return useQuery<Transaction[]>({
    queryKey: ["transactions", accountId],
    queryFn: () => fetch(`/api/accounts/${accountId}/transactions`).then(r => r.json()),
  });
}

export function useCreateTransaction(accountId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<InsertTransaction, "accountId">) =>
      fetch(`/api/accounts/${accountId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", accountId] });
      qc.invalidateQueries({ queryKey: ["accounts", accountId] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useDeleteTransaction(accountId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetch(`/api/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", accountId] });
      qc.invalidateQueries({ queryKey: ["accounts", accountId] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useCalendarTransactions() {
  return useQuery({
    queryKey: ["calendar"],
    queryFn: () => fetch("/api/calendar").then(r => r.json()),
  });
}
