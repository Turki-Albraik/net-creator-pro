import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, XCircle, ArrowLeftRight, Ticket } from "lucide-react";
import { generateBarcodeDataUrl } from "@/lib/barcode";
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
  price_per_ticket: number;
}

const SEATS_PER_COACH = 60;
const SEAT_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;
const BUSINESS_MULTIPLIER = 1.5;

const getCoachCount = (totalSeats: number) =>
  Math.max(1, Math.ceil(totalSeats / SEATS_PER_COACH));

const getCoachClass = (coachNum: number, totalCoaches: number): "Business" | "Economy" => {
  if (totalCoaches <= 2) return coachNum === 1 ? "Business" : "Economy";
  return coachNum <= 2 ? "Business" : "Economy";
};

const seatLabel = (coach: number, row: number, letter: string) =>
  `${String(coach).padStart(2, "0")}-${String(row).padStart(2, "0")}${letter}`;

const parseSeat = (label: string) => {
  if (label.includes("-")) {
    const [c, rest] = label.split("-");
    return { coach: parseInt(c, 10), row: parseInt(rest.slice(0, 2), 10), letter: rest.slice(2) };
  }
  return { coach: 1, row: parseInt(label.slice(1), 10) || 0, letter: label.slice(0, 1) };
};

const seatPrice = (label: string, basePrice: number, totalCoaches: number) => {
  const { coach } = parseSeat(label);
  return getCoachClass(coach, totalCoaches) === "Business"
    ? basePrice * BUSINESS_MULTIPLIER
    : basePrice;
};

