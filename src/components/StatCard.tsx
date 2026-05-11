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
    <div className="relative rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-lg overflow-hidden">
      <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
      <div className="flex items-start justify-between">
        <div>
          <p className="label-caps">{title}</p>
          <p className="font-display text-4xl font-bold text-primary mt-3 leading-none">{value}</p>
          {change && (
            <p
              className={cn(
                "text-xs font-medium mt-3",
                changeType === "positive" && "text-train-signal",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/30">
          <Icon className="h-5 w-5 text-accent" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
