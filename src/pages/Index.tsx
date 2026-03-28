import { Train, Users, TicketCheck, TrendingUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/StatCard";
import TrainScheduleTable from "@/components/TrainScheduleTable";
import RecentBookings from "@/components/RecentBookings";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <DashboardHeader title="Dashboard" subtitle="Welcome back — here's what's happening today" />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
          <StatCard
            title="Active Trains"
            value="24"
            change="+3 from yesterday"
            changeType="positive"
            icon={Train}
          />
          <StatCard
            title="Total Passengers"
            value="1,847"
            change="+12.5% this week"
            changeType="positive"
            icon={Users}
          />
          <StatCard
            title="Reservations Today"
            value="342"
            change="89% seat utilization"
            changeType="neutral"
            icon={TicketCheck}
          />
          <StatCard
            title="Revenue (Today)"
            value="SAR 68.4K"
            change="+8.2% vs avg"
            changeType="positive"
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
