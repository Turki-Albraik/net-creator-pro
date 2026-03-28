import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const DashboardHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <header className="flex items-center justify-between border-b border-border pb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 w-64 bg-card border-border"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-secondary" />
        </Button>
        <Avatar className="h-9 w-9 border-2 border-border">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">TA</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

export default DashboardHeader;
