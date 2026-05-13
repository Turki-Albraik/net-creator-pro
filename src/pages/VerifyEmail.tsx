import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import logoImg from "@/assets/logo.png";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke("verify-email", {
        body: { token },
      });
      if (error || (data && data.error)) {
        setStatus("error");
        setMessage((data && data.error) || error?.message || "Verification failed.");
        return;
      }
      if (data?.alreadyVerified) {
        setStatus("already");
      } else {
        setStatus("success");
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md shadow-card border-muted-border rounded-3xl">
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-forest-950 flex items-center justify-center shadow-glow-green">
              <img src={logoImg} alt="سِـكَّـة logo" className="h-12 w-12 rounded-xl object-cover" />
            </div>
          </div>
          <div>
            <CardTitle className="font-serif text-2xl text-forest-950">Email Verification</CardTitle>
            <CardDescription className="mt-1 text-muted-text">
              {status === "loading" && "Verifying your email..."}
              {status === "success" && "Your email has been verified!"}
              {status === "already" && "Your email is already verified."}
              {status === "error" && "We couldn't verify your email."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
            {(status === "success" || status === "already") && (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            )}
            {status === "error" && <XCircle className="h-12 w-12 text-destructive" />}
          </div>
          {status === "error" && message && (
            <p className="text-sm text-destructive">{message}</p>
          )}
          {status !== "loading" && (
            <Button asChild className="w-full">
              <Link to="/login">Go to Sign In</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
