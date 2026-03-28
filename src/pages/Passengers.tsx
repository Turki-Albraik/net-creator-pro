import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const passengers = [
  { id: "P-001", name: "Ahmed Al-Farsi", initials: "AF", email: "ahmed@email.com", phone: "+966 55 123 4567", trips: 14, totalSpent: "SAR 3,480" },
  { id: "P-002", name: "Sara Al-Qahtani", initials: "SQ", email: "sara@email.com", phone: "+966 50 234 5678", trips: 8, totalSpent: "SAR 1,620" },
  { id: "P-003", name: "Omar Al-Rashid", initials: "OR", email: "omar@email.com", phone: "+966 54 345 6789", trips: 22, totalSpent: "SAR 5,240" },
  { id: "P-004", name: "Noura Al-Shehri", initials: "NS", email: "noura@email.com", phone: "+966 56 456 7890", trips: 5, totalSpent: "SAR 1,100" },
  { id: "P-005", name: "Khalid Al-Mutairi", initials: "KM", email: "khalid@email.com", phone: "+966 59 567 8901", trips: 31, totalSpent: "SAR 7,860" },
];

const Passengers = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Passengers</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage passenger profiles and history</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Passenger
          </Button>
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
