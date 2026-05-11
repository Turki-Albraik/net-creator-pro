import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

const StatCard = ({ title, value, change, changeType = "neutral", icon: Icon }: StatCardProps) => {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 shadow-rail transition-all duration-200 hover:border-rail-gold hover:shadow-rail-gold-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-inter uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="font-playfair text-4xl font-bold text-rail-gold mt-3 leading-none tracking-tight">{value}</p>
          {change && (
            <p
              className={cn(
                "text-xs font-medium mt-3",
                changeType === "positive" && "text-[hsl(var(--rail-success))]",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-rail-gold/30 bg-[hsl(var(--rail-gold)/0.1)] text-rail-gold transition-colors group-hover:bg-[hsl(var(--rail-gold)/0.18)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
