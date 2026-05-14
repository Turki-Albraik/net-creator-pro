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

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export { hashPassword };

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

  const login = async (identifier: string, password: string): Promise<boolean> => {
    const { supabase } = await import("@/integrations/supabase/client");

    const trimmed = identifier.trim();

    // 1. Try admin (employees table) by employee_id, then by email (case-insensitive)
    let { data, error } = await supabase
      .from("employees")
      .select("id, employee_id, name, role, password")
      .eq("employee_id", trimmed)
      .maybeSingle();

    if (!data) {
      const result = await supabase
        .from("employees")
        .select("id, employee_id, name, role, password")
        .ilike("email", trimmed)
        .maybeSingle();
      data = result.data;
      error = result.error;
    }

    const hashedInput = await hashPassword(password);

    if (data) {
      if ((data as any).password !== hashedInput && (data as any).password !== password) {
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
    }

    // 2. Try passenger (passengers table) by email
    const { data: pData } = await supabase
      .from("passengers")
      .select("id, name, email, password, email_verified")
      .ilike("email", trimmed)
      .maybeSingle();

    if (!pData) return false;
    if ((pData as any).password !== hashedInput && (pData as any).password !== password) {
      return false;
    }

    // Block sign-in until email is verified
    if ((pData as any).email_verified === false) {
      throw new Error("EMAIL_NOT_VERIFIED");
    }

    const emp: Employee = {
      id: (pData as any).id,
      employee_id: `P-${(pData as any).id.slice(0, 8).toUpperCase()}`,
      name: (pData as any).name,
      role: "Passenger",
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
