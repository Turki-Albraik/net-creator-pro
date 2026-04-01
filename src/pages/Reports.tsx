import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Reports = () => {
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [routeData, setRouteData] = useState<{ route: string; bookings: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: reservations } = await supabase
        .from("reservations")
        .select("total_amount, created_at, route_id")
        .eq("status", "Confirmed");

      if (!reservations) return;

      // Revenue by month
      const monthMap: Record<string, number> = {};
      (reservations as any[]).forEach((r) => {
        const month = new Date(r.created_at).toLocaleString("en-US", { month: "short", year: "2-digit" });
        monthMap[month] = (monthMap[month] || 0) + Number(r.total_amount);
      });
      setRevenueData(Object.entries(monthMap).map(([month, revenue]) => ({ month, revenue })));

      // Bookings by route
      const { data: routes } = await supabase.from("train_routes").select("id, source, destination");
      const routeMap: Record<string, string> = {};
      if (routes) (routes as any[]).forEach((r) => { routeMap[r.id] = `${r.source}→${r.destination}`; });

      const routeCount: Record<string, number> = {};
      (reservations as any[]).forEach((r) => {
        const name = routeMap[r.route_id] || "Unknown";
        routeCount[name] = (routeCount[name] || 0) + 1;
      });
      setRouteData(Object.entries(routeCount).map(([route, bookings]) => ({ route, bookings })));
    };
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="border-b border-border pb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Revenue analysis and booking trends from real data</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Revenue by Period</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No reservation data yet</p>
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
            <CardContent>
              {routeData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No reservation data yet</p>
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
        </div>
      </main>
    </div>
  );
};

export default Reports;
