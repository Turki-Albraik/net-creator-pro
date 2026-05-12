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
import { generateBarcodeDataUrl } from "@/lib/barcode";
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

const SEATS_PER_COACH = 60;
const ROWS_PER_COACH = 10;
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
  // Supports "02-05A" (new) and legacy "A05" (older bookings) — legacy treated as economy/coach 1
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
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<number | null>(null);
  const holdRafRef = useRef<number | null>(null);

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

  const handlePrintPDF = async () => {
    if (!selectedRoute || !travelDate) return;

    const passengersHtml = passengers.map((p, i) => `
      <div class="row"><span class="label">Passenger ${i + 1}</span><span class="value">${p.name}</span></div>
    `).join("");

    const stubSeat = selectedSeats[0] || "—";

    // Barcode encodes the booking ID (scan-friendly at the gate)
    const barcodeDataUrl = generateBarcodeDataUrl(bookingId, {
      dark: "#0B1F17",
      light: "#F4E9B8",
      height: 80,
      width: 2,
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html><head><title>Ticket ${bookingId}</title>
      <style>
        @page { size: A5 landscape; margin: 12mm; }
        * { box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', system-ui, sans-serif;
          margin: 0; padding: 28px;
          background: radial-gradient(circle at 20% 20%, #1A4332 0%, #0B1F17 70%);
          min-height: 100vh;
        }
        .ticket {
          display: grid;
          grid-template-columns: 1fr 200px;
          max-width: 760px; margin: 0 auto;
          background: linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06));
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid #B59410;
          border-radius: 18px;
          box-shadow: 0 30px 60px -20px rgba(0,0,0,0.5);
          overflow: hidden;
          color: #FDFCF5;
        }
        .main { padding: 26px 30px; position: relative; }
        .stub { padding: 26px 18px; border-left: 2px dashed rgba(245,229,184,0.55); text-align: center; }
        .brand { display:flex; align-items:center; gap:10px; margin-bottom: 14px; }
        .brand h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; margin:0; color: #F4E9B8; letter-spacing: 1px; }
        .brand small { color:#D4B53A; font-size:10px; letter-spacing:3px; text-transform:uppercase; }
        .route { font-family: 'Playfair Display', Georgia, serif; font-size: 30px; font-weight: 700; margin: 8px 0 18px; color:#fff; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; margin-top: 6px; }
        .cell .label { color:#D4B53A; font-size:9px; letter-spacing:2px; text-transform:uppercase; display:block; margin-bottom:3px; }
        .cell .value { font-size:14px; font-weight:600; color:#fff; }
        .row { display:flex; justify-content:space-between; padding:5px 0; font-size:13px; }
        .row .label { color:#D4B53A; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; }
        .row .value { color:#fff; font-weight:600; }
        .seats { margin-top: 18px; padding:10px 14px; border:1px solid rgba(181,148,16,0.5); border-radius:10px; font-family: monospace; letter-spacing:2px; color:#F4E9B8; text-align:center; font-weight:700; }
        .stub .stub-label { font-size:9px; letter-spacing:3px; color:#D4B53A; text-transform:uppercase; }
        .stub .seat { font-family: 'Playfair Display', Georgia, serif; font-size: 38px; color:#F4E9B8; margin: 6px 0 4px; }
        .stub .qr { margin: 12px auto 6px; padding:6px 8px; background:#F4E9B8; border-radius:8px; display:flex; justify-content:center; }
        .stub .qr img { max-width:160px; height:auto; display:block; }
        .stub .bk { font-family: monospace; font-size:10px; color:#0B1F17; background:#F4E9B8; padding:3px 6px; border-radius:4px; display:inline-block; margin-top:4px; letter-spacing:1px; }
        .total { margin-top:16px; padding-top:14px; border-top:1px solid rgba(245,229,184,0.3); display:flex; justify-content:space-between; align-items:baseline; }
        .total .lbl { color:#D4B53A; font-size:10px; letter-spacing:2px; text-transform:uppercase; }
        .total .amt { font-family: 'Playfair Display', Georgia, serif; font-size:28px; color:#F4E9B8; font-weight:700; }
        @media print { body { background: #0B1F17 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>
      <div class="ticket">
        <div class="main">
          <div class="brand">
            <h1>سِـكَّـة</h1>
            <small>Sikkah</small>
          </div>
          <div class="route">${selectedRoute.source} → ${selectedRoute.destination}</div>
          <div class="grid">
            <div class="cell"><span class="label">Train</span><span class="value">${selectedRoute.train_id}</span></div>
            <div class="cell"><span class="label">Date</span><span class="value">${format(travelDate, "PPP")}</span></div>
            <div class="cell"><span class="label">Departure</span><span class="value">${selectedRoute.departure_time}</span></div>
            <div class="cell"><span class="label">Arrival</span><span class="value">${selectedRoute.arrival_time}</span></div>
          </div>
          <div style="margin-top:14px">${passengersHtml}</div>
          <div class="seats">SEATS · ${selectedSeats.join("  ·  ")}</div>
          <div class="total">
            <span class="lbl">Total Price</span>
            <span class="amt">SAR ${(numTickets * selectedRoute.price_per_ticket).toFixed(0)}</span>
          </div>
        </div>
        <div class="stub">
          <div class="stub-label">Boarding Pass</div>
          <div class="seat">${stubSeat}</div>
          <div class="qr"><img src="${barcodeDataUrl}" alt="Barcode" /></div>
          <div class="bk">${bookingId}</div>
        </div>
      </div>
      <script>setTimeout(()=>window.print(), 300);</script>
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
              <button
                disabled={isSubmitting}
                onPointerDown={() => {
                  if (isSubmitting) return;
                  const start = performance.now();
                  const tick = () => {
                    const p = Math.min(100, ((performance.now() - start) / 1200) * 100);
                    setHoldProgress(p);
                    if (p < 100) holdRafRef.current = requestAnimationFrame(tick);
                  };
                  holdRafRef.current = requestAnimationFrame(tick);
                  holdTimerRef.current = window.setTimeout(() => {
                    setHoldProgress(100);
                    handleConfirm();
                  }, 1200);
                }}
                onPointerUp={() => {
                  if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                  if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
                  if (holdProgress < 100) setHoldProgress(0);
                }}
                onPointerLeave={() => {
                  if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                  if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
                  if (holdProgress < 100) setHoldProgress(0);
                }}
                className="relative overflow-hidden h-11 px-6 rounded-md btn-brass font-semibold text-sm select-none disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <span
                  className="absolute inset-0 bg-white/25 origin-left transition-none pointer-events-none"
                  style={{ transform: `scaleX(${holdProgress / 100})` }}
                />
                <CheckCircle2 className="h-4 w-4 relative z-10" />
                <span className="relative z-10">
                  {isSubmitting ? "Confirming..." : holdProgress > 0 && holdProgress < 100 ? "Keep holding…" : "Hold to Confirm"}
                </span>
              </button>
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
