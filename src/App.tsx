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
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/schedules" element={<ProtectedRoute><Schedules /></ProtectedRoute>} />
            <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
            <Route path="/reservations/new" element={<ProtectedRoute><NewReservation /></ProtectedRoute>} />
            <Route path="/passengers" element={<ProtectedRoute><Passengers /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
