"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { CourtSize } from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, TextInput, Toggle } from "./field";

export function AddCourtDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addCourt = useStore((s) => s.addCourt);
  const [size, setSize] = useState<CourtSize>(4);
  const [numberStr, setNumberStr] = useState("1");
  const [count, setCount] = useState(1);
  const [error, setError] = useState("");

  // Derived — safe to use in logic; raw string lets users type freely
  const number = Math.max(1, parseInt(numberStr, 10) || 1);

  useEffect(() => {
    if (!open) return;
    const courts = useStore.getState().session.courts;
    const next = courts.length > 0
      ? courts.reduce((m, c) => Math.max(m, c.number), 0) + 1
      : 1;
    setNumberStr(String(next));
    setCount(1);
    setSize(4);
    setError("");
  }, [open]);

  const handleAdd = () => {
    const numbers = Array.from({ length: count }, (_, i) => number + i);
    const existing = new Set(useStore.getState().session.courts.map((c) => c.number));
    const conflicts = numbers.filter((n) => existing.has(n));

    if (conflicts.length > 0) {
      setError(
        `Court${conflicts.length > 1 ? "s" : ""} ${conflicts.join(", ")} already exist.`,
      );
      return;
    }

    const prev = useStore.getState().session;
    numbers.forEach((n) => addCourt(size, n));
    toast(count === 1 ? `Court ${String(number).padStart(2, "0")} added` : `${count} courts added`, {
      action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} eyebrow="Courts / New" title="Add court">
      <div className="space-y-5">

        <div className="grid grid-cols-2 gap-4">
          <Field label={count > 1 ? "Starting number" : "Court number"}>
            <TextInput
              value={numberStr}
              onChange={(v) => { setNumberStr(v.replace(/\D/g, "")); setError(""); }}
            />
          </Field>
          <Field label="Quantity">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { setCount((c) => Math.max(1, c - 1)); setError(""); }}
                className="w-8 h-8 border-[0.5px] border-hairline-2 font-mono text-[14px] text-bone-3 hover:text-bone hover:border-bone-3 cursor-pointer transition-colors flex items-center justify-center"
              >
                −
              </button>
              <span className="font-mono digit text-[16px] w-8 text-center text-bone tabular-nums">
                {count}
              </span>
              <button
                type="button"
                onClick={() => { setCount((c) => Math.min(8, c + 1)); setError(""); }}
                className="w-8 h-8 border-[0.5px] border-hairline-2 font-mono text-[14px] text-bone-3 hover:text-bone hover:border-bone-3 cursor-pointer transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          </Field>
        </div>

        <Field label="Format">
          <div className="flex gap-2">
            <Toggle active={size === 2} onClick={() => setSize(2)} label="Singles · 2" />
            <Toggle active={size === 4} onClick={() => setSize(4)} label="Doubles · 4" />
          </div>
        </Field>

        {count > 1 && (
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone-4">
            Creates courts {number}–{number + count - 1}
          </p>
        )}

        {error && (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-alert">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t-[0.5px] border-hairline-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="solid" onClick={handleAdd}>
            {count === 1 ? "Add court" : `Add ${count} courts`}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
