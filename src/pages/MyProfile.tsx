import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { countryCodes } from "@/lib/countryCodes";

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) => phone.replace(/\D/g, "").length === 9;

const MyProfile = () => {
  const { employee, login } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!employee) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from("employees").select("*").eq("id", employee.id).single();
      if (data) {
        setName((data as any).name);
        setEmail((data as any).email || "");
        setPassword((data as any).password || "");
        const fullPhone = (data as any).phone || "";
        // Extract country code
        const matched = countryCodes.find((cc) => fullPhone.startsWith(cc.code));
        if (matched) {
          setCountryCode(matched.code);
          setPhone(fullPhone.slice(matched.code.length));
        } else {
          setPhone(fullPhone);
        }
      }
    };
    fetchProfile();
  }, [employee]);

  const handleSave = async () => {
    if (!employee) return;
    if (!name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    if (email && !validateEmail(email)) {
      toast({ title: "Error", description: "Please enter a valid email", variant: "destructive" });
      return;
    }
    if (phone && !validatePhone(phone)) {
      toast({ title: "Error", description: "Phone must be exactly 9 digits", variant: "destructive" });
      return;
    }

    setSaving(true);
    const oldName = employee.name;
    const newName = name.trim();
    const fullPhone = phone ? `${countryCode}${phone}` : null;

    const { error } = await supabase.from("employees").update({
      name: newName,
      email: email.trim() || null,
      phone: fullPhone,
      password: password,
    } as any).eq("id", employee.id);

    if (error) {
      setSaving(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Sync name to passengers table
    if (oldName !== newName) {
      const { data: passengers } = await supabase
        .from("passengers")
        .select("id, name")
        .eq("name", oldName);
      if (passengers) {
        for (const p of passengers as any[]) {
          await supabase.from("passengers").update({ name: newName } as any).eq("id", p.id);
        }
      }
      // Sync to reservations
      const { data: reservations } = await supabase
        .from("reservations")
        .select("id, passenger_name")
        .ilike("passenger_name", `%${oldName}%`);
      if (reservations) {
        for (const r of reservations as any[]) {
          const updated = r.passenger_name.replace(oldName, newName);
          await supabase.from("reservations").update({ passenger_name: updated } as any).eq("id", r.id);
        }
      }
    }

    // Update local storage
    const updatedEmployee = { ...employee, name: newName };
    localStorage.setItem("railsync_employee", JSON.stringify(updatedEmployee));

    setSaving(false);
    toast({ title: "Profile Updated", description: "Your information has been saved" });
    // Reload to refresh auth context
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="border-b border-border pb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Update your personal information</p>
        </div>

        <div className="mt-8 max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {email && !validateEmail(email) && <p className="text-xs text-destructive">Please enter a valid email</p>}
              </div>
              <div className="space-y-2">
                <Label>Phone (9 digits)</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((cc) => (
                        <SelectItem key={cc.code} value={cc.code}>{cc.flag} {cc.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    placeholder="5XXXXXXXX"
                    maxLength={9}
                    className="flex-1"
                  />
                </div>
                {phone && !validatePhone(phone) && <p className="text-xs text-destructive">Phone must be exactly 9 digits</p>}
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MyProfile;
