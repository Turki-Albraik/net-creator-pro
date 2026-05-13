import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setValidating(false);
        return;
      }
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } },
        );
        setValid(res.ok);
      } catch {
        setValid(false);
      } finally {
        setValidating(false);
      }
    };
    validate();
  }, [token]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      setDone(true);
      toast({ title: "Unsubscribed", description: "You will no longer receive these emails." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Could not unsubscribe.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md rounded-3xl shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-2xl">Unsubscribe</CardTitle>
          <CardDescription>Manage your email preferences for سِـكَّـة</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {validating ? (
            <p className="text-sm text-muted-foreground py-4">Checking link...</p>
          ) : !valid ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <XCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or has expired.</p>
            </div>
          ) : done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <p className="text-sm text-muted-foreground">You've been unsubscribed successfully.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Click below to confirm you'd like to stop receiving emails from us.
              </p>
              <Button onClick={handleConfirm} disabled={submitting} className="w-full">
                {submitting ? "Unsubscribing..." : "Confirm Unsubscribe"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
