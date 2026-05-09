import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, XCircle, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  num_tickets: number;
}

interface TrainRoute {
  id: string;
  total_seats: number;
}

const statusColor = (s: string) => {
  if (s === "Confirmed") return "default" as const;
  if (s === "Cancelled") return "destructive" as const;
  return "secondary" as const;
};

const MyReservations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { employee } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [seatDialogOpen, setSeatDialogOpen] = useState(false);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [newSeats, setNewSeats] = useState<string[]>([]);
  const [routeInfo, setRouteInfo] = useState<TrainRoute | null>(null);

  // Bug #4 — Use booked_by instead of name matching
  const fetchReservations = async () => {
    if (!employee) return;
    const { data } = await (supabase
      .from("reservations")
      .select("*") as any)
      .eq("booked_by", employee.id)
      .order("created_at", { ascending: false });

    if (!data) return;

    const routeIds = [...new Set((data as any[]).map((d) => d.route_id))];
    if (routeIds.length === 0) {
      setReservations([]);
      return;
    }
    const { data: routes } = await supabase
      .from("train_routes")
      .select("id, source, destination, train_id")
      .in("id", routeIds);

    const routeMap: Record<string, any> = {};
    if (routes) (routes as any[]).forEach((r) => { routeMap[r.id] = r; });

    setReservations((data as any[]).map((d) => ({
      ...d,
      source: routeMap[d.route_id]?.source || "",
      destination: routeMap[d.route_id]?.destination || "",
      train_id: routeMap[d.route_id]?.train_id || "",
    })));
  };

  useEffect(() => { fetchReservations(); }, [employee]);

  // Update passenger stats on cancel — match by name AND email
  const handleCancel = async (id: string, bookingId: string) => {
    const { data: resData } = await supabase
      .from("reservations")
      .select("total_amount, passenger_name, passenger_email, num_tickets")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("reservations")
      .update({ status: "Cancelled" } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    if (resData) {
      const names = ((resData as any).passenger_name || "").split(", ");
      const emails = ((resData as any).passenger_email || "").split(", ");
      const perTicketAmount = Number((resData as any).total_amount) / ((resData as any).num_tickets || names.length);
      for (let i = 0; i < names.length; i++) {
        const name = (names[i] || "").trim();
        const email = (emails[i] || "").trim();
        if (!name) continue;
        let q = supabase.from("passengers").select("id, trips, total_spent").eq("name", name);
        if (email) q = q.eq("email", email);
        const { data: passenger } = await q.maybeSingle();
        if (passenger) {
          await supabase.from("passengers").update({
            trips: Math.max(0, (passenger.trips || 0) - 1),
            total_spent: Math.max(0, Number(passenger.total_spent || 0) - perTicketAmount),
          } as any).eq("id", passenger.id);
        }
      }
    }

    toast({ title: "Reservation Cancelled", description: `${bookingId} has been cancelled.` });
    fetchReservations();
  };

  // Bug #13 — Fix passenger stats before deleting cancelled reservation
  const handleDelete = async (id: string, bookingId: string) => {
    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Reservation Deleted", description: `${bookingId} has been deleted.` });
    fetchReservations();
  };

  const openSeatReallocation = async (res: Reservation) => {
    setSelectedRes(res);
    setNewSeats([...res.seat_numbers]);

    const { data: route } = await supabase
      .from("train_routes")
      .select("id, total_seats")
      .eq("id", res.route_id)
      .single();
    if (route) setRouteInfo(route as unknown as TrainRoute);

    const { data } = await supabase
      .from("reservations")
      .select("id, seat_numbers")
      .eq("route_id", res.route_id)
      .eq("travel_date", res.travel_date)
      .eq("status", "Confirmed")
      .neq("id", res.id);

    const booked = (data as any[] || []).flatMap((r) => r.seat_numbers);
    setBookedSeats(booked);
    setSeatDialogOpen(true);
  };

  const toggleSeat = (seat: string) => {
    if (bookedSeats.includes(seat)) return;
    setNewSeats((prev) =>
      prev.includes(seat)
        ? prev.filter((s) => s !== seat)
        : prev.length < (selectedRes?.num_tickets || 1)
        ? [...prev, seat]
        : prev
    );
  };

  const handleSaveSeatChange = async () => {
    if (!selectedRes || newSeats.length !== selectedRes.num_tickets) return;
    const { error } = await supabase
      .from("reservations")
      .update({ seat_numbers: newSeats } as any)
      .eq("id", selectedRes.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Seats Updated", description: `Seats changed to ${newSeats.join(", ")}` });
    setSeatDialogOpen(false);
    fetchReservations();
  };

  const renderSeatGrid = () => {
    if (!routeInfo) return null;
    const totalSeats = routeInfo.total_seats;
    const cols = 4;
    const rows = Math.ceil(totalSeats / cols);
    const seatLabels: string[] = [];
    for (let i = 1; i <= totalSeats; i++) {
      const row = Math.ceil(i / cols);
      const col = ((i - 1) % cols);
      const letter = ["A", "B", "C", "D"][col];
      seatLabels.push(`${letter}${String(row).padStart(2, "0")}`);
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-muted border border-border" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-primary" /> Selected</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-destructive/30" /> Booked</span>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr auto 1fr 1fr" }}>
          {Array.from({ length: rows }).map((_, rowIdx) => {
            const left = [seatLabels[rowIdx * cols], seatLabels[rowIdx * cols + 1]];
            const right = [seatLabels[rowIdx * cols + 2], seatLabels[rowIdx * cols + 3]].filter(Boolean);
            return [
              ...left.map((seat) => (
                <button key={seat} onClick={() => toggleSeat(seat)} disabled={bookedSeats.includes(seat)}
                  className={cn("h-10 rounded-md text-xs font-mono font-medium transition-all border",
                    bookedSeats.includes(seat) ? "bg-destructive/20 text-destructive-foreground/50 border-destructive/30 cursor-not-allowed"
                    : newSeats.includes(seat) ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                    : "bg-muted text-muted-foreground border-border hover:border-primary hover:bg-primary/10"
                  )}>
                  {seat}
                </button>
              )),
              <div key={`aisle-${rowIdx}`} className="flex items-center justify-center text-muted-foreground/30 text-xs">│</div>,
              ...right.map((seat) => (
                <button key={seat} onClick={() => toggleSeat(seat)} disabled={bookedSeats.includes(seat)}
                  className={cn("h-10 rounded-md text-xs font-mono font-medium transition-all border",
                    bookedSeats.includes(seat) ? "bg-destructive/20 text-destructive-foreground/50 border-destructive/30 cursor-not-allowed"
                    : newSeats.includes(seat) ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                    : "bg-muted text-muted-foreground border-border hover:border-primary hover:bg-primary/10"
                  )}>
                  {seat}
                </button>
              )),
            ];
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">My Reservations</h1>
            <p className="text-sm text-muted-foreground mt-1">View and manage your bookings</p>
          </div>
          <Button className="gap-2" onClick={() => navigate("/reservations/new")}>
            <Plus className="h-4 w-4" /> New Reservation
          </Button>
        </div>

        <Dialog open={seatDialogOpen} onOpenChange={setSeatDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Reallocate Seats</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground mb-4">
              Select {selectedRes?.num_tickets} seat(s). Current: {selectedRes?.seat_numbers?.join(", ")}
            </p>
            {renderSeatGrid()}
            <Button onClick={handleSaveSeatChange} disabled={newSeats.length !== (selectedRes?.num_tickets || 0)} className="w-full mt-4">
              Save Seat Changes
            </Button>
          </DialogContent>
        </Dialog>

        <div className="mt-8 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Booking ID</TableHead>
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
                  <TableCell>{r.source} → {r.destination}</TableCell>
                  <TableCell>{r.travel_date}</TableCell>
                  <TableCell className="font-mono">{r.seat_numbers?.join(", ")}</TableCell>
                  <TableCell className="font-medium">SAR {Number(r.total_amount).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={statusColor(r.status)}>{r.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status === "Confirmed" && (
                        <>
                          <Button variant="ghost" size="icon" title="Reallocate seats" onClick={() => openSeatReallocation(r)}>
                            <ArrowLeftRight className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Cancel" onClick={() => handleCancel(r.id, r.booking_id)}>
                            <XCircle className="h-4 w-4 text-secondary" />
                          </Button>
                        </>
                      )}
                      {r.status === "Cancelled" && (
                        <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => handleDelete(r.id, r.booking_id)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reservations.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No reservations yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default MyReservations;
