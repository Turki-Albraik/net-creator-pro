import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const DashboardHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <header className="flex items-center justify-between border-b border-border pb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border-2 border-border">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">TA</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

export default DashboardHeader;
