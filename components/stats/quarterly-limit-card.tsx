"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Quarterly Limit</p>
          {!editing && (
            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1" onClick={start}>
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>
        {editing ? (
          <div className="flex items-center gap-1 mt-1">
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
              className="h-9 text-xl font-bold px-1"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={save} disabled={isPending}>
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancel} disabled={isPending}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-2xl font-bold mt-1">
            {limit === null ? <span className="text-muted-foreground">Not set</span> : formatCurrency(limit)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
