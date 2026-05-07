"use client";

import { useState, useRef, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { hashPassword } from "@/lib/hash";
import { useAuthStore } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";

export function SetupDialog() {
  const setup   = useAuthStore((s) => s.setup);

  const [password, setPassword]   = useState("");
  const [confirm,  setConfirm]    = useState("");
  const [hint,     setHint]       = useState("");
  const [error,    setError]      = useState("");
  const [loading,  setLoading]    = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) { setError("Password cannot be empty."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    const hash = await hashPassword(password);
    setup(hash, hint.trim());
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-ink-000/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-ink-100 border-[0.5px] border-hairline-3 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)] w-full max-w-[440px]">

        {/* Header */}
        <div className="px-6 py-5 border-b-[0.5px] border-hairline-2">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={14} strokeWidth={2.5} className="text-neon shrink-0" />
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-neon">Security Setup</span>
          </div>
          <h2 className="statement text-[28px]">Create a session password</h2>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="font-mono text-[11px] text-bone-3 leading-relaxed">
            This password protects <span className="text-bone">End Session</span> and <span className="text-bone">Reset All</span>.
            Only the QM should know it.
          </p>

          <div className="space-y-3">
            {/* Password */}
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone-4 block mb-1.5">
                Password
              </label>
              <input
                ref={passwordRef}
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a password"
                className="w-full border-[0.5px] border-hairline-2 bg-ink-050 px-3 py-2.5 font-display text-[14px] text-bone placeholder:text-bone-4 outline-none focus:border-bone-3 transition-colors"
              />
            </div>

            {/* Confirm */}
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone-4 block mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full border-[0.5px] border-hairline-2 bg-ink-050 px-3 py-2.5 font-display text-[14px] text-bone placeholder:text-bone-4 outline-none focus:border-bone-3 transition-colors"
              />
            </div>

            {/* Hint */}
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone-4 block mb-1.5">
                Hint <span className="text-bone-4 normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="e.g. My badminton year"
                className="w-full border-[0.5px] border-hairline-2 bg-ink-050 px-3 py-2.5 font-display text-[14px] text-bone placeholder:text-bone-4 outline-none focus:border-bone-3 transition-colors"
              />
              <p className="font-mono text-[9px] text-bone-4 mt-1.5">
                Shown on the password prompt as a reminder.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="font-mono text-[10px] text-alert uppercase tracking-[0.1em]">{error}</p>
          )}

          <Button type="submit" variant="solid" disabled={loading} className="w-full justify-center">
            {loading ? "Setting up…" : "Create password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
