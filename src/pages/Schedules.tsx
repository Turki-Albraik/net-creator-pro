import { Plus } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const allSchedules = [
  { id: "TR-101", route: "Riyadh → Jeddah", departure: "06:00", arrival: "10:30", seats: 320, price: "SAR 250", days: "Daily", status: "Active" },
  { id: "TR-204", route: "Riyadh → Dammam", departure: "07:30", arrival: "11:00", seats: 280, price: "SAR 200", days: "Daily", status: "Active" },
  { id: "TR-315", route: "Jeddah → Madinah", departure: "09:15", arrival: "11:45", seats: 200, price: "SAR 180", days: "Sun-Thu", status: "Active" },
  { id: "TR-422", route: "Dammam → Riyadh", departure: "14:00", arrival: "17:30", seats: 320, price: "SAR 220", days: "Daily", status: "Active" },
  { id: "TR-530", route: "Madinah → Riyadh", departure: "16:00", arrival: "20:00", seats: 280, price: "SAR 280", days: "Fri-Sat", status: "Maintenance" },
  { id: "TR-618", route: "Jeddah → Riyadh", departure: "18:30", arrival: "23:00", seats: 320, price: "SAR 260", days: "Daily", status: "Active" },
];

const Schedules = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Train Schedules</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage routes, timings, and capacity</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Schedule
          </Button>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Train ID</TableHead>
                <TableHead className="font-semibold">Route</TableHead>
                <TableHead className="font-semibold">Departure</TableHead>
                <TableHead className="font-semibold">Arrival</TableHead>
                <TableHead className="font-semibold">Capacity</TableHead>
                <TableHead className="font-semibold">Price</TableHead>
                <TableHead className="font-semibold">Days</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSchedules.map((s) => (
                <TableRow key={s.id} className="cursor-pointer">
                  <TableCell className="font-mono font-medium">{s.id}</TableCell>
                  <TableCell>{s.route}</TableCell>
                  <TableCell>{s.departure}</TableCell>
                  <TableCell>{s.arrival}</TableCell>
                  <TableCell>{s.seats} seats</TableCell>
                  <TableCell className="font-medium">{s.price}</TableCell>
                  <TableCell className="text-muted-foreground">{s.days}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "Active" ? "default" : "secondary"}>{s.status}</Badge>
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

export default Schedules;
