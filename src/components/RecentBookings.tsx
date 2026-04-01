import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface Booking {
  id: string;
  booking_id: string;
  passenger_name: string;
  total_amount: number;
  created_at: string;
  route_id: string;
  source?: string;
  destination?: string;
}

const getInitials = (name: string) =>
  name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const RecentBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data } = await supabase
        .from("reservations")
        .select("id, booking_id, passenger_name, total_amount, created_at, route_id")
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) {
        // Fetch route info
        const routeIds = [...new Set((data as any[]).map((d) => d.route_id))];
        const { data: routes } = await supabase
          .from("train_routes")
          .select("id, source, destination")
          .in("id", routeIds);
        
        const routeMap: Record<string, { source: string; destination: string }> = {};
        if (routes) {
          (routes as any[]).forEach((r) => { routeMap[r.id] = { source: r.source, destination: r.destination }; });
        }

        setBookings((data as any[]).map((d) => ({
          ...d,
          source: routeMap[d.route_id]?.source || "",
          destination: routeMap[d.route_id]?.destination || "",
        })));
      }
    };
    fetchBookings();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-5 border-b border-border">
        <h3 className="font-display text-lg font-semibold text-card-foreground">Recent Bookings</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Latest reservation activity</p>
      </div>
      <div className="divide-y divide-border">
        {bookings.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No bookings yet</div>
        )}
        {bookings.map((b) => (
          <div key={b.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{getInitials(b.passenger_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-card-foreground">{b.passenger_name}</p>
                <p className="text-xs text-muted-foreground">{b.source} → {b.destination}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-card-foreground">SAR {Number(b.total_amount).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentBookings;
