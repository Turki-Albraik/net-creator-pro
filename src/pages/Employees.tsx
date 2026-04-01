import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";

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
  const [form, setForm] = useState({ employee_id: "", name: "", password: "", role: "Railway Staff", email: "", phone: "" });
  const { toast } = useToast();

  const fetchEmployees = async () => {
    const { data } = await supabase.from("employees").select("*").order("created_at", { ascending: true });
    if (data) setEmployees(data as Employee[]);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleAdd = async () => {
    if (!form.employee_id || !form.name || !form.password) {
      toast({ title: "Error", description: "ID, Name and Password are required", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("employees").insert({
      employee_id: form.employee_id,
      name: form.name,
      password: form.password,
      role: form.role,
      email: form.email || null,
      phone: form.phone || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Employee Added", description: `${form.name} has been added successfully` });
    setForm({ employee_id: "", name: "", password: "", role: "employee", email: "", phone: "" });
    setOpen(false);
    fetchEmployees();
  };

  const handleDelete = async (id: string, name: string) => {
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
      case "staff": return "default";
      case "admin": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <DashboardHeader title="Employees" subtitle="Manage your team members" />

        <div className="flex gap-3 mt-6">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Employee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Employee ID</Label>
                    <Input value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} placeholder="e.g. 2" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Railway Administrator">Railway Administrator</SelectItem>
                        <SelectItem value="Railway Staff">Railway Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set a password" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email (optional)</Label>
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone (optional)</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+966..." />
                  </div>
                </div>
                <Button onClick={handleAdd} className="w-full">Add Employee</Button>
              </div>
            </DialogContent>
          </Dialog>

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
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id, emp.name)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
