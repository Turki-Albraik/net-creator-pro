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
import GoogleSignInButton from "@/components/GoogleSignInButton";
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logoImg} alt="سِـكَّـة logo" className="h-14 w-14 rounded-xl object-cover" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">سِـكَّـة</CardTitle>
            <CardDescription className="mt-1">Create a new Passenger account</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
              {email && !validateEmail(email) && <p className="text-xs text-destructive">Please enter a valid email</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone (9 digits) *</Label>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" />
              {password && getPasswordError(password) && (
                <p className="text-xs text-destructive">{getPasswordError(password)}</p>
              )}
              <PasswordChecklist password={password} />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !isPasswordValid(password)}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <GoogleSignInButton label="Sign up with Google" />
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
