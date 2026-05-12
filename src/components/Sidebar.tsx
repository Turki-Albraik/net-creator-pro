import { LayoutDashboard, CalendarClock, Users, TicketCheck, BarChart3, Settings, UserCog, Menu, User, History, X } from "lucide-react";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import logoImg from "@/assets/logo.png";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: CalendarClock, label: "Schedules", to: "/schedules" },
  { icon: TicketCheck, label: "Reservations", to: "/reservations" },
  { icon: Users, label: "Passengers", to: "/passengers" },
  { icon: UserCog, label: "Employees", to: "/employees" },
  { icon: BarChart3, label: "Reports", to: "/reports" },
];

const passengerNavItems = [
  { icon: TicketCheck, label: "New Reservation", to: "/reservations/new" },
  { icon: History, label: "My Reservations", to: "/my-reservations" },
  { icon: User, label: "My Profile", to: "/my-profile" },
];

const settingsItem = { icon: Settings, label: "Settings", to: "/settings" };

const Sidebar = () => {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isPassenger = employee?.role === "Passenger";
  const navItems = isPassenger ? passengerNavItems : adminNavItems;
  const userInitials = (employee?.name || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const NavList = ({ expanded, onNavigate }: { expanded: boolean; onNavigate?: () => void }) => {
    const renderItem = (item: { icon: typeof Settings; label: string; to: string }) => (
      <RouterNavLink
        key={item.to}
        to={item.to}
        end={item.to === "/"}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-xl px-2.5 py-3 transition-all duration-200 group relative",
            isActive
              ? "bg-forest-800 dark:bg-navy-800 text-white border border-forest-700 dark:border-navy-700"
              : "text-[#8FA99A] hover:bg-forest-900 dark:hover:bg-navy-900 hover:text-white"
          )
        }
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span
          className={cn(
            "whitespace-nowrap text-sm font-medium transition-all duration-200",
            expanded ? "opacity-100 ml-0" : "opacity-0 -ml-2 w-0 overflow-hidden"
          )}
        >
          {item.label}
        </span>
        {!expanded && (
          <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-forest-950 dark:bg-navy-950 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none shadow-lg z-50">
            {item.label}
          </span>
        )}
      </RouterNavLink>
    );

    return (
      <>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(renderItem)}
        </nav>
        <div className="px-2 pb-4 pt-2 border-t border-forest-800 dark:border-navy-800 space-y-1">
          {renderItem(settingsItem)}
        </div>
      </>
    );
  };

  const LogoRow = ({ expanded, withClose }: { expanded: boolean; withClose?: boolean }) => (
    <div
      className={cn(
        "flex items-center py-5 border-b border-forest-800 dark:border-navy-800",
        expanded ? "gap-3 px-3 justify-start" : "px-2 justify-center"
      )}
    >
      <img
        src={logoImg}
        alt="سِـكَّـة"
        width={80}
        height={80}
        decoding="async"
        className={cn(
          "rounded-lg object-contain shrink-0 [image-rendering:auto]",
          expanded ? "h-10 w-10" : "h-11 w-11"
        )}
      />
      <div
        className={cn(
          "transition-all duration-200 overflow-hidden",
          expanded ? "flex-1 opacity-100" : "w-0 opacity-0 pointer-events-none"
        )}
      >
        <h1 className="font-serif text-lg text-white leading-tight">سِـكَّـة</h1>
        <p className="text-[10px] text-[#8FA99A] uppercase tracking-widest">Sikkah</p>
      </div>
      {withClose && (
        <button
          onClick={() => setMobileOpen(false)}
          className="text-white/70 hover:text-white p-1 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  const UserCard = ({ expanded }: { expanded: boolean }) => (
    <div className={cn("pb-4", expanded ? "px-3" : "px-2")}>
      {employee && (
        <button
          onClick={handleLogout}
          title="Sign Out"
          className={cn(
            "w-full flex items-center rounded-xl bg-forest-900 dark:bg-navy-900 border border-forest-800 dark:border-navy-800 hover:border-amber-brand/60 transition-colors group",
            expanded ? "gap-3 p-2" : "justify-center p-1.5"
          )}
        >
          <div className="h-9 w-9 rounded-full bg-amber-brand text-forest-950 flex items-center justify-center font-bold text-sm shrink-0">
            {userInitials}
          </div>
          <div
            className={cn(
              "flex-1 min-w-0 text-left transition-all duration-200 overflow-hidden",
              expanded ? "opacity-100" : "opacity-0 w-0"
            )}
          >
            <p className="text-xs font-semibold text-white truncate">{employee.name}</p>
            <p className="text-[10px] text-[#8FA99A] uppercase tracking-wider truncate group-hover:text-amber-brand">Sign out</p>
          </div>
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-forest-950 dark:bg-navy-950 border-b border-forest-800 dark:border-navy-800 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-lg bg-forest-900 dark:bg-navy-900 flex items-center justify-center text-white"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="" width={56} height={56} decoding="async" className="h-7 w-7 rounded-md object-contain" />
          <span className="font-serif text-white text-base">سِـكَّـة</span>
        </div>
        <div className="w-9" />
      </div>

      {/* DESKTOP SIDEBAR — hover expand */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "hidden md:flex flex-col fixed left-0 top-0 h-screen z-40 bg-forest-950 dark:bg-navy-950 border-r border-forest-800 dark:border-navy-800",
          "transition-all duration-300 ease-in-out overflow-hidden",
          isHovered ? "w-[260px] shadow-2xl" : "w-16"
        )}
      >
        <LogoRow expanded={isHovered} />
        <NavList expanded={isHovered} />
      </aside>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 animate-fade-in">
          <div
            className="absolute inset-0 bg-forest-950 dark:bg-navy-950/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[280px] h-full bg-forest-950 dark:bg-navy-950 border-r border-forest-800 dark:border-navy-800 flex flex-col animate-slide-in">
            <LogoRow expanded withClose />
            <NavList expanded onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
