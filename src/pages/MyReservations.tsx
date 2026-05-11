import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, XCircle, ArrowLeftRight, Ticket } from "lucide-react";
import QRCode from "qrcode";
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
  const [presentOpen, setPresentOpen] = useState(false);
  const [presentRes, setPresentRes] = useState<Reservation | null>(null);
  const [presentQr, setPresentQr] = useState<string>("");

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
    if (!window.confirm(`Cancel booking ${bookingId}? Seats will be released.`)) return;
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

  const openPresentTicket = async (res: Reservation) => {
    const payload = JSON.stringify({
      booking: res.booking_id,
      train: res.train_id,
      from: res.source,
      to: res.destination,
      date: res.travel_date,
      seats: res.seat_numbers,
    });
    const qr = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
      color: { dark: "#0B1F17", light: "#F4E9B8" },
    });
    setPresentQr(qr);
    setPresentRes(res);
    setPresentOpen(true);
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
      <div className="space-y-4 animate-heritage-in">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="label-caps text-muted-foreground mr-2">Availability</span>
          <span className="flex items-center gap-1.5"><span className="seat-btn seat-available !h-4 !w-6 !rounded" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="seat-btn seat-selected !h-4 !w-6 !rounded" /> Selected</span>
          <span className="flex items-center gap-1.5"><span className="seat-btn seat-booked !h-4 !w-6 !rounded" /> Booked</span>
        </div>

        <div className="carriage rounded-3xl p-4 md:p-6 relative overflow-hidden">
          <div className="flex gap-3 md:gap-5 items-stretch">
            {/* Left windows */}
            <div className="hidden sm:flex flex-col gap-2 w-10 md:w-12 py-1">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={`lw-${i}`} className="train-window flex-1 min-h-[36px] rounded-xl border border-white/50 shadow-inner" />
              ))}
            </div>

            <div className="flex-1 grid gap-2.5" style={{ gridTemplateColumns: "1fr 1fr 36px 1fr 1fr" }}>
              {Array.from({ length: rows }).map((_, rowIdx) => {
                const left = [seatLabels[rowIdx * cols], seatLabels[rowIdx * cols + 1]];
                const right = [seatLabels[rowIdx * cols + 2], seatLabels[rowIdx * cols + 3]].filter(Boolean);
                const renderSeat = (seat: string | undefined) => {
                  if (!seat) return <div key={Math.random()} />;
                  const isBooked = bookedSeats.includes(seat);
                  const isSelected = newSeats.includes(seat);
                  return (
                    <button
                      key={seat}
                      onClick={() => toggleSeat(seat)}
                      disabled={isBooked}
                      className={cn(
                        "seat-btn",
                        isBooked ? "seat-booked" : isSelected ? "seat-selected" : "seat-available"
                      )}
                    >
                      <span className="relative z-10">{isSelected ? "✓ " : ""}{seat}</span>
                    </button>
                  );
                };
                return (
                  <div key={`row-${rowIdx}`} className="contents">
                    {left.map(renderSeat)}
                    <div className="flex items-center justify-center text-foreground/30 text-[10px] label-caps">
                      {rowIdx + 1}
                    </div>
                    {right.map(renderSeat)}
                  </div>
                );
              })}
            </div>

            {/* Right windows */}
            <div className="hidden sm:flex flex-col gap-2 w-10 md:w-12 py-1">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={`rw-${i}`} className="train-window flex-1 min-h-[36px] rounded-xl border border-white/50 shadow-inner" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-16 pt-20 md:pt-8 px-4 md:px-8 pb-8">
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
                <TableRow>
                  <TableCell colSpan={7} className="py-12">
                    <div className="flex flex-col items-center text-center gap-4">
                      <svg viewBox="0 0 220 120" className="w-56 h-32 opacity-90" fill="none">
                        <defs>
                          <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0" stopColor="hsl(var(--muted))" />
                            <stop offset="1" stopColor="hsl(var(--background))" />
                          </linearGradient>
                        </defs>
                        <rect x="0" y="0" width="220" height="80" fill="url(#sky)" />
                        <rect x="0" y="80" width="220" height="6" fill="hsl(var(--primary))" opacity="0.7" />
                        <rect x="0" y="92" width="220" height="2" fill="hsl(var(--muted-foreground))" opacity="0.4" />
                        {Array.from({ length: 11 }).map((_, i) => (
                          <rect key={i} x={i * 22} y="96" width="14" height="3" fill="hsl(var(--muted-foreground))" opacity="0.3" />
                        ))}
                        <rect x="30" y="40" width="6" height="46" fill="hsl(var(--muted-foreground))" opacity="0.5" />
                        <rect x="20" y="36" width="26" height="6" fill="hsl(var(--primary))" />
                        <circle cx="33" cy="50" r="3" fill="hsl(var(--primary))" opacity="0.6" />
                        <rect x="140" y="55" width="60" height="25" rx="4" fill="hsl(var(--primary))" opacity="0.8" />
                        <rect x="148" y="60" width="10" height="10" fill="hsl(var(--background))" />
                        <rect x="162" y="60" width="10" height="10" fill="hsl(var(--background))" />
                        <rect x="176" y="60" width="10" height="10" fill="hsl(var(--background))" />
                        <circle cx="150" cy="84" r="4" fill="hsl(var(--foreground))" />
                        <circle cx="190" cy="84" r="4" fill="hsl(var(--foreground))" />
                      </svg>
                      <div>
                        <p className="font-display text-lg font-semibold text-foreground">The platform is quiet</p>
                        <p className="text-sm text-muted-foreground mt-1">No reservations yet. Book your first journey to see it here.</p>
                      </div>
                      <Button className="gap-2" onClick={() => navigate("/reservations/new")}>
                        <Plus className="h-4 w-4" /> Book a Journey
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default MyReservations;
