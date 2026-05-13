import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Loader2 } from "lucide-react";
import { generateBarcodeDataUrl } from "@/lib/barcode";

interface TicketData {
  booking_id: string;
  passenger_name: string;
  travel_date: string;
  seat_numbers: string[];
  total_amount: number;
  num_tickets: number;
  status: string;
  source?: string;
  destination?: string;
  train_id?: string;
  departure_time?: string;
  arrival_time?: string;
  total_seats?: number;
}

const SEATS_PER_COACH = 60;

const getCoachCount = (totalSeats: number) =>
  Math.max(1, Math.ceil((totalSeats || SEATS_PER_COACH) / SEATS_PER_COACH));

const getCoachClass = (coachNum: number, totalCoaches: number): "Business" | "Economy" => {
  if (totalCoaches <= 2) return coachNum === 1 ? "Business" : "Economy";
  return coachNum <= 2 ? "Business" : "Economy";
};

const parseSeat = (label: string) => {
  if (label?.includes("-")) {
    const [c, rest] = label.split("-");
    return { coach: parseInt(c, 10), row: parseInt(rest.slice(0, 2), 10), letter: rest.slice(2) };
  }
  return { coach: 1, row: parseInt((label || "").slice(1), 10) || 0, letter: (label || "").slice(0, 1) };
};

