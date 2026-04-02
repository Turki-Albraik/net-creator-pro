import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const getInitials = (name: string) =>
  name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const Passengers = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editPassenger, setEditPassenger] = useState<Passenger | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const { toast } = useToast();

  const fetchPassengers = async () => {
    const { data } = await supabase.from("passengers").select("*").order("created_at", { ascending: false });
    if (data) setPassengers(data as Passenger[]);
  };

  useEffect(() => { fetchPassengers(); }, []);

  const openEdit = (p: Passenger) => {
    setEditPassenger(p);
    setEditForm({ name: p.name, email: p.email || "", phone: p.phone || "" });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editPassenger || !editForm.name.trim()) return;
    const { error } = await supabase.from("passengers").update({
      name: editForm.name.trim(),
      email: editForm.email.trim() || null,
      phone: editForm.phone.trim() || null,
    } as any).eq("id", editPassenger.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Passenger Updated" });
    setEditOpen(false);
    fetchPassengers();
  };

  const handleDelete = async (id: string, name: string) => {
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
              <div className="space-y-2"><Label>Email</Label><Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
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
