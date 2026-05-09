import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface Passenger {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  trips: number;
  total_spent: number;
}

import { countryCodes } from "@/lib/countryCodes";

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
const validatePhone = (phone: string) => phone.replace(/\D/g, "").length === 9;

const getInitials = (name: string) =>
  name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const Passengers = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editPassenger, setEditPassenger] = useState<Passenger | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", countryCode: "+966" });
  const { toast } = useToast();

  const fetchPassengers = async () => {
    const { data } = await supabase.from("passengers").select("*").order("created_at", { ascending: false });
    if (data) setPassengers(data as Passenger[]);
  };

  useEffect(() => { fetchPassengers(); }, []);

  const openEdit = (p: Passenger) => {
    setEditPassenger(p);
    const fullPhone = p.phone || "";
    const matched = countryCodes.find((cc) => fullPhone.startsWith(cc.code));
    setEditForm({
      name: p.name,
      email: p.email || "",
      phone: matched ? fullPhone.slice(matched.code.length) : fullPhone,
      countryCode: matched?.code || "+966",
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editPassenger || !editForm.name.trim()) return;
    if (editForm.email && !validateEmail(editForm.email)) {
      toast({ title: "Error", description: "Please enter a valid email", variant: "destructive" });
      return;
    }
    if (editForm.phone && !validatePhone(editForm.phone)) {
      toast({ title: "Error", description: "Phone must be exactly 9 digits", variant: "destructive" });
      return;
    }

    const oldName = editPassenger.name;
    const newName = editForm.name.trim();
    const newEmail = editForm.email.trim() || null;
    const newPhone = editForm.phone ? `${editForm.countryCode}${editForm.phone}` : null;

    const { error } = await supabase.from("passengers").update({
      name: newName,
      email: newEmail,
      phone: newPhone,
    } as any).eq("id", editPassenger.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    // Safe split-and-compare to avoid substring corruption
    if (oldName !== newName) {
      const { data: reservations } = await supabase
        .from("reservations")
        .select("id, passenger_name");
      if (reservations) {
        for (const r of reservations as any[]) {
          const parts = (r.passenger_name as string).split(", ");
          if (!parts.some((p) => p === oldName)) continue;
          const updatedName = parts.map((p) => (p === oldName ? newName : p)).join(", ");
          await supabase.from("reservations").update({ passenger_name: updatedName } as any).eq("id", r.id);
        }
      }
    }

    toast({ title: "Passenger Updated" });
    setEditOpen(false);
    fetchPassengers();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete passenger ${name}?`)) return;
    const { error } = await supabase.from("passengers").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Passenger Deleted", description: `${name} has been removed` });
    fetchPassengers();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="border-b border-border pb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Passengers</h1>
          <p className="text-sm text-muted-foreground mt-1">Auto-populated from reservations</p>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Passenger</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                {editForm.email && !validateEmail(editForm.email) && <p className="text-xs text-destructive">Please enter a valid email</p>}
              </div>
              <div className="space-y-2">
                <Label>Phone (9 digits)</Label>
                <div className="flex gap-2">
                  <Select value={editForm.countryCode} onValueChange={(v) => setEditForm({ ...editForm, countryCode: v })}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((cc) => (
                        <SelectItem key={cc.code} value={cc.code}>{cc.flag} {cc.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, "").slice(0, 9) })}
                    placeholder="5XXXXXXXX"
                    maxLength={9}
                    className="flex-1"
                  />
                </div>
                {editForm.phone && !validatePhone(editForm.phone) && <p className="text-xs text-destructive">Phone must be exactly 9 digits</p>}
              </div>
              <Button onClick={handleUpdate} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-8 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Passenger</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Total Trips</TableHead>
                <TableHead className="font-semibold">Total Spent</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passengers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{getInitials(p.name)}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-card-foreground">{p.name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.email || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.phone || "—"}</TableCell>
                  <TableCell className="font-medium">{p.trips}</TableCell>
                  <TableCell className="font-semibold">SAR {Number(p.total_spent).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id, p.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {passengers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No passengers yet — they will appear after reservations are made</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default Passengers;