const TicketView = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [qr, setQr] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!bookingId) return;
      const { data: r } = await supabase
        .from("reservations")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (!r) {
        setError("Ticket not found");
        setLoading(false);
        return;
      }

      const { data: route } = await supabase
        .from("train_routes")
        .select("source, destination, train_id, departure_time, arrival_time, total_seats")
        .eq("id", (r as any).route_id)
        .maybeSingle();

      const merged: TicketData = { ...(r as any), ...(route as any) };
      setTicket(merged);

      const barcode = generateBarcodeDataUrl((r as any).booking_id, {
        dark: "#0B1F17",
        light: "#F4E9B8",
        height: 90,
        width: 2.4,
      });
      setQr(barcode);
      setLoading(false);
    };
    load();
  }, [bookingId]);

  const handleDownload = async (onlyIdx: number | "all" = "all") => {
    if (!ticket) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalCoachesPdf = getCoachCount(ticket.total_seats || 0);
    const names = (ticket.passenger_name || "").split(",").map(n => n.trim());
    const seats = ticket.seat_numbers || [];
    const count = Math.max(names.length, seats.length, 1);
    const perPrice = Number(ticket.total_amount) / count;
    const indices = onlyIdx === "all" ? Array.from({ length: count }, (_, i) => i) : [onlyIdx];

    const ticketsHtml = indices.map((i) => {
      const seat = seats[i] || "—";
      const name = names[i] || `Passenger ${i + 1}`;
      const info = seats[i] ? parseSeat(seats[i]) : null;
      const cls = info ? getCoachClass(info.coach, totalCoachesPdf) : null;
      const coachStr = info ? `Coach ${String(info.coach).padStart(2, "0")}` : "";
      return `
        <div class="ticket-page">
        <div class="ticket">
          <div class="main">
            <div class="brand"><h1>سِـكَّـة</h1><small>Sikkah · Boarding Pass ${i + 1} of ${count}</small></div>
            <div class="route">${ticket.source || ""} → ${ticket.destination || ""}</div>
            <div class="grid">
              <div class="cell"><span class="label">Train</span><span class="value">${ticket.train_id || ""}</span></div>
              <div class="cell"><span class="label">Date</span><span class="value">${ticket.travel_date}</span></div>
              <div class="cell"><span class="label">Departure</span><span class="value">${ticket.departure_time || ""}</span></div>
              <div class="cell"><span class="label">Arrival</span><span class="value">${ticket.arrival_time || ""}</span></div>
            </div>
            <div style="margin-top:14px">
              <div class="row"><span class="label">Passenger</span><span class="value">${name}</span></div>
              ${cls ? `<div class="row"><span class="label">Class</span><span class="value">${cls === "Business" ? "★ " : ""}${cls} · ${coachStr}</span></div>` : ""}
            </div>
            <div class="seats">SEAT · ${seat}</div>
            
          </div>
          <div class="stub">
            <div class="stub-label">Boarding Pass</div>
            <div class="seat">${seat}</div>
            <div class="qr"><img src="${qr}" alt="Barcode" /></div>
            <div class="bk">${ticket.booking_id}</div>
          </div>
        </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html><head><title>Ticket ${ticket.booking_id}</title>
      <style>
        @page { size: A5 landscape; margin: 0; }
        * { box-sizing: border-box; }
        html, body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 0;
          background: #0B1F17; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .ticket-page { padding: 12mm;
          background: linear-gradient(135deg, #1A4332 0%, #143929 35%, #0F2A1F 70%, #0B1F17 100%);
          page-break-after: always; break-after: page; }
        .ticket-page:last-child { page-break-after: auto; break-after: auto; }
        .ticket { display: grid; grid-template-columns: 1fr 200px; max-width: 760px; margin: 0 auto;
          background: linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06));
          border: 1px solid #B59410; border-radius: 18px;
          box-shadow: 0 30px 60px -20px rgba(0,0,0,0.5); overflow: hidden; color: #FDFCF5; }
        .main { padding: 26px 30px; }
        .stub { padding: 26px 18px; border-left: 2px dashed rgba(245,229,184,0.55); text-align: center; }
        .brand h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; margin:0; color: #F4E9B8; letter-spacing: 1px; }
        .brand small { color:#D4B53A; font-size:10px; letter-spacing:3px; text-transform:uppercase; }
        .route { font-family: 'Playfair Display', Georgia, serif; font-size: 30px; font-weight: 700; margin: 8px 0 18px; color:#fff; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; }
        .cell .label { color:#D4B53A; font-size:9px; letter-spacing:2px; text-transform:uppercase; display:block; margin-bottom:3px; }
        .cell .value { font-size:14px; font-weight:600; color:#fff; }
        .row { display:flex; justify-content:space-between; padding:5px 0; font-size:13px; }
        .row .label { color:#D4B53A; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; }
        .row .value { color:#fff; font-weight:600; }
        .seats { margin-top:18px; padding:10px 14px; border:1px solid rgba(181,148,16,0.5); border-radius:10px;
          font-family: monospace; letter-spacing:2px; color:#F4E9B8; text-align:center; font-weight:700; }
        .stub-label { font-size:9px; letter-spacing:3px; color:#D4B53A; text-transform:uppercase; }
        .seat { font-family: 'Playfair Display', Georgia, serif; font-size: 38px; color:#F4E9B8; margin: 6px 0 4px; }
        .qr { margin: 12px auto 6px; padding:6px 8px; background:#F4E9B8; border-radius:8px; display:flex; justify-content:center; }
        .qr img { max-width:160px; height:auto; display:block; }
        .bk { font-family: monospace; font-size:10px; color:#0B1F17; background:#F4E9B8; padding:3px 6px; border-radius:4px; display:inline-block; margin-top:4px; }
        .total { margin-top:16px; padding-top:14px; border-top:1px solid rgba(245,229,184,0.3); display:flex; justify-content:space-between; align-items:baseline; }
        .total .lbl { color:#D4B53A; font-size:10px; letter-spacing:2px; text-transform:uppercase; }
        .total .amt { font-family: 'Playfair Display', Georgia, serif; font-size:28px; color:#F4E9B8; font-weight:700; }
        @media print { html, body { background: #0B1F17 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .ticket-page { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>
      ${ticketsHtml}
      <script>setTimeout(()=>window.print(), 300);</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(circle at 20% 20%, #1A4332 0%, #0B1F17 70%)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#F4E9B8" }} />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6" style={{ background: "radial-gradient(circle at 20% 20%, #1A4332 0%, #0B1F17 70%)", color: "#FDFCF5" }}>
        <div>
          <h1 className="font-display text-3xl mb-2" style={{ color: "#F4E9B8" }}>Ticket Not Found</h1>
          <p className="opacity-80">We couldn't find a reservation with this code.</p>
        </div>
      </div>
    );
  }

  const isCancelled = ticket.status === "Cancelled";

  return (
    <div className="min-h-screen px-4 py-10 md:py-16" style={{ background: "radial-gradient(circle at 20% 20%, #1A4332 0%, #0B1F17 70%)" }}>
      <div className="max-w-3xl mx-auto space-y-6">
        {(() => {
          const tc = getCoachCount(ticket.total_seats || 0);
          const names = (ticket.passenger_name || "").split(",").map(n => n.trim());
          const seats = ticket.seat_numbers || [];
          const count = Math.max(names.length, seats.length, 1);
          const perPrice = Number(ticket.total_amount) / count;

          return Array.from({ length: count }).map((_, i) => {
            const seat = seats[i];
            const name = names[i] || `Passenger ${i + 1}`;
            const info = seat ? parseSeat(seat) : null;
            const cls = info ? getCoachClass(info.coach, tc) : null;

            return (
              <div key={i} className="rounded-2xl overflow-hidden border" style={{
                borderColor: "#B59410",
                background: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06))",
                backdropFilter: "blur(14px)",
                color: "#FDFCF5",
                boxShadow: "0 30px 60px -20px rgba(0,0,0,0.5)",
              }}>
                <div className="grid md:grid-cols-[1fr_220px]">
                  <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="font-display text-2xl" style={{ color: "#F4E9B8" }}>سِـكَّـة</h1>
                        <p className="text-[10px] tracking-[3px] uppercase" style={{ color: "#D4B53A" }}>
                          Sikkah · Boarding Pass {i + 1} of {count}
                        </p>
                      </div>
                      {isCancelled && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "#7f1d1d", color: "#fff" }}>
                          CANCELLED
                        </span>
                      )}
                    </div>

                    <p className="font-display text-3xl md:text-4xl font-bold mt-6 mb-6">
                      {ticket.source} → {ticket.destination}
                    </p>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {[
                        ["Train", ticket.train_id],
                        ["Date", ticket.travel_date],
                        ["Departure", ticket.departure_time],
                        ["Arrival", ticket.arrival_time],
                      ].map(([label, value]) => (
                        <div key={label as string}>
                          <p className="text-[10px] tracking-[2px] uppercase" style={{ color: "#D4B53A" }}>{label}</p>
                          <p className="font-semibold text-sm md:text-base mt-0.5">{value || "—"}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 space-y-1.5">
                      <div className="flex justify-between items-center text-sm border-b border-dashed py-1.5 gap-2 flex-wrap" style={{ borderColor: "rgba(245,229,184,0.25)" }}>
                        <span className="text-[10px] tracking-widest uppercase" style={{ color: "#D4B53A" }}>Passenger</span>
                        <span className="font-semibold">{name}</span>
                      </div>
                      {cls && (
                        <div className="flex justify-between items-center text-sm border-b border-dashed py-1.5 gap-2 flex-wrap" style={{ borderColor: "rgba(245,229,184,0.25)" }}>
                          <span className="text-[10px] tracking-widest uppercase" style={{ color: "#D4B53A" }}>Class</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                            style={{
                              borderColor: cls === "Business" ? "#B59410" : "rgba(245,229,184,0.4)",
                              color: cls === "Business" ? "#F4E9B8" : "#D4B53A",
                              background: cls === "Business" ? "rgba(181,148,16,0.25)" : "transparent",
                            }}>
                            {cls === "Business" && "★ "}{cls} · Coach {String(info!.coach).padStart(2, "0")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 px-4 py-3 rounded-xl border flex items-center justify-between"
                      style={{ borderColor: "rgba(181,148,16,0.6)", color: "#F4E9B8" }}>
                      <span style={{ color: "#D4B53A" }} className="text-[10px] tracking-widest uppercase">Seat</span>
                      <span className="font-bold tracking-widest font-mono">{seat || "—"}</span>
                    </div>

                  </div>

                  <div className="p-6 text-center border-t md:border-t-0 md:border-l border-dashed flex flex-col items-center justify-center" style={{ borderColor: "rgba(245,229,184,0.55)" }}>
                    <p className="text-[9px] tracking-[3px] uppercase" style={{ color: "#D4B53A" }}>Boarding Pass</p>
                    <p className="font-display text-4xl my-2" style={{ color: "#F4E9B8" }}>
                      {seat || "—"}
                    </p>
                    {qr && (
                      <img src={qr} alt="Barcode" className="rounded-lg max-w-[200px] w-full p-1.5" style={{ background: "#F4E9B8" }} />
                    )}
                    <p className="font-mono text-xs mt-3 px-3 py-1 rounded" style={{ background: "#F4E9B8", color: "#0B1F17" }}>
                      {ticket.booking_id}
                    </p>
                  </div>
                </div>
              </div>
            );
          });
        })()}

        {(() => {
          const names = (ticket.passenger_name || "").split(",").map(n => n.trim());
          const seats = ticket.seat_numbers || [];
          const count = Math.max(names.length, seats.length, 1);
          return (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => (count > 1 ? setPickerOpen(true) : handleDownload("all"))}
                disabled={isCancelled}
                size="lg"
                className="gap-2"
                style={{ background: "#B59410", color: "#0B1F17" }}
              >
                <Download className="h-5 w-5" />
                {count > 1 ? "Download / Print Tickets" : "Download as PDF"}
              </Button>

              <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">Select passenger</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Choose which boarding pass to download.
                  </p>
                  <div className="grid gap-2 mt-2">
                    {Array.from({ length: count }).map((_, i) => {
                      const name = names[i] || `Passenger ${i + 1}`;
                      const seat = seats[i] || "—";
                      return (
                        <Button
                          key={i}
                          variant="outline"
                          className="justify-between h-auto py-3"
                          onClick={() => { setPickerOpen(false); handleDownload(i); }}
                        >
                          <span className="font-semibold">Passenger {i + 1} · {name}</span>
                          <span className="font-mono text-xs opacity-70">Seat {seat}</span>
                        </Button>
                      );
                    })}
                    <Button
                      className="mt-2"
                      style={{ background: "#B59410", color: "#0B1F17" }}
                      onClick={() => { setPickerOpen(false); handleDownload("all"); }}
                    >
                      Download all ({count}) boarding passes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          );
        })()}

        <p className="text-center text-xs mt-4 opacity-60" style={{ color: "#FDFCF5" }}>
          Present this ticket at the gate for boarding.
        </p>
      </div>
    </div>
  );
};

export default TicketView;
