import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  role: string;
}

interface AuthContextType {
  employee: Employee | null;
  login: (employeeId: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("railsync_employee");
    if (stored) {
      try {
        setEmployee(JSON.parse(stored));
      } catch {
        localStorage.removeItem("railsync_employee");
      }
    }
  }, []);

  const login = async (employeeId: string, password: string): Promise<boolean> => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("employees")
      .select("id, employee_id, name, role, password")
      .eq("employee_id", employeeId)
      .single();

    if (error || !data || data.password !== password) {
      return false;
    }

    const emp: Employee = {
      id: data.id,
      employee_id: data.employee_id,
      name: data.name,
      role: data.role,
    };
    setEmployee(emp);
    localStorage.setItem("railsync_employee", JSON.stringify(emp));
    return true;
  };

  const logout = () => {
    setEmployee(null);
    localStorage.removeItem("railsync_employee");
  };

  return (
    <AuthContext.Provider value={{ employee, login, logout, isAuthenticated: !!employee }}>
      {children}
    </AuthContext.Provider>
  );
};
