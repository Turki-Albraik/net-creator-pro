import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const schedules = [
  { id: "TR-101", route: "Riyadh → Jeddah", departure: "06:00", arrival: "10:30", seats: 320, booked: 287, status: "On Time" },
  { id: "TR-204", route: "Riyadh → Dammam", departure: "07:30", arrival: "11:00", seats: 280, booked: 280, status: "Full" },
  { id: "TR-315", route: "Jeddah → Madinah", departure: "09:15", arrival: "11:45", seats: 200, booked: 156, status: "On Time" },
  { id: "TR-422", route: "Dammam → Riyadh", departure: "14:00", arrival: "17:30", seats: 320, booked: 198, status: "Delayed" },
  { id: "TR-530", route: "Madinah → Riyadh", departure: "16:00", arrival: "20:00", seats: 280, booked: 245, status: "On Time" },
];

const statusVariant = (status: string) => {
  switch (status) {
    case "On Time": return "default";
    case "Full": return "secondary";
    case "Delayed": return "destructive";
    default: return "outline";
  }
};

const TrainScheduleTable = () => {
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
          {schedules.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-mono font-medium text-foreground">{s.id}</TableCell>
              <TableCell>{s.route}</TableCell>
              <TableCell>{s.departure}</TableCell>
              <TableCell>{s.arrival}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-secondary transition-all"
                      style={{ width: `${(s.booked / s.seats) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{s.booked}/{s.seats}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TrainScheduleTable;
