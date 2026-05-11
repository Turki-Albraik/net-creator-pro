const DashboardHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <header className="relative flex items-center justify-between border-b border-border pb-6">
      <div>
        <p className="label-caps mb-1">Sikkah Railways</p>
        <h1 className="font-display text-3xl font-semibold text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <span className="absolute bottom-0 left-0 h-[2px] w-24 bg-accent" />
    </header>
  );
};

export default DashboardHeader;
