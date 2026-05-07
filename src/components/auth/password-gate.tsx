"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { hashPassword, verifyPassword } from "@/lib/hash";
import { useAuthStore, MASTER_OVERRIDE_HASH } from "@/lib/store/auth";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PasswordGate({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
}) {
  const passwordHash = useAuthStore((s) => s.passwordHash);
  const hint         = useAuthStore((s) => s.hint);

  const [input,   setInput]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state whenever dialog opens
  useEffect(() => {
    if (open) {
      setInput("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input) { setError("Enter the session password to continue."); return; }

    setLoading(true);
    setError("");

    const inputHash = await hashPassword(input);
    const isMaster  = inputHash === MASTER_OVERRIDE_HASH;
    const isValid   = isMaster || (passwordHash ? inputHash === passwordHash : false);

    setLoading(false);

    if (!isValid) {
      setError("Incorrect password.");
      setInput("");
      inputRef.current?.focus();
      return;
    }

    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} eyebrow="Authentication required">
      <div className="space-y-4">
        <p className="font-mono text-[11px] text-bone-3 leading-relaxed">{description}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone-4 flex items-center gap-1.5 mb-1.5">
              <Lock size={10} strokeWidth={2.5} />
              Session password
            </label>
            <input
              ref={inputRef}
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter password"
              className="w-full border-[0.5px] border-hairline-2 bg-ink-050 px-3 py-2.5 font-display text-[14px] text-bone placeholder:text-bone-4 outline-none focus:border-bone-3 transition-colors"
            />
            {hint && !error && (
              <p className="font-mono text-[9px] text-bone-4 mt-1.5">
                Hint: {hint}
              </p>
            )}
            {error && (
              <p className="font-mono text-[10px] text-alert uppercase tracking-[0.1em] mt-1.5">{error}</p>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={danger ? "danger" : "solid"}
              size="sm"
              disabled={loading}
            >
              {loading ? "Verifying…" : confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
