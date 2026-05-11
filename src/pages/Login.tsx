import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";

const Login = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !password) {
      toast({ title: "Error", description: "Please enter both ID and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    const success = await login(employeeId, password);
    setLoading(false);
    if (success) {
      navigate("/");
    } else {
      toast({ title: "Login Failed", description: "Invalid ID/email or password", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left dark panel */}
      <div className="relative md:w-1/2 bg-primary text-primary-foreground flex flex-col items-center justify-center p-10 railway-pattern overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-accent/40" />
        <div className="relative z-10 text-center max-w-sm">
          <img src={logoImg} alt="سِـكَّـة logo" className="h-20 w-20 rounded-2xl object-cover mx-auto mb-6 ring-4 ring-accent/30" />
          <h1 className="font-display text-5xl font-bold text-accent mb-3">سِـكَّـة</h1>
          <p className="text-sm uppercase tracking-[0.3em] text-primary-foreground/70 mb-8">Sikkah Railways</p>
          <p className="text-base text-primary-foreground/80 leading-relaxed">
            On time. On track. Manage every journey with confidence.
          </p>
          {/* Decorative track */}
          <svg viewBox="0 0 200 40" className="mt-10 w-full opacity-40" fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5">
            <line x1="0" y1="14" x2="200" y2="14" />
            <line x1="0" y1="26" x2="200" y2="26" />
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={i} x1={i * 10 + 2} y1="10" x2={i * 10 + 2} y2="30" />
            ))}
          </svg>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md border-l-4 border-l-accent shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-3xl font-semibold text-primary">Welcome back</CardTitle>
            <CardDescription className="mt-1 label-caps">Sign in to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="label-caps">ID / Email</Label>
                <Input id="employeeId" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Enter your ID or email" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="label-caps">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11 font-semibold tracking-wide" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                New passenger?{" "}
                <Link to="/signup" className="text-accent hover:underline font-semibold">Create an account</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
