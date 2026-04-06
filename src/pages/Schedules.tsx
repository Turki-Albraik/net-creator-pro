import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface TrainRoute {
  id: string;
  train_id: string;
  source: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  total_seats: number;
  price_per_ticket: number;
  distance_km: number;
  status: string;
}

const emptyForm = {
  train_id: "", source: "", destination: "", departure_time: "", arrival_time: "",
  total_seats: "40", price_per_ticket: "", distance_km: "", status: "Active",
};

const statusColor = (s: string) => {
  if (s === "Active") return "default" as const;
  if (s === "Maintenance") return "secondary" as const;
  return "destructive" as const;
};

const Schedules = () => {
  const [schedules, setSchedules] = useState<TrainRoute[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const fetchSchedules = async () => {
    const { data } = await supabase.from("train_routes").select("*").order("created_at", { ascending: true });
    if (data) setSchedules(data as unknown as TrainRoute[]);
  };

  useEffect(() => { fetchSchedules(); }, []);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (s: TrainRoute) => {
    setEditId(s.id);
    setForm({
      train_id: s.train_id, source: s.source, destination: s.destination,
      departure_time: s.departure_time, arrival_time: s.arrival_time,
      total_seats: String(s.total_seats), price_per_ticket: String(s.price_per_ticket),
      distance_km: String(s.distance_km), status: s.status || "Active",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.train_id || !form.source || !form.destination || !form.departure_time || !form.arrival_time || !form.price_per_ticket || !form.distance_km) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    const payload = {
      train_id: form.train_id,
      source: form.source,
      destination: form.destination,
      departure_time: form.departure_time,
      arrival_time: form.arrival_time,
      total_seats: parseInt(form.total_seats) || 40,
      price_per_ticket: parseFloat(form.price_per_ticket),
      distance_km: parseInt(form.distance_km),
      status: form.status,
    };

    if (editId) {
      const { error } = await supabase.from("train_routes").update(payload as any).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Train Updated", description: `${form.train_id} has been updated` });
    } else {
      const { error } = await supabase.from("train_routes").insert(payload as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Train Added", description: `${form.train_id} has been added` });
    }
    setForm(emptyForm);
    setOpen(false);
    setEditId(null);
    fetchSchedules();
  };

  const handleDelete = async (id: string, name: string) => {
    const { error } = await supabase.from("train_routes").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Train Deleted", description: `${name} has been removed` });
    fetchSchedules();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Train Schedules</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage routes, timings, and capacity</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditId(null); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> Add Train</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Edit Train Route" : "Add New Train Route"}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Train ID</Label>
                    <Input value={form.train_id} onChange={(e) => setForm({ ...form, train_id: e.target.value })} placeholder="e.g. TR-700" />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Seats</Label>
                    <Input type="number" value={form.total_seats} onChange={(e) => setForm({ ...form, total_seats: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Distance (km)</Label>
                    <Input type="number" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} placeholder="e.g. 950" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g. Riyadh" />
                  </div>
                  <div className="space-y-2">
                    <Label>Destination</Label>
                    <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="e.g. Jeddah" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Departure Time</Label>
                    <Input type="time" value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Arrival Time</Label>
                    <Input type="time" value={form.arrival_time} onChange={(e) => setForm({ ...form, arrival_time: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Price per Ticket (SAR)</Label>
                  <Input type="number" value={form.price_per_ticket} onChange={(e) => setForm({ ...form, price_per_ticket: e.target.value })} placeholder="e.g. 250" />
                </div>
                <Button onClick={handleSave} className="w-full">{editId ? "Update Train" : "Add Train Route"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Train ID</TableHead>
                <TableHead className="font-semibold">Route</TableHead>
                <TableHead className="font-semibold">Departure</TableHead>
                <TableHead className="font-semibold">Arrival</TableHead>
                <TableHead className="font-semibold">Capacity</TableHead>
                <TableHead className="font-semibold">Price</TableHead>
                <TableHead className="font-semibold">Distance</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono font-medium">{s.train_id}</TableCell>
                  <TableCell>{s.source} → {s.destination}</TableCell>
                  <TableCell>{s.departure_time}</TableCell>
                  <TableCell>{s.arrival_time}</TableCell>
                  <TableCell>{s.total_seats} seats</TableCell>
                  <TableCell className="font-medium">SAR {s.price_per_ticket}</TableCell>
                  <TableCell className="text-muted-foreground">{s.distance_km} km</TableCell>
                  <TableCell><Badge variant={statusColor(s.status)}>{s.status || "Active"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id, s.train_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {schedules.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No trains scheduled</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default Schedules;
