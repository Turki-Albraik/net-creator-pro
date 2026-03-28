import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const bookings = [
  { id: "BK-4821", passenger: "Ahmed Al-Farsi", initials: "AF", route: "Riyadh → Jeddah", time: "2 min ago", amount: "SAR 250" },
  { id: "BK-4820", passenger: "Sara Al-Qahtani", initials: "SQ", route: "Jeddah → Madinah", time: "8 min ago", amount: "SAR 180" },
  { id: "BK-4819", passenger: "Omar Al-Rashid", initials: "OR", route: "Dammam → Riyadh", time: "15 min ago", amount: "SAR 220" },
  { id: "BK-4818", passenger: "Noura Al-Shehri", initials: "NS", route: "Riyadh → Dammam", time: "22 min ago", amount: "SAR 200" },
  { id: "BK-4817", passenger: "Khalid Al-Mutairi", initials: "KM", route: "Madinah → Riyadh", time: "30 min ago", amount: "SAR 280" },
];

const RecentBookings = () => {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-5 border-b border-border">
        <h3 className="font-display text-lg font-semibold text-card-foreground">Recent Bookings</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Latest reservation activity</p>
      </div>
      <div className="divide-y divide-border">
        {bookings.map((b) => (
          <div key={b.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{b.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-card-foreground">{b.passenger}</p>
                <p className="text-xs text-muted-foreground">{b.route}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-card-foreground">{b.amount}</p>
              <p className="text-xs text-muted-foreground">{b.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentBookings;
