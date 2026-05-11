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

    // Handle Google OAuth session -> map to passenger row
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const handleSession = async (session: any) => {
        if (!session?.user?.email) return;
        const user = session.user;
        const email = user.email as string;
        const fullName =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          email.split("@")[0];

        // Find or create passenger
        let { data: pData } = await supabase
          .from("passengers")
          .select("id, name")
          .eq("email", email)
          .maybeSingle();

        if (!pData) {
          const { data: inserted } = await supabase
            .from("passengers")
            .insert({
              name: fullName,
              email,
              trips: 0,
              total_spent: 0,
            } as any)
            .select("id, name")
            .single();
          pData = inserted as any;
        }

        if (!pData) return;

        const emp: Employee = {
          id: (pData as any).id,
          employee_id: `P-${(pData as any).id.slice(0, 8).toUpperCase()}`,
          name: (pData as any).name,
          role: "Passenger",
        };
        setEmployee(emp);
        localStorage.setItem("railsync_employee", JSON.stringify(emp));
      };

      const { data: { session } } = await supabase.auth.getSession();
      if (session && !localStorage.getItem("railsync_employee")) {
        await handleSession(session);
      }

      supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          handleSession(session);
        }
      });
    })();
  }, []);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    const { supabase } = await import("@/integrations/supabase/client");

    // 1. Try admin (employees table) by employee_id, then by email
    let { data, error } = await supabase
      .from("employees")
      .select("id, employee_id, name, role, password")
      .eq("employee_id", identifier)
      .maybeSingle();

    if (!data) {
      const result = await supabase
        .from("employees")
        .select("id, employee_id, name, role, password")
        .eq("email", identifier)
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
      .select("id, name, email, password")
      .eq("email", identifier)
      .maybeSingle();

    if (!pData) return false;
    if ((pData as any).password !== hashedInput && (pData as any).password !== password) {
      return false;
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
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.signOut().catch(() => {});
    });
  };

  return (
    <AuthContext.Provider value={{ employee, login, logout, isAuthenticated: !!employee }}>
      {children}
    </AuthContext.Provider>
  );
};
