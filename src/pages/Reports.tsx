import { useState, useEffect, useRef } from "react";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subDays, subWeeks, subMonths, isAfter, format } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(210, 60%, 50%)", "hsl(30, 80%, 55%)", "hsl(150, 50%, 45%)"];

type Period = "daily" | "weekly" | "monthly" | "all";

const Reports = () => {
  const [period, setPeriod] = useState<Period>("all");
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [routeData, setRouteData] = useState<{ route: string; bookings: number }[]>([]);
  const [occupancyData, setOccupancyData] = useState<{ name: string; value: number }[]>([]);
  const revenueRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<HTMLDivElement>(null);
  const occupancyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: reservations } = await supabase
        .from("reservations")
        .select("total_amount, created_at, route_id, seat_numbers, status")
        .eq("status", "Confirmed");

      if (!reservations) return;

      const now = new Date();
      let cutoff: Date | null = null;
      if (period === "daily") cutoff = subDays(now, 1);
      else if (period === "weekly") cutoff = subWeeks(now, 1);
      else if (period === "monthly") cutoff = subMonths(now, 1);

      const filtered = cutoff
        ? (reservations as any[]).filter((r) => isAfter(new Date(r.created_at), cutoff!))
        : (reservations as any[]);

      const monthMap: Record<string, number> = {};
      filtered.forEach((r) => {
        const label = period === "daily"
          ? format(new Date(r.created_at), "HH:mm")
          : period === "weekly"
          ? format(new Date(r.created_at), "EEE")
          : format(new Date(r.created_at), "MMM yy");
        monthMap[label] = (monthMap[label] || 0) + Number(r.total_amount);
      });
      setRevenueData(Object.entries(monthMap).map(([month, revenue]) => ({ month, revenue })));

      const { data: routes } = await supabase.from("train_routes").select("id, source, destination, total_seats");
      const routeMap: Record<string, string> = {};
      const seatMap: Record<string, number> = {};
      if (routes) (routes as any[]).forEach((r) => {
        routeMap[r.id] = `${r.source}→${r.destination}`;
        seatMap[r.id] = r.total_seats;
      });

      const routeCount: Record<string, number> = {};
      const routeSeatsBooked: Record<string, number> = {};
      filtered.forEach((r) => {
        const name = routeMap[r.route_id] || "Unknown";
        routeCount[name] = (routeCount[name] || 0) + 1;
        routeSeatsBooked[r.route_id] = (routeSeatsBooked[r.route_id] || 0) + (r.seat_numbers?.length || 0);
      });
      setRouteData(Object.entries(routeCount).map(([route, bookings]) => ({ route, bookings })));

      const occData: { name: string; value: number }[] = [];
      if (routes) {
        (routes as any[]).forEach((r) => {
          const booked = routeSeatsBooked[r.id] || 0;
          const rate = r.total_seats > 0 ? Math.round((booked / r.total_seats) * 100) : 0;
          occData.push({ name: `${r.source}→${r.destination}`, value: rate });
        });
      }
      setOccupancyData(occData.filter((d) => d.value > 0));
    };
    fetchData();
  }, [period]);

  const handlePrintAll = () => {
    const collectSvg = (ref: React.RefObject<HTMLDivElement>, title: string) => {
      if (!ref.current) return `<h2>${title}</h2><p>No data</p>`;
      const svg = ref.current.querySelector("svg");
      return `<h2 style="margin-top:32px;">${title}</h2>${svg ? svg.outerHTML : "<p>No chart data</p>"}`;
    };

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>سِـكَّـة - Reports</title>
      <style>body{font-family:'Segoe UI',sans-serif;padding:40px;text-align:center;}h1{font-size:24px;margin-bottom:8px;}h2{font-size:18px;margin-bottom:16px;color:#333;}svg{max-width:100%;height:auto;}@media print{body{padding:20px;}}</style>
      </head><body>
      <h1>سِـكَّـة - Reports & Analytics</h1>
      <p style="color:#888;margin-bottom:24px;">Period: ${period === "all" ? "All Time" : period}</p>
      ${collectSvg(revenueRef, "Revenue by Period")}
      ${collectSvg(routeRef, "Bookings by Route")}
      ${collectSvg(occupancyRef, "Train Utilization Rate")}
      <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Revenue analysis, booking trends, and train utilization</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily (Last 24h)</SelectItem>
                <SelectItem value="weekly">Weekly (Last 7 days)</SelectItem>
                <SelectItem value="monthly">Monthly (Last 30 days)</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2" onClick={handlePrintAll}>
              <Printer className="h-4 w-4" /> Print All Reports
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Revenue by Period</CardTitle>
            </CardHeader>
            <CardContent ref={revenueRef}>
              {revenueData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No reservation data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Bookings by Route</CardTitle>
            </CardHeader>
            <CardContent ref={routeRef}>
              {routeData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No reservation data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={routeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="route" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="bookings" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="font-display text-lg">Train Utilization Rate (%)</CardTitle>
            </CardHeader>
            <CardContent ref={occupancyRef}>
              {occupancyData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No utilization data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="value" fill="hsl(210, 60%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Reports;
