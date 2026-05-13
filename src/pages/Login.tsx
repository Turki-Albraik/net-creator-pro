import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import ForgotPasswordDialog from "@/components/ForgotPasswordDialog";
import logoImg from "@/assets/logo.png";

const Login = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-forest-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-brand/20 blur-3xl pointer-events-none" />
      <Card className="w-full max-w-md relative shadow-card border-muted-border rounded-3xl">
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-forest-950 flex items-center justify-center shadow-glow-green">
              <img src={logoImg} alt="سِـكَّـة logo" className="h-12 w-12 rounded-xl object-cover" />
            </div>
          </div>
          <div>
            <CardTitle className="font-serif text-3xl text-forest-950">سِـكَّـة</CardTitle>
            <CardDescription className="mt-1 text-muted-text">Sign in to your account</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">ID / Email</Label>
              <Input id="employeeId" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Enter your ID or email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New passenger?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">Create an account</Link>
            </p>
          </form>
        </CardContent>
      </Card>
      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </div>
  );
};

export default Login;
