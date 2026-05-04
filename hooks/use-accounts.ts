"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AccountWithAnalytics, InsertAccount } from "@/lib/db/schema";

export function useAccounts() {
  return useQuery<AccountWithAnalytics[]>({
    queryKey: ["accounts"],
    queryFn: () => fetch("/api/accounts").then(r => r.json()),
  });
}

export function useAccount(id: number) {
  return useQuery<AccountWithAnalytics>({
    queryKey: ["accounts", id],
    queryFn: () => fetch(`/api/accounts/${id}`).then(r => r.json()),
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertAccount) =>
      fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      fetch(`/api/accounts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetch(`/api/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}
