import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Lock, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentCardProps {
  amountLabel: string;
  onPaid: () => void | Promise<void>;
  disabled?: boolean;
}

type Brand = "visa" | "mastercard" | "amex" | "unknown";

const detectBrand = (digits: string): Brand => {
  if (!digits) return "unknown";
  if (digits.startsWith("4")) return "visa";
  if (digits.startsWith("5")) return "mastercard";
  if (digits.startsWith("34") || digits.startsWith("37")) return "amex";
  return "unknown";
};

const formatCardNumber = (raw: string) =>
  raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

const formatExpiry = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
};

const VisaLogo = () => (
  <div className="px-2 py-1 rounded bg-white text-[#1a1f71] font-black italic text-sm tracking-tight shadow">VISA</div>
);
const MasterLogo = () => (
  <div className="flex items-center">
    <div className="w-6 h-6 rounded-full bg-[#eb001b]" />
    <div className="w-6 h-6 rounded-full bg-[#f79e1b] -ml-3 mix-blend-multiply" />
  </div>
);
const AmexLogo = () => (
  <div className="px-2 py-1 rounded bg-[#2e77bb] text-white font-bold text-xs tracking-wider shadow">AMEX</div>
);

const PaymentCard = ({ amountLabel, onPaid, disabled }: PaymentCardProps) => {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<string | null>(null);

  const digits = number.replace(/\s/g, "");
  const brand = detectBrand(digits);
  const cvvMax = brand === "amex" ? 4 : 3;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const n = name.trim();
    if (!n) e.name = "Cardholder name is required";
    else if (!/^[A-Za-z\s]+$/.test(n)) e.name = "Letters and spaces only";
    else if (n.split(/\s+/).filter(Boolean).length < 2) e.name = "Enter first and last name";

    if (digits.length === 0) e.number = "Card number is required";
    else if (digits.length !== 16) e.number = "Card number must be 16 digits";

    if (expiry.length !== 5) e.expiry = "Format MM/YY";
    else {
      const [mm, yy] = expiry.split("/").map((x) => parseInt(x, 10));
      if (!mm || mm < 1 || mm > 12) e.expiry = "Invalid month";
      else {
        const now = new Date();
        const expDate = new Date(2000 + yy, mm); // first of next month
        if (expDate <= new Date(now.getFullYear(), now.getMonth())) e.expiry = "Card expired";
      }
    }

    if (cvv.length !== cvvMax) e.cvv = `CVV must be ${cvvMax} digits`;
    return e;
  }, [name, digits, expiry, cvv, cvvMax]);

  const isValid = Object.keys(errors).length === 0;

  const showErr = (k: string) => touched[k] && errors[k];

  const handlePay = async () => {
    setTouched({ name: true, number: true, expiry: true, cvv: true });
    if (!isValid) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2500));
    const txn = `TXN-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-5)}`;
    setSuccess(txn);
    setProcessing(false);
    setTimeout(() => {
      onPaid();
    }, 1500);
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" strokeWidth={2.5} />
        </div>
        <h3 className="font-display text-2xl font-bold">Payment Successful</h3>
        <p className="text-muted-foreground mt-1">Your booking is being confirmed…</p>
        <div className="mt-5 px-4 py-2 rounded-lg bg-muted font-mono text-sm">
          Transaction ID: <span className="font-bold text-foreground">{success}</span>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">Amount charged: {amountLabel}</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> Payment
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" /> Secure checkout
        </div>
      </div>

      {/* Realistic card preview */}
      <div
        className={cn(
          "relative h-52 rounded-2xl p-6 text-white shadow-2xl overflow-hidden transition-transform duration-500",
          "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950",
        )}
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.35), transparent 40%), radial-gradient(circle at 80% 90%, hsl(var(--secondary) / 0.3), transparent 45%), linear-gradient(135deg, #0f172a, #1e293b)",
        }}
      >
        <div className="flex justify-between items-start">
          <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-inner" />
          <div className="h-8 flex items-center">
            {brand === "visa" && <VisaLogo />}
            {brand === "mastercard" && <MasterLogo />}
            {brand === "amex" && <AmexLogo />}
          </div>
        </div>
        <div className="mt-6 font-mono text-xl tracking-[0.2em] [text-shadow:_0_1px_2px_rgb(0_0_0_/_50%)]">
          {(number || "•••• •••• •••• ••••").padEnd(19, "•").slice(0, 19)}
        </div>
        <div className="mt-4 flex justify-between items-end text-xs">
          <div>
            <div className="opacity-60 uppercase tracking-wider text-[10px]">Cardholder</div>
            <div className="font-medium uppercase tracking-wide truncate max-w-[180px]">
              {name || "YOUR NAME"}
            </div>
          </div>
          <div>
            <div className="opacity-60 uppercase tracking-wider text-[10px]">Expires</div>
            <div className="font-mono">{expiry || "MM/YY"}</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Cardholder Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[^A-Za-z\s]/g, ""))}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            onFocus={() => setFocusField("name")}
            placeholder="John Smith"
          />
          {showErr("name") && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Card Number</Label>
          <div className="relative">
            <Input
              value={number}
              onChange={(e) => setNumber(formatCardNumber(e.target.value))}
              onBlur={() => setTouched((t) => ({ ...t, number: true }))}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              className="pr-16 font-mono tracking-wider"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {brand === "visa" && <VisaLogo />}
              {brand === "mastercard" && <MasterLogo />}
              {brand === "amex" && <AmexLogo />}
            </div>
          </div>
          {showErr("number") && <p className="text-xs text-destructive">{errors.number}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Expiry Date</Label>
            <Input
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              onBlur={() => setTouched((t) => ({ ...t, expiry: true }))}
              placeholder="MM/YY"
              inputMode="numeric"
              className="font-mono"
            />
            {showErr("expiry") && <p className="text-xs text-destructive">{errors.expiry}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>CVV</Label>
            <Input
              type="password"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, cvvMax))}
              onBlur={() => setTouched((t) => ({ ...t, cvv: true }))}
              placeholder={"•".repeat(cvvMax)}
              inputMode="numeric"
              maxLength={cvvMax}
              className="font-mono tracking-[0.4em]"
            />
            {showErr("cvv") && <p className="text-xs text-destructive">{errors.cvv}</p>}
          </div>
        </div>
      </div>

      <Button
        className="w-full h-12 text-base font-semibold"
        disabled={!isValid || processing || disabled}
        onClick={handlePay}
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Processing payment safely...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" /> Pay {amountLabel}
          </>
        )}
      </Button>
    </div>
  );
};

export default PaymentCard;
