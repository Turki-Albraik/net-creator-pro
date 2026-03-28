import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Passenger {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  trips: number;
  totalSpent: string;
}

const initialPassengers: Passenger[] = [
  { id: "P-001", name: "Ahmed Al-Farsi", initials: "AF", email: "ahmed@email.com", phone: "+966 55 123 4567", trips: 14, totalSpent: "SAR 3,480" },
  { id: "P-002", name: "Sara Al-Qahtani", initials: "SQ", email: "sara@email.com", phone: "+966 50 234 5678", trips: 8, totalSpent: "SAR 1,620" },
  { id: "P-003", name: "Omar Al-Rashid", initials: "OR", email: "omar@email.com", phone: "+966 54 345 6789", trips: 22, totalSpent: "SAR 5,240" },
  { id: "P-004", name: "Noura Al-Shehri", initials: "NS", email: "noura@email.com", phone: "+966 56 456 7890", trips: 5, totalSpent: "SAR 1,100" },
  { id: "P-005", name: "Khalid Al-Mutairi", initials: "KM", email: "khalid@email.com", phone: "+966 59 567 8901", trips: 31, totalSpent: "SAR 7,860" },
];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const Passengers = () => {
  const [passengers, setPassengers] = useState<Passenger[]>(initialPassengers);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    else if (form.name.trim().length > 100) errs.name = "Name too long";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Invalid email";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    else if (form.phone.trim().length < 8) errs.phone = "Phone too short";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    const newId = `P-${String(passengers.length + 1).padStart(3, "0")}`;
    const newPassenger: Passenger = {
      id: newId,
      name: form.name.trim(),
      initials: getInitials(form.name.trim()),
      email: form.email.trim(),
      phone: form.phone.trim(),
      trips: 0,
      totalSpent: "SAR 0",
    };
    setPassengers((prev) => [...prev, newPassenger]);
    setForm({ name: "", email: "", phone: "" });
    setErrors({});
    setOpen(false);
    toast({ title: "Passenger added", description: `${newPassenger.name} has been registered.` });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Passengers</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage passenger profiles and history</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setErrors({}); setForm({ name: "", email: "", phone: "" }); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Passenger
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Add New Passenger</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="e.g. Mohammed Al-Salem" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="e.g. mohammed@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="e.g. +966 55 000 0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAdd}>Add Passenger</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Passenger</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Total Trips</TableHead>
                <TableHead className="font-semibold">Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passengers.map((p) => (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{p.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-card-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.email}</TableCell>
                  <TableCell className="text-muted-foreground">{p.phone}</TableCell>
                  <TableCell className="font-medium">{p.trips}</TableCell>
                  <TableCell className="font-semibold">{p.totalSpent}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default Passengers;
