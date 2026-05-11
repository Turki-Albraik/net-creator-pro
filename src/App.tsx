import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Schedules from "./pages/Schedules.tsx";
import Reservations from "./pages/Reservations.tsx";
import NewReservation from "./pages/NewReservation.tsx";
import Passengers from "./pages/Passengers.tsx";
import Reports from "./pages/Reports.tsx";
import Employees from "./pages/Employees.tsx";
import Settings from "./pages/Settings.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import MyReservations from "./pages/MyReservations.tsx";
import MyProfile from "./pages/MyProfile.tsx";
import NotFound from "./pages/NotFound.tsx";
import TicketView from "./pages/TicketView.tsx";

const ProtectedRoute = ({ children, adminOnly = false, allowPassenger = false }: { children: React.ReactNode; adminOnly?: boolean; allowPassenger?: boolean }) => {
  const { isAuthenticated, employee } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  const isPassenger = employee?.role === "Passenger";
  
  // Admin-only routes
  if (adminOnly && employee?.role !== "Railway Administrator") return <Navigate to="/" replace />;
  
  // Routes that don't allow passengers (admin-only pages)
  if (!allowPassenger && isPassenger) return <Navigate to="/my-reservations" replace />;
  
  return <>{children}</>;
};

const PassengerRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, employee } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (employee?.role !== "Passenger") return <Navigate to="/" replace />;
  return <>{children}</>;
};

const SmartHome = () => {
  const { employee } = useAuth();
  if (employee?.role === "Passenger") return <Navigate to="/my-reservations" replace />;
  return <Index />;
};

const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<ProtectedRoute allowPassenger><SmartHome /></ProtectedRoute>} />
              <Route path="/schedules" element={<ProtectedRoute><Schedules /></ProtectedRoute>} />
              <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
              <Route path="/reservations/new" element={<ProtectedRoute allowPassenger><NewReservation /></ProtectedRoute>} />
              <Route path="/passengers" element={<ProtectedRoute><Passengers /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/employees" element={<ProtectedRoute adminOnly><Employees /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute allowPassenger><Settings /></ProtectedRoute>} />
              <Route path="/my-reservations" element={<PassengerRoute><MyReservations /></PassengerRoute>} />
              <Route path="/my-profile" element={<PassengerRoute><MyProfile /></PassengerRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
