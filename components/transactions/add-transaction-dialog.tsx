"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { toISODateString } from "@/lib/utils";

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
  members: string[];
}

export function AddTransactionDialog({ accountId, members }: Props) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateTransaction(accountId);
  const today = toISODateString(new Date());

  const depositForm = useForm<DepositData>({
    resolver: zodResolver(depositSchema),
    defaultValues: { date: today },
  });

  const interestForm = useForm<InterestData>({
    resolver: zodResolver(interestSchema),
    defaultValues: { date: today },
  });

  function onDepositSubmit(data: DepositData) {
    mutate({ type: "deposit", ...data }, {
      onSuccess: () => { depositForm.reset({ date: today }); setOpen(false); },
    });
  }

  function onInterestSubmit(data: InterestData) {
    mutate({ type: "interest", depositorName: null, ...data }, {
      onSuccess: () => { interestForm.reset({ date: today }); setOpen(false); },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" /> Add Transaction</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="deposit">
          <TabsList className="w-full">
            <TabsTrigger value="deposit" className="flex-1">Deposit</TabsTrigger>
            <TabsTrigger value="interest" className="flex-1">Interest</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit">
            <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Depositor</Label>
                <Select onValueChange={v => depositForm.setValue("depositorName", v)}>
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
                <Label htmlFor="d-amount">Amount (₱)</Label>
                <Input id="d-amount" type="number" step="0.01" placeholder="0.00" {...depositForm.register("amount")} />
                {depositForm.formState.errors.amount && (
                  <p className="text-sm text-destructive">{depositForm.formState.errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-date">Date</Label>
                <Input id="d-date" type="date" {...depositForm.register("date")} />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Adding…" : "Add Deposit"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="interest">
            <form onSubmit={interestForm.handleSubmit(onInterestSubmit)} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="i-amount">Interest Amount (₱)</Label>
                <Input id="i-amount" type="number" step="0.01" placeholder="0.00" {...interestForm.register("amount")} />
                {interestForm.formState.errors.amount && (
                  <p className="text-sm text-destructive">{interestForm.formState.errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="i-date">Date</Label>
                <Input id="i-date" type="date" {...interestForm.register("date")} />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Adding…" : "Add Interest"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
