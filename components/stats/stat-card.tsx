import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  isCurrency?: boolean;
  trend?: number;
  trendLabel?: string;
}

export function StatCard({ label, value, isCurrency = true, trend, trendLabel }: StatCardProps) {
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend === undefined ? "" : trend > 0 ? "text-green-600" : trend < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">
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
      </CardContent>
    </Card>
  );
}
