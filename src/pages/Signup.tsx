import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { hashPassword } from "@/contexts/AuthContext";
import logoImg from "@/assets/logo.png";
import PasswordChecklist from "@/components/PasswordChecklist";
import { getEmailError, getPhoneError, getPasswordError, isPasswordValid } from "@/lib/validators";

import { countryCodes } from "@/lib/countryCodes";

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    // Backend validation rules
    const fullPhone = `${countryCode}${phone}`;
    const emailErr = getEmailError(email.trim());
    if (emailErr) {
      toast({ title: "Error", description: emailErr, variant: "destructive" });
      return;
    }
    const phoneErr = getPhoneError(fullPhone);
    if (phoneErr) {
      toast({ title: "Error", description: phoneErr, variant: "destructive" });
      return;
    }
    const pwErr = getPasswordError(password);
    if (pwErr) {
      toast({ title: "Error", description: pwErr, variant: "destructive" });
      return;
    }

    setLoading(true);

    const hashed = await hashPassword(password);
    const { error } = await supabase.from("passengers").insert({
      name: name.trim(),
      email: email.trim(),
      phone: fullPhone,
      password: hashed,
      trips: 0,
      total_spent: 0,
    } as any);

    setLoading(false);

    if (error) {
      const msg = error.message.includes("duplicate") || error.message.includes("unique")
        ? "An account with this email already exists"
        : error.message;
      toast({ title: "Error", description: msg, variant: "destructive" });
      return;
    }

    toast({ title: "Account Created!", description: `Sign in with your email.` });
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <div className="relative md:w-1/2 bg-primary text-primary-foreground flex flex-col items-center justify-center p-10 railway-pattern overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-accent/40" />
        <div className="relative z-10 text-center max-w-sm">
          <img src={logoImg} alt="سِـكَّـة logo" className="h-20 w-20 rounded-2xl object-cover mx-auto mb-6 ring-4 ring-accent/30" />
          <h1 className="font-display text-5xl font-bold text-accent mb-3">سِـكَّـة</h1>
          <p className="text-sm uppercase tracking-[0.3em] text-primary-foreground/70 mb-8">Sikkah Railways</p>
          <p className="text-base text-primary-foreground/80 leading-relaxed">
            Book your seat. Track your journey. Travel the modern way.
          </p>
          <svg viewBox="0 0 200 40" className="mt-10 w-full opacity-40" fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5">
            <line x1="0" y1="14" x2="200" y2="14" />
            <line x1="0" y1="26" x2="200" y2="26" />
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={i} x1={i * 10 + 2} y1="10" x2={i * 10 + 2} y2="30" />
            ))}
          </svg>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md border-l-4 border-l-accent shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-3xl font-semibold text-primary">Create account</CardTitle>
            <CardDescription className="mt-1 label-caps">Passenger registration</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="label-caps">Full Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="label-caps">Email *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="h-11" />
                {email && !validateEmail(email) && <p className="text-xs text-destructive">Please enter a valid email</p>}
              </div>
              <div className="space-y-2">
                <Label className="label-caps">Phone (9 digits) *</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-36 h-11"><SelectValue /></SelectTrigger>
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
                    className="flex-1 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="label-caps">Password *</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" className="h-11" />
                {password && getPasswordError(password) && (
                  <p className="text-xs text-destructive">{getPasswordError(password)}</p>
                )}
                <PasswordChecklist password={password} />
              </div>
              <Button type="submit" className="w-full h-11 font-semibold tracking-wide" disabled={loading || !isPasswordValid(password)}>
                {loading ? "Creating Account..." : "Sign Up"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-accent hover:underline font-semibold">Sign In</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
