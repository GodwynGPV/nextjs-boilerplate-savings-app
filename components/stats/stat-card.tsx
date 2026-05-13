import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export type StatTone = "emerald" | "indigo" | "amber" | "rust" | "violet" | "sky" | "slate";

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
  value: number;
  isCurrency?: boolean;
  trend?: number;
  trendLabel?: string;
  tone?: StatTone;
  children?: React.ReactNode;
}

export function StatCard({ label, value, isCurrency = true, trend, trendLabel, tone = "slate", children }: StatCardProps) {
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend === undefined ? "" : trend > 0 ? "text-[var(--tone-emerald)]" : trend < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <div className={`relative rounded-xl border border-border/60 ${TONE_BG[tone]} px-5 py-5 overflow-hidden`}>
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} />
        <p className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-foreground/55">
          {label}
        </p>
      </div>
      <p className="font-display text-[1.95rem] leading-tight font-medium mt-2 tabular-nums">
        {isCurrency ? formatCurrency(value) : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`}
      </p>
      {TrendIcon && trend !== undefined && (
        <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
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
