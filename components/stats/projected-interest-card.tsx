"use client";

import { useState } from "react";
import { Pencil, Check, X, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUpdateAccount } from "@/hooks/use-accounts";
import { formatCurrency } from "@/lib/utils";

interface Props {
  accountId: number;
  annualRate: number;
  halfYearTarget: number;
  earnedThisHalf: number;
  remaining: number;
  variance: number;
  variancePct: number | null;
}

export function ProjectedInterestCard({
  accountId,
  annualRate,
  halfYearTarget,
  earnedThisHalf,
  remaining,
  variance,
  variancePct,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const { mutate, isPending } = useUpdateAccount();

  const ratePct = annualRate * 100;

  function start() {
    setValue(ratePct.toFixed(2));
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
  }

  function save() {
    const trimmed = value.trim();
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return;
    const rateAsDecimal = (parsed / 100).toFixed(4);
    mutate(
      { id: accountId, annualInterestRate: rateAsDecimal },
      { onSuccess: () => setEditing(false) },
    );
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  }

  const ahead = variance >= 0;
  const VarianceIcon = variance === 0 ? Minus : ahead ? TrendingUp : TrendingDown;
  const varianceColor = variance === 0
    ? "text-muted-foreground"
    : ahead
      ? "text-[var(--tone-emerald)]"
      : "text-destructive";

  return (
    <div className="relative rounded-xl border border-border/60 bg-[var(--tint-amber)] px-5 py-5 overflow-hidden col-span-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--tone-amber)]" />
          <p className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-foreground/55 truncate">
            Projected Interest
          </p>
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={onKey}
                disabled={isPending}
                className="h-6 w-20 px-1.5 text-xs"
              />
              <span className="text-[10.5px] text-foreground/55">% APR</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={save} disabled={isPending}>
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={cancel} disabled={isPending}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={start}
              className="group inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10.5px] uppercase tracking-[0.14em] font-medium text-foreground/55 hover:text-foreground/80 transition-colors"
            >
              <span>({ratePct.toFixed(ratePct % 1 === 0 ? 0 : 2)}% APR)</span>
              <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="About Projected Interest"
                className="inline-flex h-4 w-4 items-center justify-center rounded text-foreground/35 hover:text-foreground/70 transition-colors"
              >
                <Info className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Expected interest this half-year if the bank pays the assumed annual rate on the current Avg Monthly Balance. Click the rate to edit it per account. The variance below shows how the actual payout is tracking against that expectation.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex items-baseline gap-3 mt-2 flex-wrap">
        <p className="font-display text-[1.95rem] leading-tight font-medium tabular-nums">
          {formatCurrency(earnedThisHalf)}
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          of {formatCurrency(halfYearTarget)} expected
        </p>
      </div>

      <div className={`flex items-center gap-1.5 mt-1.5 ${varianceColor}`}>
        <VarianceIcon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium tabular-nums">
          {ahead && variance > 0 ? "+" : ""}{formatCurrency(variance)}
          {variancePct !== null && (
            <span className="ml-1 opacity-80">
              ({ahead && variancePct >= 0 ? "+" : ""}{variancePct.toFixed(1)}%)
            </span>
          )}
          <span className="ml-1.5 text-foreground/55 font-normal">
            {variance === 0
              ? "on target"
              : ahead
                ? "ahead of target"
                : `· ${formatCurrency(remaining)} to go`}
          </span>
        </span>
      </div>
    </div>
  );
}
