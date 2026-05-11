import { useState, useEffect, useCallback } from "react";
import { Train, Users, TicketCheck, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/StatCard";
import TrainScheduleTable from "@/components/TrainScheduleTable";
import RecentBookings from "@/components/RecentBookings";

const Index = () => {
  const [activeTrains, setActiveTrains] = useState(0);
  const [totalPassengers, setTotalPassengers] = useState(0);
  const [todayReservations, setTodayReservations] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);

  const fetchStats = useCallback(async () => {
    // Active trains = trains with "Active" status
    const { count: trainCount } = await supabase
      .from("train_routes")
      .select("*", { count: "exact", head: true })
      .eq("status", "Active");
    setActiveTrains(trainCount || 0);

    // Total passengers from passengers table
    const { count: passengerCount } = await supabase.from("passengers").select("*", { count: "exact", head: true });
    setTotalPassengers(passengerCount || 0);

    // Today's reservations
    const today = format(new Date(), "yyyy-MM-dd");
    const { data: todayRes } = await supabase
      .from("reservations")
      .select("total_amount")
      .eq("travel_date", today)
      .eq("status", "Confirmed");

    setTodayReservations(todayRes?.length || 0);
    const revenue = (todayRes || []).reduce((sum, r: any) => sum + Number(r.total_amount), 0);
    setTodayRevenue(revenue);
  }, []);

  useEffect(() => {
    fetchStats();

    // Subscribe to real-time changes on passengers and train_routes
    const channel = supabase
      .channel("dashboard-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "passengers" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "train_routes" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => fetchStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStats]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 max-w-[1400px]">
        {/* Premium Hero Panel */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[hsl(var(--rail-surface))] to-[hsl(var(--background))] shadow-rail mb-8">
          <div className="absolute inset-0 rail-hero-pattern opacity-80" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rail-gold/60 to-transparent" />
          <div className="relative px-10 py-12 flex items-center justify-between gap-8 flex-wrap">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.3em] text-rail-gold/80 mb-3 font-inter">Rail Connect · Operations</p>
              <h1 className="font-playfair text-4xl md:text-[44px] font-bold text-foreground leading-tight">
                Your Journey, <span className="italic text-rail-gold">Elevated.</span>
              </h1>
              <p className="text-muted-foreground mt-4 text-base max-w-lg">
                Live operational overview of premium intercity rail services across the network.
              </p>
            </div>
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-rail-gold/30 bg-[hsl(var(--background))]/60 backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--rail-success))] animate-pulse" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Network Status</p>
                <p className="text-sm font-semibold text-foreground">All Lines Operational</p>
              </div>
            </div>
          </div>
        </section>

        <DashboardHeader title="Operations Dashboard" subtitle="Welcome back — here's what's happening today" />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
          <StatCard
            title="Active Trains"
            value={String(activeTrains)}
            change="Trains with Active status"
            changeType="neutral"
            icon={Train}
          />
          <StatCard
            title="Total Passengers"
            value={totalPassengers.toLocaleString()}
            change="All registered passengers"
            changeType="neutral"
            icon={Users}
          />
          <StatCard
            title="Reservations Today"
            value={String(todayReservations)}
            change="Confirmed bookings"
            changeType="neutral"
            icon={TicketCheck}
          />
          <StatCard
            title="Revenue (Today)"
            value={`SAR ${todayRevenue.toLocaleString()}`}
            change="Today's confirmed bookings"
            changeType="neutral"
            icon={TrendingUp}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
          <div className="xl:col-span-2">
            <TrainScheduleTable />
          </div>
          <div>
            <RecentBookings />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
