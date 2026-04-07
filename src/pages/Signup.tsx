import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";

const countryCodes = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼" },
  { code: "+968", country: "Oman", flag: "🇴🇲" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+962", country: "Jordan", flag: "🇯🇴" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
];

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) => phone.replace(/\D/g, "").length === 9;

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    if (!validateEmail(email)) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    if (!validatePhone(phone)) {
      toast({ title: "Error", description: "Phone must be exactly 9 digits", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Generate a unique employee_id for passenger
    const employeeId = `P-${Date.now().toString().slice(-6)}`;

    const { error } = await supabase.from("employees").insert({
      employee_id: employeeId,
      name: name.trim(),
      password: password,
      role: "Passenger",
      email: email.trim(),
      phone: `${countryCode}${phone}`,
    } as any);

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Account Created!", description: `Your ID is ${employeeId}. Use it to sign in.` });
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
              {phone && !validatePhone(phone) && <p className="text-xs text-destructive">Phone must be exactly 9 digits</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
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
