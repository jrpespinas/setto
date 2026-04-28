"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { CourtSize } from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, TextInput, Toggle } from "./field";

export function EditCourtDialog({
  courtId,
  currentSize,
  currentNumber,
  open,
  onClose,
}: {
  courtId: string;
  currentSize: CourtSize;
  currentNumber: number;
  open: boolean;
  onClose: () => void;
}) {
  const updateCourt = useStore((s) => s.updateCourt);
  const [size, setSize] = useState<CourtSize>(currentSize);
  const [numberStr, setNumberStr] = useState(String(currentNumber));
  const [error, setError] = useState("");

  const number = Math.max(1, parseInt(numberStr, 10) || 1);

  useEffect(() => {
    if (open) { setSize(currentSize); setNumberStr(String(currentNumber)); setError(""); }
  }, [open, currentSize, currentNumber]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow={`Courts / Edit`}
      title={`Court ${String(currentNumber).padStart(2, "0")}`}
    >
      <div className="space-y-5">
        <Field label="Court number">
          <TextInput
            value={numberStr}
            onChange={(v) => { setNumberStr(v.replace(/\D/g, "")); setError(""); }}
          />
        </Field>
        <Field label="Format">
          <div className="flex gap-2">
            <Toggle active={size === 2} onClick={() => setSize(2)} label="Singles · 2" />
            <Toggle active={size === 4} onClick={() => setSize(4)} label="Doubles · 4" />
          </div>
        </Field>
        {size !== currentSize && (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-alert">
            Changing format clears slots on this court.
          </p>
        )}
        {error && (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-alert">{error}</p>
        )}
        <div className="flex justify-end gap-2 pt-3 border-t-[0.5px] border-hairline-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="solid"
            onClick={() => {
              const prev = useStore.getState().session;
              const ok = updateCourt(courtId, { size, number });
              if (!ok) { setError(`Court ${number} already exists.`); return; }
              toast(`Court ${String(number).padStart(2, "0")} updated`, {
                action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
              });
              onClose();
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
