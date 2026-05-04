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
import { useCreateAccount } from "@/hooks/use-accounts";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  initialBalance: z.string(),
  membersRaw: z.string().min(1, "At least one member is required"),
  owner: z.string(),
});

type FormData = z.infer<typeof schema>;

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateAccount();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", initialBalance: "0", membersRaw: "Wil, Wyn, Bam", owner: "Bam" },
  });

  function onSubmit(data: FormData) {
    const members = data.membersRaw.split(",").map(s => s.trim()).filter(Boolean);
    const owner = data.owner.trim() || null;
    mutate({ name: data.name, initialBalance: data.initialBalance || "0", members, owner }, {
      onSuccess: () => { reset({ name: "", initialBalance: "0", membersRaw: "Wil, Wyn, Bam", owner: "Bam" }); setOpen(false); },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> New Account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Savings Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input id="name" placeholder="e.g. BDO Savings" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="initialBalance">Initial Balance (₱)</Label>
            <Input id="initialBalance" type="number" step="0.01" placeholder="0.00" {...register("initialBalance")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="membersRaw">Members</Label>
            <Input id="membersRaw" placeholder="Wil, Wyn, Bam" {...register("membersRaw")} />
            <p className="text-xs text-muted-foreground">Comma-separated names of account members.</p>
            {errors.membersRaw && <p className="text-sm text-destructive">{errors.membersRaw.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner">Account Owner</Label>
            <Input id="owner" placeholder="e.g. Bam (leave blank for none)" {...register("owner")} />
            <p className="text-xs text-muted-foreground">Owner receives 30% of interest as an account owner tax.</p>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating…" : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
