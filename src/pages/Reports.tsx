import { useState, useEffect, useRef } from "react";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subDays, subWeeks, subMonths, isAfter, format, parse, getDay } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(210, 60%, 50%)", "hsl(30, 80%, 55%)", "hsl(150, 50%, 45%)"];

type Period = "daily" | "weekly" | "monthly" | "all";

// Bug #16 — Day index for sorting weekly data
const dayOrder: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

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
      const now = new Date();
      let cutoff: Date | null = null;
      if (period === "daily") cutoff = subDays(now, 1);
      else if (period === "weekly") cutoff = subWeeks(now, 1);
      else if (period === "monthly") cutoff = subMonths(now, 1);

      let query = supabase
        .from("reservations")
        .select("total_amount, created_at, route_id, seat_numbers, status, travel_date")
        .eq("status", "Confirmed");
      if (cutoff) query = query.gte("created_at", cutoff.toISOString());

      const { data: reservations } = await query;
      if (!reservations) return;

      const filtered = reservations as any[];

      // Build revenue data
      const monthMap: Record<string, number> = {};
      filtered.forEach((r) => {
        const label = period === "daily"
          ? format(new Date(r.created_at), "HH:mm")
          : period === "weekly"
          ? format(new Date(r.created_at), "EEE")
          : format(new Date(r.created_at), "MMM yy");
        monthMap[label] = (monthMap[label] || 0) + Number(r.total_amount);
      });

      // Bug #16 — Sort revenue data chronologically
      let sortedRevenue = Object.entries(monthMap).map(([month, revenue]) => ({ month, revenue }));
      if (period === "daily") {
        sortedRevenue.sort((a, b) => a.month.localeCompare(b.month));
      } else if (period === "weekly") {
        sortedRevenue.sort((a, b) => (dayOrder[a.month] ?? 0) - (dayOrder[b.month] ?? 0));
      } else {
        sortedRevenue.sort((a, b) => {
          const da = new Date(`01 ${a.month}`);
          const db = new Date(`01 ${b.month}`);
          return da.getTime() - db.getTime();
        });
      }
      setRevenueData(sortedRevenue);

      const { data: routes } = await supabase.from("train_routes").select("id, source, destination, total_seats");
      const routeMap: Record<string, string> = {};
      const seatMap: Record<string, number> = {};
      if (routes) (routes as any[]).forEach((r) => {
        routeMap[r.id] = `${r.source}→${r.destination}`;
        seatMap[r.id] = r.total_seats;
      });

      const routeCount: Record<string, number> = {};
      // Bug #6 — Track seats per route per date for proper occupancy
      const routeDateSeats: Record<string, Record<string, number>> = {};
      filtered.forEach((r) => {
        const name = routeMap[r.route_id] || "Unknown";
        routeCount[name] = (routeCount[name] || 0) + 1;
        const dateKey = r.travel_date || format(new Date(r.created_at), "yyyy-MM-dd");
        if (!routeDateSeats[r.route_id]) routeDateSeats[r.route_id] = {};
        routeDateSeats[r.route_id][dateKey] = (routeDateSeats[r.route_id][dateKey] || 0) + (r.seat_numbers?.length || 0);
      });
      setRouteData(Object.entries(routeCount).map(([route, bookings]) => ({ route, bookings })));

      // Bug #6 — Calculate occupancy as average daily rate, capped at 100%
      const occData: { name: string; value: number }[] = [];
      if (routes) {
        (routes as any[]).forEach((r) => {
          const dateMap = routeDateSeats[r.id];
          if (!dateMap || Object.keys(dateMap).length === 0) return;
          const dailyRates = Object.values(dateMap).map((booked) => 
            Math.min(100, r.total_seats > 0 ? Math.round((booked / r.total_seats) * 100) : 0)
          );
          const avgRate = Math.round(dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length);
          occData.push({ name: `${r.source}→${r.destination}`, value: avgRate });
        });
      }
      setOccupancyData(occData);
    };
    fetchData();
  }, [period]);

  const handlePrintAll = () => {
    // Brand palette (matches app theme)
    const C_PRIMARY = "#B59410";   // brass
    const C_SECONDARY = "#1A4332"; // forest
    const C_TERTIARY = "#243A6B";  // navy
    const C_TEXT = "#0B1F17";
    const C_MUTED = "#6B7280";
    const C_BORDER = "#E5DFC6";

    // Clone an SVG and resolve any hsl(var(--xxx)) into concrete brand colors
    const resolveColors = (svg: SVGSVGElement, accent: string) => {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      const replaceVar = (val: string | null) => {
        if (!val) return val;
        if (val.includes("--primary")) return accent;
        if (val.includes("--secondary")) return C_SECONDARY;
        if (val.includes("--muted-foreground")) return C_MUTED;
        if (val.includes("--border")) return C_BORDER;
        if (val.includes("--card")) return "#FFFDF3";
        if (val.includes("var(")) return C_TEXT;
        return val;
      };
      clone.querySelectorAll("*").forEach((el) => {
        ["fill", "stroke"].forEach((attr) => {
          const v = el.getAttribute(attr);
          const r = replaceVar(v);
          if (r && r !== v) el.setAttribute(attr, r);
        });
        const style = (el as HTMLElement).getAttribute("style");
        if (style && style.includes("var(")) {
          (el as HTMLElement).setAttribute(
            "style",
            style
              .replace(/hsl\(var\(--primary\)\)/g, accent)
              .replace(/hsl\(var\(--secondary\)\)/g, C_SECONDARY)
              .replace(/hsl\(var\(--muted-foreground\)\)/g, C_MUTED)
              .replace(/hsl\(var\(--border\)\)/g, C_BORDER)
          );
        }
      });
      // Ensure viewBox so it scales nicely
      const w = clone.getAttribute("width");
      const h = clone.getAttribute("height");
      if (!clone.getAttribute("viewBox") && w && h) {
        clone.setAttribute("viewBox", `0 0 ${w} ${h}`);
      }
      clone.removeAttribute("width");
      clone.setAttribute("width", "100%");
      clone.setAttribute("height", "360");
      return clone.outerHTML;
    };

    const collectSvg = (ref: React.RefObject<HTMLDivElement>, title: string, accent: string) => {
      const svg = ref.current?.querySelector("svg") as SVGSVGElement | null;
      const body = svg
        ? resolveColors(svg, accent)
        : `<p class="empty">No chart data available</p>`;
      return `<section class="chart"><h2>${title}</h2><div class="chart-body">${body}</div></section>`;
    };

    const periodLabel =
      period === "all" ? "All Time"
      : period === "daily" ? "Last 24 Hours"
      : period === "weekly" ? "Last 7 Days"
      : "Last 30 Days";

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>سِـكَّـة — Reports & Analytics</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Calibri','Carlito','Segoe UI',Tahoma,sans-serif;
    color: ${C_TEXT};
    background: #FDFCF5;
    margin: 0;
    padding: 40px 48px;
  }
  header {
    border-bottom: 2px solid ${C_PRIMARY};
    padding-bottom: 16px;
    margin-bottom: 28px;
  }
  h1 {
    font-size: 26px;
    margin: 0 0 6px;
    color: ${C_SECONDARY};
    letter-spacing: -0.01em;
  }
  .meta { color: ${C_MUTED}; font-size: 13px; }
  .meta strong { color: ${C_TEXT}; }
  section.chart {
    margin: 28px 0;
    padding: 20px 24px;
    background: #FFFDF3;
    border: 1px solid ${C_BORDER};
    border-radius: 10px;
    page-break-inside: avoid;
  }
  section.chart h2 {
    font-size: 16px;
    margin: 0 0 16px;
    color: ${C_SECONDARY};
    border-left: 4px solid ${C_PRIMARY};
    padding-left: 10px;
  }
  .chart-body { width: 100%; }
  .chart-body svg { width: 100% !important; height: auto !important; max-height: 360px; }
  .empty { color: ${C_MUTED}; text-align: center; padding: 40px 0; font-style: italic; }
  footer {
    margin-top: 40px;
    padding-top: 12px;
    border-top: 1px solid ${C_BORDER};
    font-size: 11px;
    color: ${C_MUTED};
    text-align: center;
  }
  @media print {
    body { padding: 20px 24px; }
    section.chart { box-shadow: none; }
  }
</style>
</head><body>
  <header>
    <h1>سِـكَّـة — Reports & Analytics</h1>
    <div class="meta"><strong>Period:</strong> ${periodLabel} &nbsp;·&nbsp; <strong>Generated:</strong> ${format(new Date(), "PPP p")}</div>
  </header>
  ${collectSvg(revenueRef, "Revenue by Period", C_PRIMARY)}
  ${collectSvg(routeRef, "Bookings by Route", C_SECONDARY)}
  ${collectSvg(occupancyRef, "Train Utilization Rate (%)", C_TERTIARY)}
  <footer>© ${new Date().getFullYear()} سِـكَّـة · RailSync — Confidential Internal Report</footer>
  <script>window.onload = () => setTimeout(() => window.print(), 250);</script>
</body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-16 pt-20 md:pt-8 px-4 md:px-8 pb-8">
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
