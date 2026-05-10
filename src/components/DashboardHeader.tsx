import { Train } from "lucide-react";

const DashboardHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <header className="border-b border-border pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Train className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border">
          <span className="h-2 w-2 rounded-full bg-train-signal animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">Network Live</span>
        </div>
      </div>
      <div className="rail-strip mt-5 rounded-full opacity-70" />
    </header>
  );
};

export default DashboardHeader;
