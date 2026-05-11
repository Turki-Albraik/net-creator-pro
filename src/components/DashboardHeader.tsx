const DashboardHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <header className="flex items-center justify-between border-b border-border pb-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-rail-gold/80 mb-1.5 font-inter">Rail Connect</p>
        <h1 className="font-playfair text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
      </div>
      <div className="hidden md:block h-12 w-px bg-gradient-to-b from-transparent via-rail-gold/40 to-transparent" />
    </header>
  );
};

export default DashboardHeader;
