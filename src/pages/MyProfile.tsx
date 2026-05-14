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
import { hashPassword } from "@/contexts/AuthContext";
import PasswordChecklist from "@/components/PasswordChecklist";
import { getEmailError, getPhoneError, getPasswordError, isPasswordValid, getNameError } from "@/lib/validators";

import { countryCodes } from "@/lib/countryCodes";

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) => phone.replace(/\D/g, "").length === 9;

const MyProfile = () => {
  const { employee } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Determine which table this user lives in
  const isPassenger = employee?.role === "Passenger";
  const tableName = isPassenger ? "passengers" : "employees";

  useEffect(() => {
    if (!employee) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from(tableName as any).select("*").eq("id", employee.id).single();
      if (data) {
        setName((data as any).name);
        setEmail((data as any).email || "");
        // Do NOT pre-fill password — keep blank
        setPassword("");
        const fullPhone = (data as any).phone || "";
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
  }, [employee, tableName]);

  const handleSave = async () => {
    if (!employee) return;
    const nameErr = getNameError(name);
    if (nameErr) {
      toast({ title: "Error", description: nameErr, variant: "destructive" });
      return;
    }
    if (phone) {
      const phoneErr = getPhoneError(`${countryCode}${phone}`);
      if (phoneErr) { toast({ title: "Error", description: phoneErr, variant: "destructive" }); return; }
    }
    if (password.trim() !== "") {
      const pwErr = getPasswordError(password);
      if (pwErr) { toast({ title: "Error", description: pwErr, variant: "destructive" }); return; }
    }

    setSaving(true);
    const oldName = employee.name;
    const newName = name.trim();
    const fullPhone = phone ? `${countryCode}${phone}` : null;

    const updatePayload: any = {
      name: newName,
      phone: fullPhone,
    };
    // Only update password if user typed one
    if (password.trim() !== "") {
      updatePayload.password = await hashPassword(password);
    }

    const { error } = await supabase.from(tableName as any).update(updatePayload).eq("id", employee.id);

    if (error) {
      setSaving(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Sync name across passengers & reservations records (only when name changed)
    if (oldName !== newName) {
      // For admins: also update matching passengers row by exact name
      if (!isPassenger) {
        const { data: passengers } = await supabase
          .from("passengers")
          .select("id, name")
          .eq("name", oldName);
        if (passengers) {
          for (const p of passengers as any[]) {
            await supabase.from("passengers").update({ name: newName } as any).eq("id", p.id);
          }
        }
      }
      // Reservations: split by ", " and exact-compare each part
      const { data: reservations } = await supabase
        .from("reservations")
        .select("id, passenger_name");
      if (reservations) {
        for (const r of reservations as any[]) {
          const parts = (r.passenger_name as string).split(", ");
          if (!parts.some((p) => p === oldName)) continue;
          const updated = parts.map((p) => (p === oldName ? newName : p)).join(", ");
          await supabase.from("reservations").update({ passenger_name: updated } as any).eq("id", r.id);
        }
      }
    }

    const updatedEmployee = { ...employee, name: newName };
    localStorage.setItem("railsync_employee", JSON.stringify(updatedEmployee));

    setSaving(false);
    setPassword("");
    toast({ title: "Profile Updated", description: "Your information has been saved" });
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-16 pt-20 md:pt-8 px-4 md:px-8 pb-8">
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
                <Input value={name} onChange={(e) => setName(e.target.value.replace(/[^A-Za-z\u00C0-\u024F\u0600-\u06FF\s'\-]/g, ""))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} readOnly disabled className="bg-muted cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
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
