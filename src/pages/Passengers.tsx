import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

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

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("passengers").select("*").order("created_at", { ascending: false });
      if (data) setPassengers(data as Passenger[]);
    };
    fetch();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="border-b border-border pb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Passengers</h1>
          <p className="text-sm text-muted-foreground mt-1">Auto-populated from reservations</p>
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
                </TableRow>
              ))}
              {passengers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No passengers yet — they will appear after reservations are made</TableCell>
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
