import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getEmailError } from "@/lib/validators";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ForgotPasswordDialog = ({ open, onOpenChange }: ForgotPasswordDialogProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = getEmailError(email);
    if (emailError) {
      toast({ title: "Invalid email", description: emailError, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("request-password-reset", {
        body: { email, appUrl: window.location.origin },
      });
      if (error) throw error;
      setSent(true);
      toast({
        title: "Reset link sent",
        description: "If that email exists, a reset link has been sent. Please check your inbox.",
      });
    } catch (err: any) {
      toast({
        title: "Something went wrong",
        description: err?.message || "Could not send reset link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setEmail("");
      setSent(false);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Reset your password</DialogTitle>
          <DialogDescription>
            Enter the email associated with your passenger account and we'll send you a reset link.
          </DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{email}</span>, a reset link
              is on its way. The link expires in 60 minutes.
            </p>
            <Button className="w-full" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
