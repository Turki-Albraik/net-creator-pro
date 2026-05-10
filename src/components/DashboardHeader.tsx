const DashboardHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <header className="flex items-center justify-between border-b border-border pb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </header>
  );
};

export default DashboardHeader;
