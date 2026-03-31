import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const reservations = [
  { id: "BK-4821", passenger: "Ahmed Al-Farsi", train: "TR-101", route: "Riyadh → Jeddah", date: "2026-03-28", seat: "A12", amount: "SAR 250", status: "Confirmed" },
  { id: "BK-4820", passenger: "Sara Al-Qahtani", train: "TR-315", route: "Jeddah → Madinah", date: "2026-03-28", seat: "B05", amount: "SAR 180", status: "Confirmed" },
  { id: "BK-4819", passenger: "Omar Al-Rashid", train: "TR-422", route: "Dammam → Riyadh", date: "2026-03-28", seat: "C18", amount: "SAR 220", status: "Pending" },
  { id: "BK-4818", passenger: "Noura Al-Shehri", train: "TR-204", route: "Riyadh → Dammam", date: "2026-03-29", seat: "A03", amount: "SAR 200", status: "Confirmed" },
  { id: "BK-4817", passenger: "Khalid Al-Mutairi", train: "TR-530", route: "Madinah → Riyadh", date: "2026-03-29", seat: "D22", amount: "SAR 280", status: "Cancelled" },
];

const statusColor = (s: string) => {
  if (s === "Confirmed") return "default";
  if (s === "Pending") return "secondary";
  return "destructive";
};

const Reservations = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Reservations</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage passenger bookings and tickets</p>
          </div>
          <Button className="gap-2">
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
                <TableHead className="font-semibold">Seat</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-medium">{r.id}</TableCell>
                  <TableCell>{r.passenger}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{r.train}</TableCell>
                  <TableCell>{r.route}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="font-mono">{r.seat}</TableCell>
                  <TableCell className="font-medium">{r.amount}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(r.status)}>{r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default Reservations;
