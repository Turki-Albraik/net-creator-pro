import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
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
import { getEmailError, getPhoneError, getPasswordError, isPasswordValid, getNameError } from "@/lib/validators";

import { countryCodes } from "@/lib/countryCodes";

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = getNameError(name);
    if (nameErr) {
      toast({ title: "Error", description: nameErr, variant: "destructive" });
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
    // Generate verification token (raw, 32 bytes hex)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const verificationToken = Array.from(tokenBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    const { error } = await supabase.from("passengers").insert({
      name: name.trim(),
      email: email.trim(),
      phone: fullPhone,
      password: hashed,
      trips: 0,
      total_spent: 0,
      email_verified: false,
      verification_token: verificationToken,
      verification_token_expires_at: expiresAt,
    } as any);

    if (error) {
      setLoading(false);
      const msg = error.message.includes("duplicate") || error.message.includes("unique")
        ? "An account with this email already exists"
        : error.message;
      toast({ title: "Error", description: msg, variant: "destructive" });
      return;
    }

    // Send verification email
    const verifyUrl = `${window.location.origin}/verify-email?token=${verificationToken}`;
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "signup-verification",
          recipientEmail: email.trim(),
          idempotencyKey: `signup-verify-${verificationToken.slice(0, 16)}`,
          templateData: {
            name: name.trim(),
            verifyUrl,
            siteName: "سِـكَّـة",
          },
        },
      });
    } catch (e) {
      console.error("Failed to send verification email", e);
    }

    setLoading(false);

    toast({
      title: "Verify your email",
      description: `We sent a confirmation link to ${email.trim()}. Please verify your email before signing in.`,
    });
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
              <Input id="name" value={name} onChange={(e) => setName(e.target.value.replace(/[^A-Za-z\u00C0-\u024F\u0600-\u06FF\s'\-]/g, ""))} placeholder="Enter your full name" />
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && getPasswordError(password) && (
                <p className="text-xs text-destructive">{getPasswordError(password)}</p>
              )}
              <PasswordChecklist password={password} />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !isPasswordValid(password)}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
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
