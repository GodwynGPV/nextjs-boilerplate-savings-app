import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

export type StatTone = "emerald" | "indigo" | "amber" | "rust" | "violet" | "sky" | "slate";
export type StatFormat = "currency" | "percent" | "delta-percent";

const TONE_BG: Record<StatTone, string> = {
  emerald: "bg-[var(--tint-emerald)]",
  indigo: "bg-[var(--tint-indigo)]",
  amber: "bg-[var(--tint-amber)]",
  rust: "bg-[var(--tint-rust)]",
  violet: "bg-[var(--tint-violet)]",
  sky: "bg-[var(--tint-sky)]",
  slate: "bg-[var(--tint-slate)]",
};

const TONE_DOT: Record<StatTone, string> = {
  emerald: "bg-[var(--tone-emerald)]",
  indigo: "bg-[var(--tone-indigo)]",
  amber: "bg-[var(--tone-amber)]",
  rust: "bg-[var(--tone-rust)]",
  violet: "bg-[var(--tone-violet)]",
  sky: "bg-[var(--tone-sky)]",
  slate: "bg-[var(--tone-slate)]",
};

interface StatCardProps {
  label: string;
  value: number | null;
  format?: StatFormat;
  /** @deprecated use format */
  isCurrency?: boolean;
  trend?: number;
  trendLabel?: string;
  tone?: StatTone;
  size?: "default" | "hero";
  emptyLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

function renderValue(value: number, format: StatFormat) {
  if (format === "currency") return formatCurrency(value);
  if (format === "percent") return `${value.toFixed(2)}%`;
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function StatCard({
  label,
  value,
  format,
  isCurrency,
  trend,
  trendLabel,
  tone = "slate",
  size = "default",
  emptyLabel = "—",
  children,
  className,
}: StatCardProps) {
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend === undefined ? "" : trend > 0 ? "text-[var(--tone-emerald)]" : trend < 0 ? "text-destructive" : "text-muted-foreground";

  const resolvedFormat: StatFormat = format ?? (isCurrency === false ? "delta-percent" : "currency");
  const isHero = size === "hero";

  return (
    <div className={cn(
      "relative rounded-xl border border-border/60 overflow-hidden",
      TONE_BG[tone],
      isHero ? "px-6 py-6" : "px-5 py-5",
      className,
    )}>
      <div className="flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[tone])} />
        <p className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-foreground/55">
          {label}
        </p>
      </div>
      <p className={cn(
        "font-display leading-tight font-medium mt-2 tabular-nums",
        isHero ? "text-[3rem]" : "text-[1.95rem]",
      )}>
        {value === null ? (
          <span className="text-foreground/35 italic font-normal">{emptyLabel}</span>
        ) : (
          renderValue(value, resolvedFormat)
        )}
      </p>
      {TrendIcon && trend !== undefined && (
        <div className={cn("flex items-center gap-1 mt-1", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}% {trendLabel}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
