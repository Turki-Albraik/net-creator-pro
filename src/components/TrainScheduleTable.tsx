import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface Schedule {
  id: string;
  train_id: string;
  source: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  total_seats: number;
  booked: number;
  status: string;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "Active": return "default" as const;
    case "Maintenance": return "secondary" as const;
    case "Inactive": return "destructive" as const;
    case "Full": return "secondary" as const;
    default: return "outline" as const;
  }
};

const TrainScheduleTable = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    const fetchSchedules = async () => {
      const { data: routes } = await supabase.from("train_routes").select("*");
      if (!routes) return;

      const today = format(new Date(), "yyyy-MM-dd");
      const { data: reservations } = await supabase
        .from("reservations")
        .select("route_id, seat_numbers")
        .eq("travel_date", today)
        .eq("status", "Confirmed");

      const bookedMap: Record<string, number> = {};
      if (reservations) {
        (reservations as any[]).forEach((r) => {
          bookedMap[r.route_id] = (bookedMap[r.route_id] || 0) + r.seat_numbers.length;
        });
      }

      setSchedules((routes as any[]).map((r) => ({
        id: r.id,
        train_id: r.train_id,
        source: r.source,
        destination: r.destination,
        departure_time: r.departure_time,
        arrival_time: r.arrival_time,
        total_seats: r.total_seats,
        booked: bookedMap[r.id] || 0,
        status: r.status || "Active",
      })));
    };
    fetchSchedules();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-5 border-b border-border">
        <h3 className="font-display text-lg font-semibold text-card-foreground">Today's Schedules</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Live overview of active train services</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold">Train ID</TableHead>
            <TableHead className="font-semibold">Route</TableHead>
            <TableHead className="font-semibold">Departure</TableHead>
            <TableHead className="font-semibold">Arrival</TableHead>
            <TableHead className="font-semibold">Occupancy</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No trains scheduled</TableCell></TableRow>
          )}
          {schedules.map((s) => {
            const occupancy = s.total_seats > 0 ? (s.booked / s.total_seats) * 100 : 0;
            // Show "Full" if all seats booked, otherwise show the status from schedules
            const displayStatus = s.booked >= s.total_seats ? "Full" : s.status;
            return (
              <TableRow key={s.id}>
                <TableCell className="font-mono font-medium text-foreground">{s.train_id}</TableCell>
                <TableCell>{s.source} → {s.destination}</TableCell>
                <TableCell>{s.departure_time}</TableCell>
                <TableCell>{s.arrival_time}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${Math.min(occupancy, 100)}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{s.booked}/{s.total_seats}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(displayStatus)}>{displayStatus}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TrainScheduleTable;
