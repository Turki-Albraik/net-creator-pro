import { useState } from "react";
import { Train, LayoutDashboard, CalendarClock, Users, TicketCheck, BarChart3, Settings, UserCog, LogOut, Menu, X } from "lucide-react";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/", adminOnly: false },
  { icon: CalendarClock, label: "Schedules", to: "/schedules", adminOnly: false },
  { icon: TicketCheck, label: "Reservations", to: "/reservations", adminOnly: false },
  { icon: Users, label: "Passengers", to: "/passengers", adminOnly: false },
  { icon: UserCog, label: "Employees", to: "/employees", adminOnly: true },
  { icon: BarChart3, label: "Reports", to: "/reports", adminOnly: false },
  { icon: Settings, label: "Settings", to: "/settings", adminOnly: false },
];

const Sidebar = () => {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 bg-card border border-border shadow-sm"
        style={{ left: isOpen ? "17rem" : "1rem" }}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Train className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-sidebar-foreground">RailSync</h1>
            <p className="text-xs text-sidebar-foreground/60">Management System</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.filter((item) => !item.adminOnly || employee?.role === "Railway Administrator").map((item) => (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
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
