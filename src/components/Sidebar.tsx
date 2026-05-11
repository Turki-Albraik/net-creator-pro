import { LayoutDashboard, CalendarClock, Users, TicketCheck, BarChart3, Settings, UserCog, LogOut, Menu, User, History, Train } from "lucide-react";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: CalendarClock, label: "Schedules", to: "/schedules" },
  { icon: TicketCheck, label: "Reservations", to: "/reservations" },
  { icon: Users, label: "Passengers", to: "/passengers" },
  { icon: UserCog, label: "Employees", to: "/employees" },
  { icon: BarChart3, label: "Reports", to: "/reports" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

const passengerNavItems = [
  { icon: TicketCheck, label: "New Reservation", to: "/reservations/new" },
  { icon: History, label: "My Reservations", to: "/my-reservations" },
  { icon: User, label: "My Profile", to: "/my-profile" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

const Sidebar = () => {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isPassenger = employee?.role === "Passenger";
  const navItems = isPassenger ? passengerNavItems : adminNavItems;

  return (
    <>
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 bg-card border border-border shadow-sm"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Premium announcement strip */}
        <div className="bg-[#0D1929] border-b border-sidebar-border py-1.5 px-3 text-center">
          <p className="text-[10px] font-inter uppercase tracking-widest text-rail-gold/90">
            Premium Rail Service · Since 1952
          </p>
        </div>

        <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rail-gold to-rail-gold-deep shadow-rail-gold-soft">
              <Train className="h-5 w-5 text-[#0B1120]" strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="font-playfair text-base font-bold text-rail-gold tracking-[0.18em]">RAIL CONNECT</h1>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 mt-0.5">سِـكَّـة · Premium Rail</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-sidebar-foreground/60 hover:text-rail-gold hover:bg-sidebar-accent/50 h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-inter uppercase tracking-widest font-semibold transition-colors border-l-2",
                  isActive
                    ? "bg-sidebar-accent text-rail-gold border-rail-gold"
                    : "text-sidebar-foreground/60 border-transparent hover:bg-sidebar-accent/50 hover:text-rail-gold"
                )
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </RouterNavLink>
          ))}
        </nav>

        {employee && (
          <div className="p-4 mx-3 mb-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
            <p className="text-xs font-medium text-sidebar-foreground/80">{employee.name}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">Role: {employee.role}</p>
          </div>
        )}

        <div className="px-3 mb-4">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>

        <div className="p-4 mx-3 mb-4 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
          <p className="text-xs font-medium text-sidebar-foreground/80">System Status</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="h-2 w-2 rounded-full bg-train-signal animate-pulse" />
            <span className="text-xs text-sidebar-foreground/60">All systems operational</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
