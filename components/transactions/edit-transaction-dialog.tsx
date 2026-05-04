"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateTransaction } from "@/hooks/use-transactions";
import type { Transaction } from "@/lib/db/schema";

const depositSchema = z.object({
  depositorName: z.string().min(1, "Select a depositor"),
  amount: z.string().min(1).refine(v => parseFloat(v) > 0, "Amount must be positive"),
  date: z.string().min(1),
});

const interestSchema = z.object({
  amount: z.string().min(1).refine(v => parseFloat(v) > 0, "Amount must be positive"),
  date: z.string().min(1),
});

type DepositData = z.infer<typeof depositSchema>;
type InterestData = z.infer<typeof interestSchema>;

interface Props {
  accountId: number;
  transaction: Transaction;
  members: string[];
}

export function EditTransactionDialog({ accountId, transaction, members }: Props) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useUpdateTransaction(accountId);

  const depositForm = useForm<DepositData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      depositorName: transaction.depositorName ?? "",
      amount: transaction.amount,
      date: transaction.date,
    },
  });

  const interestForm = useForm<InterestData>({
    resolver: zodResolver(interestSchema),
    defaultValues: {
      amount: transaction.amount,
      date: transaction.date,
    },
  });

  useEffect(() => {
    if (open) {
      depositForm.reset({ depositorName: transaction.depositorName ?? "", amount: transaction.amount, date: transaction.date });
      interestForm.reset({ amount: transaction.amount, date: transaction.date });
    }
  }, [open, transaction]);

  function onDepositSubmit(data: DepositData) {
    mutate({ id: transaction.id, data: { type: "deposit", ...data } }, {
      onSuccess: () => setOpen(false),
    });
  }

  function onInterestSubmit(data: InterestData) {
    mutate({ id: transaction.id, data: { type: "interest", depositorName: null, ...data } }, {
      onSuccess: () => setOpen(false),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        {transaction.type === "deposit" ? (
          <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Depositor</Label>
              <Select
                defaultValue={transaction.depositorName ?? undefined}
                onValueChange={v => depositForm.setValue("depositorName", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select depositor" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              {depositForm.formState.errors.depositorName && (
                <p className="text-sm text-destructive">{depositForm.formState.errors.depositorName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-d-amount">Amount (₱)</Label>
              <Input id="edit-d-amount" type="number" step="0.01" {...depositForm.register("amount")} />
              {depositForm.formState.errors.amount && (
                <p className="text-sm text-destructive">{depositForm.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-d-date">Date</Label>
              <Input id="edit-d-date" type="date" {...depositForm.register("date")} />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        ) : (
          <form onSubmit={interestForm.handleSubmit(onInterestSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-i-amount">Interest Amount (₱)</Label>
              <Input id="edit-i-amount" type="number" step="0.01" {...interestForm.register("amount")} />
              {interestForm.formState.errors.amount && (
                <p className="text-sm text-destructive">{interestForm.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-i-date">Date</Label>
              <Input id="edit-i-date" type="date" {...interestForm.register("date")} />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
