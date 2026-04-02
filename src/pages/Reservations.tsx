import { useState, useEffect } from "react";
import { Plus, Trash2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface Reservation {
  id: string;
  booking_id: string;
  passenger_name: string;
  route_id: string;
  travel_date: string;
  seat_numbers: string[];
  total_amount: number;
  status: string;
  source?: string;
  destination?: string;
  train_id?: string;
}

const statusColor = (s: string) => {
  if (s === "Confirmed") return "default" as const;
  if (s === "Cancelled") return "destructive" as const;
  if (s === "Pending") return "secondary" as const;
  return "outline" as const;
};

const Reservations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const fetchReservations = async () => {
    const { data } = await supabase
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data) return;

    const routeIds = [...new Set((data as any[]).map((d) => d.route_id))];
    const { data: routes } = await supabase
      .from("train_routes")
      .select("id, source, destination, train_id")
      .in("id", routeIds);

    const routeMap: Record<string, { source: string; destination: string; train_id: string }> = {};
    if (routes) (routes as any[]).forEach((r) => { routeMap[r.id] = r; });

    setReservations((data as any[]).map((d) => ({
      ...d,
      source: routeMap[d.route_id]?.source || "",
      destination: routeMap[d.route_id]?.destination || "",
      train_id: routeMap[d.route_id]?.train_id || "",
    })));
  };

  useEffect(() => { fetchReservations(); }, []);

  const handleCancel = async (id: string, bookingId: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status: "Cancelled" } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Reservation Cancelled", description: `${bookingId} has been cancelled. Seats are now available.` });
    fetchReservations();
  };

  const handleDelete = async (id: string, bookingId: string) => {
    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Reservation Deleted", description: `${bookingId} has been removed` });
    fetchReservations();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Reservations</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage passenger bookings and tickets</p>
          </div>
          <Button className="gap-2" onClick={() => navigate("/reservations/new")}>
            <Plus className="h-4 w-4" />
            New Reservation
          </Button>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Booking ID</TableHead>
                <TableHead className="font-semibold">Passenger</TableHead>
                <TableHead className="font-semibold">Train</TableHead>
                <TableHead className="font-semibold">Route</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Seats</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-medium">{r.booking_id}</TableCell>
                  <TableCell>{r.passenger_name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{r.train_id}</TableCell>
                  <TableCell>{r.source} → {r.destination}</TableCell>
                  <TableCell>{r.travel_date}</TableCell>
                  <TableCell className="font-mono">{r.seat_numbers?.join(", ")}</TableCell>
                  <TableCell className="font-medium">SAR {Number(r.total_amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(r.status)}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status === "Confirmed" && (
                        <Button variant="ghost" size="icon" title="Cancel reservation" onClick={() => handleCancel(r.id, r.booking_id)}>
                          <XCircle className="h-4 w-4 text-orange-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" title="Delete reservation" onClick={() => handleDelete(r.id, r.booking_id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reservations.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No reservations yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default Reservations;
