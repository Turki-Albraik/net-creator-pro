import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countryCodes } from "@/lib/countryCodes";
import { hashPassword } from "@/contexts/AuthContext";
import PasswordChecklist from "@/components/PasswordChecklist";
import { getEmailError, getPhoneError, getPasswordError, isPasswordValid } from "@/lib/validators";

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  password: string;
  role: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showList, setShowList] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ employee_id: "", name: "", password: "", phone: "", countryCode: "+966", role: "Railway Administrator" });
  const { toast } = useToast();

  const fetchEmployees = async () => {
    const { data } = await supabase.from("employees").select("*").neq("role", "Passenger").order("created_at", { ascending: true });
    if (data) setEmployees(data as Employee[]);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ employee_id: "", name: "", password: "", phone: "", countryCode: "+966", role: "Railway Administrator" });
    setOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditId(emp.id);
    const fullPhone = emp.phone || "";
    const matched = countryCodes.find((cc) => fullPhone.startsWith(cc.code));
    setForm({
      employee_id: emp.employee_id,
      name: emp.name,
      password: "",
      phone: matched ? fullPhone.slice(matched.code.length) : fullPhone,
      countryCode: matched?.code || "+966",
      role: emp.role || "Railway Administrator",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    // For new employees, password is required. For edits, it's optional.
    if (!form.employee_id || !form.name || !form.phone || (!editId && !form.password)) {
      toast({ title: "Error", description: "ID, Name, Password and Phone are required", variant: "destructive" });
      return;
    }
    if (form.phone.replace(/\D/g, "").length !== 9) {
      toast({ title: "Error", description: "Phone must be exactly 9 digits", variant: "destructive" });
      return;
    }

    const autoEmail = `${form.employee_id}@sikkah.com`;

    // Backend validation
    const emailErr = getEmailError(autoEmail);
    if (emailErr) { toast({ title: "Error", description: emailErr, variant: "destructive" }); return; }
    const phoneErr = getPhoneError(`${form.countryCode}${form.phone}`);
    if (phoneErr) { toast({ title: "Error", description: phoneErr, variant: "destructive" }); return; }
    if (form.password.trim() !== "") {
      const pwErr = getPasswordError(form.password);
      if (pwErr) { toast({ title: "Error", description: pwErr, variant: "destructive" }); return; }
    }

    const payload: any = {
      employee_id: form.employee_id,
      name: form.name,
      role: form.role,
      email: autoEmail,
      phone: `${form.countryCode}${form.phone}`,
    };
    if (form.password.trim() !== "") {
      payload.password = await hashPassword(form.password);
    }

    if (editId) {
      const { error } = await supabase.from("employees").update(payload).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Employee Updated", description: `${form.name} has been updated` });
    } else {
      const { error } = await supabase.from("employees").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Employee Added", description: `${form.name} has been added successfully` });
    }
    setForm({ employee_id: "", name: "", password: "", phone: "", countryCode: "+966", role: "Railway Administrator" });
    setOpen(false);
    setEditId(null);
    fetchEmployees();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove employee ${name}?`)) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Employee Deleted", description: `${name} has been removed` });
    fetchEmployees();
  };

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "Railway Administrator": return "destructive";
      case "Passenger": return "secondary";
      default: return "default";
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <DashboardHeader title="Employees" subtitle="Manage your team members" />

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowList(!showList)}>
            {showList ? <><EyeOff className="h-4 w-4 mr-2" /> Hide List</> : <><Eye className="h-4 w-4 mr-2" /> Show List</>}
          </Button>
        </div>

        {showList && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Employee List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono">{emp.employee_id}</TableCell>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(emp.role)}>{emp.role}</Badge>
                      </TableCell>
                      <TableCell>{emp.email || "—"}</TableCell>
                      <TableCell>{emp.phone || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No employees found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Employees;