const computeTotal = (seats: string[], basePrice: number, totalCoaches: number, fallbackTickets: number) => {
  if (seats.length === 0) return basePrice * fallbackTickets;
  return seats.reduce((sum, s) => sum + seatPrice(s, basePrice, totalCoaches), 0);
};

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
  const [activeCoach, setActiveCoach] = useState(1);
  const [presentOpen, setPresentOpen] = useState(false);
  const [presentRes, setPresentRes] = useState<Reservation | null>(null);
  const [presentQr, setPresentQr] = useState<string>("");
  const [presentPaxIdx, setPresentPaxIdx] = useState(0);

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
    setActiveCoach(1);

    const { data: route } = await supabase
      .from("train_routes")
      .select("id, total_seats, price_per_ticket")
      .eq("id", res.route_id)
      .single();
    if (route) {
      setRouteInfo(route as unknown as TrainRoute);
      // Default to coach of the first existing seat
      const first = res.seat_numbers?.[0];
      if (first) {
        const { coach } = parseSeat(first);
        setActiveCoach(Math.min(coach, getCoachCount((route as any).total_seats)));
      }
    }

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
    const totalCoaches = routeInfo ? getCoachCount(routeInfo.total_seats) : 1;
    const newTotal = routeInfo
      ? computeTotal(newSeats, routeInfo.price_per_ticket, totalCoaches, selectedRes.num_tickets)
      : selectedRes.total_amount;
    const { error } = await supabase
      .from("reservations")
      .update({ seat_numbers: newSeats, total_amount: newTotal } as any)
      .eq("id", selectedRes.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Seats Updated", description: `Seats changed to ${newSeats.join(", ")}` });
    setSeatDialogOpen(false);
    fetchReservations();
  };

  const openPresentTicket = (res: Reservation) => {
    const barcode = generateBarcodeDataUrl(res.booking_id, {
      dark: "#0B1F17",
      light: "#F4E9B8",
      height: 90,
      width: 2.4,
    });
    setPresentQr(barcode);
    setPresentRes(res);
    setPresentOpen(true);
  };

  const renderSeatGrid = () => {
    if (!routeInfo) return null;
    const totalSeats = routeInfo.total_seats;
    const totalCoaches = getCoachCount(totalSeats);
    const currentCoach = Math.min(activeCoach, totalCoaches);
    const coachClass = getCoachClass(currentCoach, totalCoaches);
    const isBusinessCoach = coachClass === "Business";

    const coachStartIndex = (currentCoach - 1) * SEATS_PER_COACH;
    const seatsInCoach = Math.min(SEATS_PER_COACH, totalSeats - coachStartIndex);
    const rows = Math.ceil(seatsInCoach / SEAT_LETTERS.length);

    const buildSeat = (row: number, letter: string) => {
      const seatIdx = (row - 1) * SEAT_LETTERS.length + SEAT_LETTERS.indexOf(letter as any);
      if (seatIdx >= seatsInCoach) return null;
      return seatLabel(currentCoach, row, letter);
    };

    return (
      <div className="space-y-4 animate-heritage-in">
        {/* Coach selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          <span className="label-caps text-muted-foreground mr-2 shrink-0">Coach</span>
          {Array.from({ length: totalCoaches }).map((_, i) => {
            const coachNum = i + 1;
            const cls = getCoachClass(coachNum, totalCoaches);
            const isActive = coachNum === currentCoach;
            const business = cls === "Business";
            return (
              <button
                key={coachNum}
                onClick={() => setActiveCoach(coachNum)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5",
                  isActive
                    ? business
                      ? "bg-[#B59410] text-white border-[#8a700b] shadow-md"
                      : "bg-secondary text-secondary-foreground border-secondary"
                    : business
                      ? "border-[#B59410] text-[#8a700b] bg-[#B59410]/5 hover:bg-[#B59410]/10"
                      : "border-border bg-card hover:border-secondary/60"
                )}
              >
                {business && <span aria-hidden>★</span>}
                Coach {String(coachNum).padStart(2, "0")}
                <span className="opacity-70 font-normal hidden sm:inline">· {cls}</span>
                <span className="opacity-80 font-normal">· SAR {(routeInfo.price_per_ticket * (business ? BUSINESS_MULTIPLIER : 1)).toFixed(0)}</span>
              </button>
            );
          })}
        </div>

        {/* Class banner */}
        <div className={cn(
          "flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg border text-xs",
          isBusinessCoach ? "border-[#B59410] bg-[#B59410]/5" : "border-border bg-muted/40"
        )}>
          <div className="flex items-center gap-2">
            {isBusinessCoach && <span className="text-[#B59410]">★</span>}
            <span className="font-semibold text-foreground">
              {coachClass} Class · Coach {String(currentCoach).padStart(2, "0")}
            </span>
            <span className="text-muted-foreground">
              · SAR {(routeInfo.price_per_ticket * (isBusinessCoach ? BUSINESS_MULTIPLIER : 1)).toFixed(0)} / seat
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="seat-real !w-4 !h-5 !rounded-md before:!hidden after:!hidden" /> Available</span>
            <span className="flex items-center gap-1.5"><span className="seat-real seat-real-selected !w-4 !h-5 !rounded-md before:!hidden after:!hidden" /> Selected</span>
            <span className="flex items-center gap-1.5"><span className="seat-real seat-real-booked !w-4 !h-5 !rounded-md before:!hidden after:!hidden" /> Booked</span>
          </div>
        </div>

        {/* Carriage */}
        <div className={cn(
          "carriage rounded-3xl p-4 md:p-8 relative overflow-hidden",
          isBusinessCoach && "ring-2 ring-[#B59410]/60"
        )}>
          <div className="flex gap-3 md:gap-5 items-stretch">
            <div className="hidden sm:flex flex-col gap-2 w-10 md:w-14 py-1">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={`lw-${i}`} className="train-window flex-1 min-h-[52px] rounded-xl border border-white/50 shadow-inner" />
              ))}
            </div>

            <div
              className="flex-1 grid gap-y-1.5 gap-x-1"
              style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr)) 24px repeat(3, minmax(0,1fr))" }}
            >
              {Array.from({ length: rows }).map((_, rIdx) => {
                const row = rIdx + 1;
                const renderOne = (letter: string) => {
                  const seat = buildSeat(row, letter);
                  if (!seat) return <div key={`empty-${row}-${letter}`} />;
                  const isBooked = bookedSeats.includes(seat);
                  const isSelected = newSeats.includes(seat);
                  return (
                    <button
                      key={seat}
                      type="button"
                      onClick={() => toggleSeat(seat)}
                      disabled={isBooked}
                      title={`${coachClass} · Seat ${String(row).padStart(2, "0")}${letter}`}
                      className={cn(
                        "seat-real mx-auto",
                        isBusinessCoach && "seat-real-business",
                        isBooked && "seat-real-booked",
                        isSelected && "seat-real-selected"
                      )}
                    >
                      <span className="relative z-10">{String(row).padStart(2, "0")}{letter}</span>
                    </button>
                  );
                };
                return (
                  <div key={`row-${row}`} className="contents">
                    {renderOne("A")}
                    {renderOne("B")}
                    {renderOne("C")}
                    <div className="flex items-center justify-center text-foreground/30 text-[10px] label-caps">
                      {String(row).padStart(2, "0")}
                    </div>
                    {renderOne("D")}
                    {renderOne("E")}
                    {renderOne("F")}
                  </div>
                );
              })}
            </div>

            <div className="hidden sm:flex flex-col gap-2 w-10 md:w-14 py-1">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={`rw-${i}`} className="train-window flex-1 min-h-[52px] rounded-xl border border-white/50 shadow-inner" />
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
          {reservations.length > 0 && (
            <Button className="gap-2" onClick={() => navigate("/reservations/new")}>
              <Plus className="h-4 w-4" /> New Reservation
            </Button>
          )}
        </div>

        <Dialog open={seatDialogOpen} onOpenChange={setSeatDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Reallocate Seats</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mb-2">
              Select {selectedRes?.num_tickets} seat(s). Current: <span className="font-mono text-foreground">{selectedRes?.seat_numbers?.join(", ")}</span>
            </p>
            {renderSeatGrid()}
            <Button onClick={handleSaveSeatChange} disabled={newSeats.length !== (selectedRes?.num_tickets || 0)} className="w-full mt-4">
              Save Seat Changes
            </Button>
          </DialogContent>
        </Dialog>

        {/* Present Ticket Dialog */}
        <Dialog open={presentOpen} onOpenChange={setPresentOpen}>
          <DialogContent className="max-w-md p-0 overflow-hidden border-amber-brand/40">
            <div className="relative p-6" style={{ background: "radial-gradient(circle at 20% 20%, #1A4332 0%, #0B1F17 70%)", color: "#FDFCF5" }}>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl" style={{ color: "#F4E9B8" }}>
                  Boarding Pass
                </DialogTitle>
              </DialogHeader>
              {presentRes && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-[10px] tracking-[3px] uppercase" style={{ color: "#D4B53A" }}>Route</p>
                    <p className="font-display text-2xl mt-1">{presentRes.source} → {presentRes.destination}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] tracking-[2px] uppercase" style={{ color: "#D4B53A" }}>Train</p>
                      <p className="font-semibold">{presentRes.train_id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-[2px] uppercase" style={{ color: "#D4B53A" }}>Date</p>
                      <p className="font-semibold">{presentRes.travel_date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-[2px] uppercase" style={{ color: "#D4B53A" }}>Seats</p>
                      <p className="font-mono font-semibold">{presentRes.seat_numbers?.join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-[2px] uppercase" style={{ color: "#D4B53A" }}>Passenger</p>
                      <p className="font-semibold truncate">{presentRes.passenger_name.split(",")[0]}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center pt-3 border-t border-dashed" style={{ borderColor: "rgba(245,229,184,0.4)" }}>
                    {presentQr && (
                      <img src={presentQr} alt="Barcode" className="rounded-lg max-w-[260px] w-full" style={{ background: "#F4E9B8", padding: 6 }} />
                    )}
                    <p className="font-mono text-xs mt-3 px-3 py-1 rounded" style={{ background: "#F4E9B8", color: "#0B1F17" }}>
                      {presentRes.booking_id}
                    </p>
                    <p className="text-[10px] mt-3 tracking-widest uppercase opacity-70">Show this code at the gate</p>
                  </div>
                </div>
              )}
            </div>
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
                          <Button variant="ghost" size="icon" title="Present ticket" onClick={() => openPresentTicket(r)}>
                            <Ticket className="h-4 w-4 text-primary" />
                          </Button>
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
