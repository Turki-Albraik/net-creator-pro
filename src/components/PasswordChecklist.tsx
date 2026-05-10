import { checkPassword } from "@/lib/validators";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PasswordChecklist = ({ password }: { password: string }) => {
  const c = checkPassword(password);
  const Item = ({ ok, label }: { ok: boolean; label: string }) => (
    <li className={cn("flex items-center gap-2 text-xs", ok ? "text-green-600" : "text-muted-foreground")}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </li>
  );
  return (
    <ul className="space-y-1 mt-1">
      <Item ok={c.length} label="At least 6 characters" />
      <Item ok={c.number} label="Contains at least one number (0-9)" />
      <Item ok={c.special} label="Contains at least one special character (!@#$%^&*)" />
    </ul>
  );
};

export default PasswordChecklist;
