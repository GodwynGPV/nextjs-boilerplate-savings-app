"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUpdateAccount } from "@/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";

interface Props {
  accountId: number;
  limit: number | null;
}

export function QuarterlyLimitCard({ accountId, limit }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const { mutate, isPending } = useUpdateAccount();

  function start() {
    setValue(limit === null ? "" : String(limit));
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
  }

  function save() {
    const trimmed = value.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) return;
    mutate(
      { id: accountId, quarterlyLimit: parsed === null ? null : String(parsed) },
      { onSuccess: () => setEditing(false) },
    );
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  }

  return (
    <div className="relative rounded-xl border border-border/60 bg-[var(--tint-violet)] px-5 py-5 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--tone-violet)]" />
          <p className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-foreground/55">
            Quarterly Limit
          </p>
        </div>
        {!editing && (
          <button
            onClick={start}
            className="h-6 w-6 inline-flex items-center justify-center rounded-md text-foreground/40 hover:text-foreground/80 transition-colors"
            aria-label="Edit quarterly limit"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-1 mt-2">
          <Input
            autoFocus
            type="number"
            step="0.01"
            min="0"
            placeholder="No limit"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={onKey}
            disabled={isPending}
            className="h-9 text-xl font-display px-1 bg-transparent"
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={save} disabled={isPending}>
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancel} disabled={isPending}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <p className="font-display text-[1.95rem] leading-tight font-medium mt-2 tabular-nums">
          {limit === null ? (
            <span className="text-foreground/35 italic font-normal">Not set</span>
          ) : (
            formatCurrency(limit)
          )}
        </p>
      )}
    </div>
  );
}
