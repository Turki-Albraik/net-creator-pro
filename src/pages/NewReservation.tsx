import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft, CalendarIcon, Armchair, Clock, Ruler, Train,
  Printer, CheckCircle2, Download,
} from "lucide-react";

interface TrainRoute {
  id: string;
  train_id: string;
  source: string;
  destination: string;
  distance_km: number;
  price_per_ticket: number;
  departure_time: string;
  arrival_time: string;
  total_seats: number;
  status: string;
}

interface PassengerInfo {
  name: string;
  email: string;
}

import { countryCodes } from "@/lib/countryCodes";

type Step = "route" | "seats" | "confirm" | "ticket";

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
};

const validatePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 9;
};

const NewReservation = () => {
  const navigate = useNavigate();
  const ticketRef = useRef<HTMLDivElement>(null);
  const { employee } = useAuth();

  const [routes, setRoutes] = useState<TrainRoute[]>([]);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [availableSeatsCount, setAvailableSeatsCount] = useState<Record<string, number>>({});

  const [step, setStep] = useState<Step>("route");
  const [selectedRoute, setSelectedRoute] = useState<TrainRoute | null>(null);
  const [travelDate, setTravelDate] = useState<Date>();
  const [numTickets, setNumTickets] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<PassengerInfo[]>([{ name: "", email: "" }]);
  const [contactPhone, setContactPhone] = useState("");
  const [contactCountryCode, setContactCountryCode] = useState("+966");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [bookingId, setBookingId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sourceFilter, setSourceFilter] = useState("");
  const [destFilter, setDestFilter] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "departure">("departure");

  useEffect(() => {
    const fetchRoutes = async () => {
      const { data } = await supabase.from("train_routes").select("*").eq("status", "Active");
      if (data) setRoutes(data as unknown as TrainRoute[]);
    };
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (!travelDate) return;
    const fetchCounts = async () => {
      const { data } = await supabase
        .from("reservations")
        .select("route_id, seat_numbers")
        .eq("travel_date", format(travelDate, "yyyy-MM-dd"))
        .eq("status", "Confirmed");
      const counts: Record<string, number> = {};
      if (data) {
        const booked: Record<string, number> = {};
        (data as unknown as { route_id: string; seat_numbers: string[] }[]).forEach((r) => {
          booked[r.route_id] = (booked[r.route_id] || 0) + r.seat_numbers.length;
        });
        routes.forEach((route) => {
          counts[route.id] = route.total_seats - (booked[route.id] || 0);
        });
      } else {
        routes.forEach((route) => {
          counts[route.id] = route.total_seats;
        });
      }
      setAvailableSeatsCount(counts);
    };
    if (routes.length > 0) fetchCounts();
  }, [travelDate, routes]);

  useEffect(() => {
    if (!selectedRoute || !travelDate) return;
    const fetchBooked = async () => {
      const { data } = await supabase
        .from("reservations")
        .select("seat_numbers")
        .eq("route_id", selectedRoute.id)
        .eq("travel_date", format(travelDate, "yyyy-MM-dd"))
        .eq("status", "Confirmed");
      if (data) {
        const seats = (data as unknown as { seat_numbers: string[] }[]).flatMap((r) => r.seat_numbers);
        setBookedSeats(seats);
      }
    };
    fetchBooked();
  }, [selectedRoute, travelDate]);

  useEffect(() => {
    setPassengers((prev) => {
      if (numTickets > prev.length) {
        return [...prev, ...Array(numTickets - prev.length).fill(null).map(() => ({ name: "", email: "" }))];
      }
      return prev.slice(0, numTickets);
    });
    setSelectedSeats([]);
  }, [numTickets]);

  const sources = [...new Set(routes.map((r) => r.source))];
  const destinations = [...new Set(routes.map((r) => r.destination))].filter((d) => d !== sourceFilter);

  const filteredRoutes = routes
    .filter(
      (r) =>
        (!sourceFilter || r.source === sourceFilter) &&
        (!destFilter || r.destination === destFilter)
    )
    .sort((a, b) => {
      if (sortBy === "price") return a.price_per_ticket - b.price_per_ticket;
      return a.departure_time.localeCompare(b.departure_time);
    });

  const toggleSeat = (seat: string) => {
    if (bookedSeats.includes(seat)) return;
    setSelectedSeats((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : prev.length < numTickets ? [...prev, seat] : prev
    );
  };

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    setPassengers((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const validateAllPassengers = (): string | null => {
    if (!contactPhone.trim()) return "Contact phone number is required";
    if (!validatePhone(contactPhone)) return "Contact phone must be exactly 9 digits";
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name.trim()) return `Passenger ${i + 1}: Name is required`;
      if (!p.email.trim()) return `Passenger ${i + 1}: Email is required`;
      if (!validateEmail(p.email)) return `Passenger ${i + 1}: Please enter a valid email address`;
    }
    return null;
  };

  // Bug #17 — Validate seat availability before moving to seat selection
  const handleContinueToSeats = () => {
    if (!selectedRoute || !travelDate) return;
    const avail = availableSeatsCount[selectedRoute.id] ?? selectedRoute.total_seats;
    if (numTickets > avail) {
      toast({ title: "Not Enough Seats", description: `Not enough seats available. Only ${avail} seats left.`, variant: "destructive" });
      return;
    }
    setStep("seats");
  };

  const handleConfirm = async () => {
    if (!selectedRoute || !travelDate) return;
    const validationError = validateAllPassengers();
    if (validationError) {
      toast({ title: "Validation Error", description: validationError, variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    // Bug #9 — Re-check seats for race condition
    const { data: currentBookings } = await supabase
      .from("reservations")
      .select("seat_numbers")
      .eq("route_id", selectedRoute.id)
      .eq("travel_date", format(travelDate, "yyyy-MM-dd"))
      .eq("status", "Confirmed");

    if (currentBookings) {
      const allBooked = (currentBookings as unknown as { seat_numbers: string[] }[]).flatMap((r) => r.seat_numbers);
      const conflicts = selectedSeats.filter((s) => allBooked.includes(s));
      if (conflicts.length > 0) {
        setIsSubmitting(false);
        setBookedSeats(allBooked);
        setSelectedSeats([]);
        toast({ title: "Seat Conflict", description: "Some selected seats were just booked by another user. Please reselect.", variant: "destructive" });
        setStep("seats");
        return;
      }
    }

    // Bug #2 — UUID-based booking ID
    const newBookingId = `BK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const { error } = await supabase.from("reservations").insert({
      booking_id: newBookingId,
      passenger_name: passengers.map((p) => p.name.trim()).join(", "),
      // Bug #11 — Save all passenger emails
      passenger_email: passengers.map((p) => p.email.trim()).join(", "),
      passenger_phone: contactPhone ? `${contactCountryCode}${contactPhone}` : null,
      route_id: selectedRoute.id,
      travel_date: format(travelDate, "yyyy-MM-dd"),
      seat_numbers: selectedSeats,
      num_tickets: numTickets,
      total_amount: numTickets * selectedRoute.price_per_ticket,
      status: "Confirmed",
      // Bug #4 — Store booked_by employee id
      booked_by: employee?.id || null,
    } as any);

    if (error) {
      setIsSubmitting(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Bug #10 — Match passengers by name AND email
    for (let pi = 0; pi < passengers.length; pi++) {
      const p = passengers[pi];
      const tripAmount = selectedRoute.price_per_ticket;
      const fullPhone = pi === 0 && contactPhone ? `${contactCountryCode}${contactPhone}` : undefined;

      const { data: existing } = await supabase
        .from("passengers")
        .select("id, trips, total_spent")
        .eq("name", p.name.trim())
        .eq("email", p.email.trim())
        .maybeSingle();

      if (existing) {
        const updatePayload: any = {
          trips: (existing.trips || 0) + 1,
          total_spent: Number(existing.total_spent || 0) + tripAmount,
          email: p.email.trim() || null,
        };
        // Only set phone when we actually have one — don't overwrite existing
        if (fullPhone !== undefined) updatePayload.phone = fullPhone;
        await supabase.from("passengers").update(updatePayload).eq("id", existing.id);
      } else {
        await supabase.from("passengers").insert({
          name: p.name.trim(),
          email: p.email.trim() || null,
          phone: fullPhone ?? null,
          trips: 1,
          total_spent: tripAmount,
        } as any);
      }
    }

    setIsSubmitting(false);
    setBookingId(newBookingId);
    setStep("ticket");
    toast({ title: "Reservation confirmed!", description: `Booking ${newBookingId} created.` });
  };

  const handlePrintPDF = () => {
    if (!selectedRoute || !travelDate) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const passengersHtml = passengers.map((p, i) => `
      <div class="row"><span class="label">Passenger ${i + 1}</span><span class="value">${p.name}</span></div>
    `).join("");

    printWindow.document.write(`
      <html><head><title>Ticket ${bookingId}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; }
        .ticket { border: 2px solid #1a2744; border-radius: 12px; padding: 32px; max-width: 500px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 16px; margin-bottom: 16px; }
        .header h1 { font-size: 20px; color: #1a2744; margin: 0; }
        .header p { color: #888; font-size: 12px; margin: 4px 0 0; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; }
        .label { color: #888; font-size: 13px; }
        .value { font-weight: 600; font-size: 14px; }
        .route { text-align: center; font-size: 22px; font-weight: 700; color: #1a2744; padding: 12px 0; }
        .seats { text-align: center; background: #f5f5f5; padding: 10px; border-radius: 8px; margin: 12px 0; font-weight: 600; }
        .total { text-align: center; font-size: 24px; font-weight: 700; color: #c77d15; margin-top: 12px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="ticket">
        <div class="header"><h1>🚄 سِـكَّـة</h1><p>E-Ticket</p></div>
        <div class="route">${selectedRoute.source} → ${selectedRoute.destination}</div>
        <div class="row"><span class="label">Booking ID</span><span class="value">${bookingId}</span></div>
        ${passengersHtml}
        <div class="row"><span class="label">Train</span><span class="value">${selectedRoute.train_id}</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${format(travelDate, "PPP")}</span></div>
        <div class="row"><span class="label">Departure</span><span class="value">${selectedRoute.departure_time}</span></div>
        <div class="row"><span class="label">Arrival</span><span class="value">${selectedRoute.arrival_time}</span></div>
        <div class="row"><span class="label">Payment</span><span class="value">${paymentMethod}</span></div>
        <div class="seats">Seats: ${selectedSeats.join(", ")}</div>
        <div class="total">SAR ${(numTickets * selectedRoute.price_per_ticket).toFixed(0)}</div>
      </div>
      <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const renderSeatMap = () => {
    if (!selectedRoute) return null;
    const totalSeats = selectedRoute.total_seats;
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

        <div className="carriage rounded-3xl p-4 md:p-8 relative overflow-hidden">


          <div className="flex gap-3 md:gap-5 items-stretch">
            {/* Left side windows (porthole column) */}
            <div className="hidden sm:flex flex-col gap-2 w-10 md:w-14 py-1">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={`lw-${i}`} className="train-window flex-1 min-h-[40px] rounded-xl border border-white/50 shadow-inner" />
              ))}
            </div>

            <div className="flex-1 grid gap-2.5" style={{ gridTemplateColumns: "1fr 1fr 40px 1fr 1fr" }}>
              {Array.from({ length: rows }).map((_, rowIdx) => {
                const left = [seatLabels[rowIdx * cols], seatLabels[rowIdx * cols + 1]];
                const right = [seatLabels[rowIdx * cols + 2], seatLabels[rowIdx * cols + 3]].filter(Boolean);
                const renderSeat = (seat: string | undefined) => {
                  if (!seat) return <div key={Math.random()} />;
                  const isBooked = bookedSeats.includes(seat);
                  const isSelected = selectedSeats.includes(seat);
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

            {/* Right side windows (porthole column) */}
            <div className="hidden sm:flex flex-col gap-2 w-10 md:w-14 py-1">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={`rw-${i}`} className="train-window flex-1 min-h-[40px] rounded-xl border border-white/50 shadow-inner" />
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
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reservations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">New Reservation</h1>
            <p className="text-sm text-muted-foreground mt-1">Book a train ticket</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6 mb-8">
          {(["route", "seats", "confirm", "ticket"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step === s ? "bg-primary text-primary-foreground" :
                  (["route", "seats", "confirm", "ticket"].indexOf(step) > i)
                    ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {i + 1}
              </div>
              <span className={cn("text-sm font-medium capitalize hidden sm:inline",
                step === s ? "text-foreground" : "text-muted-foreground"
              )}>{s === "route" ? "Select Route" : s === "seats" ? "Choose Seats" : s === "confirm" ? "Confirm" : "Ticket"}</span>
              {i < 3 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {step === "route" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); if (v === destFilter) setDestFilter(""); }}>
                  <SelectTrigger><SelectValue placeholder="Any source" /></SelectTrigger>
                  <SelectContent>
                    {sources.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination</Label>
                <Select value={destFilter} onValueChange={setDestFilter}>
                  <SelectTrigger><SelectValue placeholder="Any destination" /></SelectTrigger>
                  <SelectContent>
                    {destinations.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Travel Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !travelDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {travelDate ? format(travelDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={travelDate}
                      onSelect={setTravelDate}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Number of Tickets</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={numTickets}
                onChange={(e) => setNumTickets(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-32"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-display text-lg font-semibold">Available Routes</h3>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground label-caps">Sort by</Label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as "price" | "departure")}>
                    <SelectTrigger className="w-[200px] h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="departure">Departure Time</SelectItem>
                      <SelectItem value="price">Price (Low to High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {filteredRoutes.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active routes found. Try different filters.</p>
              ) : (
                <div className="grid gap-3">
                  {filteredRoutes.map((r) => {
                    const avail = travelDate ? (availableSeatsCount[r.id] ?? r.total_seats) : r.total_seats;
                    return (
                      <button
                        key={r.id}
                        onClick={() => { setSelectedRoute(r); setSelectedSeats([]); }}
                        className={cn(
                          "w-full text-left p-5 rounded-xl border transition-all",
                          selectedRoute?.id === r.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border bg-card hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Train className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-display font-semibold text-foreground">{r.source} → {r.destination}</p>
                              <p className="text-xs text-muted-foreground font-mono">{r.train_id}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-foreground">SAR {r.price_per_ticket}</p>
                            <p className="text-xs text-muted-foreground">per ticket</p>
                          </div>
                        </div>
                        <div className="flex gap-6 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{r.departure_time} – {r.arrival_time}</span>
                          <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />{r.distance_km} km</span>
                          <span className="flex items-center gap-1"><Armchair className="h-3.5 w-3.5" />{avail}/{r.total_seats} seats available</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                disabled={!selectedRoute || !travelDate}
                onClick={handleContinueToSeats}
              >
                Continue to Seat Selection
              </Button>
            </div>
          </div>
        )}

        {step === "seats" && selectedRoute && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-display font-semibold text-lg">{selectedRoute.source} → {selectedRoute.destination}</p>
                  <p className="text-sm text-muted-foreground">{selectedRoute.train_id} · {travelDate ? format(travelDate, "PPP") : ""}</p>
                </div>
                <Badge variant="secondary">Select {numTickets} seat{numTickets > 1 ? "s" : ""}</Badge>
              </div>
              {renderSeatMap()}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep("route")}>Back</Button>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-mono font-semibold text-foreground">{selectedSeats.join(", ") || "None"}</span>
                </p>
                <p className="text-lg font-bold text-foreground mt-1">
                  Total: SAR {(numTickets * selectedRoute.price_per_ticket).toFixed(0)}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button disabled={selectedSeats.length !== numTickets} onClick={() => setStep("confirm")}>
                Continue to Confirmation
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && selectedRoute && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <h3 className="font-display font-semibold text-lg">Passenger Details</h3>
              {passengers.map((p, i) => (
                <div key={i} className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                  <p className="text-sm font-semibold text-foreground">Passenger {i + 1} — Seat {selectedSeats[i] || "N/A"}</p>
                  <div className="space-y-1.5">
                    <Label>Full Name *</Label>
                    <Input value={p.name} onChange={(e) => updatePassenger(i, "name", e.target.value)} placeholder="e.g. Ahmed Al-Farsi" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input 
                      type="email" 
                      value={p.email} 
                      onChange={(e) => updatePassenger(i, "email", e.target.value)} 
                      placeholder="e.g. ahmed@email.com" 
                    />
                    {p.email && !validateEmail(p.email) && (
                      <p className="text-xs text-destructive">Please enter a valid email address</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-display font-semibold text-lg">Contact Information</h3>
              <div className="space-y-1.5">
                <Label>Phone (9 digits) *</Label>
                <div className="flex gap-2">
                  <Select value={contactCountryCode} onValueChange={setContactCountryCode}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((cc) => (
                        <SelectItem key={cc.code} value={cc.code}>
                          {cc.flag} {cc.code} {cc.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input 
                    value={contactPhone} 
                    onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    placeholder="5XXXXXXXX" 
                    maxLength={9}
                    className="flex-1"
                  />
                </div>
                {contactPhone && !validatePhone(contactPhone) && (
                  <p className="text-xs text-destructive">Phone number must be exactly 9 digits</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-display font-semibold text-lg">Payment Method</h3>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-3">
              <h3 className="font-display font-semibold text-lg">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Route</span><span className="font-medium">{selectedRoute.source} → {selectedRoute.destination}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Train</span><span className="font-mono">{selectedRoute.train_id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{travelDate ? format(travelDate, "PPP") : ""}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>{selectedRoute.departure_time} – {selectedRoute.arrival_time}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Seats</span><span className="font-mono">{selectedSeats.join(", ")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tickets</span><span>{numTickets}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{paymentMethod}</span></div>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between text-base font-bold"><span>Total</span><span>SAR {(numTickets * selectedRoute.price_per_ticket).toFixed(0)}</span></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep("seats")}>Back</Button>
              <Button onClick={handleConfirm} disabled={isSubmitting}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isSubmitting ? "Confirming..." : "Confirm Reservation"}
              </Button>
            </div>
          </div>
        )}

        {step === "ticket" && selectedRoute && (
          <div className="max-w-md mx-auto space-y-6">
            <div ref={ticketRef} className="rounded-2xl border-2 border-primary bg-card p-8 space-y-4">
              <div className="text-center border-b border-dashed border-border pb-4">
                <h2 className="font-display text-xl font-bold text-foreground">🚄 سِـكَّـة</h2>
                <p className="text-xs text-muted-foreground">E-Ticket</p>
              </div>
              <div className="text-center py-3">
                <p className="font-display text-2xl font-bold text-foreground">{selectedRoute.source} → {selectedRoute.destination}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Booking ID</span><span className="font-mono font-bold">{bookingId}</span></div>
                {passengers.map((p, i) => (
                  <div key={i} className="flex justify-between"><span className="text-muted-foreground">Passenger {i + 1}</span><span className="font-medium">{p.name}</span></div>
                ))}
                <div className="flex justify-between"><span className="text-muted-foreground">Train</span><span className="font-mono">{selectedRoute.train_id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{travelDate ? format(travelDate, "PPP") : ""}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Departure</span><span>{selectedRoute.departure_time}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Arrival</span><span>{selectedRoute.arrival_time}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span>{paymentMethod}</span></div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center font-mono font-bold text-foreground">
                Seats: {selectedSeats.join(", ")}
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">SAR {(numTickets * selectedRoute.price_per_ticket).toFixed(0)}</p>
              </div>
              <div className="text-center pt-2">
                <Badge>Confirmed</Badge>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/reservations")}>
                Back to Reservations
              </Button>
              <Button onClick={handlePrintPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download / Print Ticket
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NewReservation;
