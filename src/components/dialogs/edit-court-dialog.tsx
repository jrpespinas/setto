"use client";

import { useState } from "react";
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
  const [number, setNumber] = useState(currentNumber);
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
            type="number"
            value={number}
            onChange={(v) => setNumber(Math.max(1, Number(v)))}
          />
        </Field>
        <Field label="Format">
          <div className="flex gap-2">
            <Toggle active={size === 2} onClick={() => setSize(2)} label="Singles · 2" />
            <Toggle active={size === 4} onClick={() => setSize(4)} label="Doubles · 4" />
          </div>
        </Field>
        {size !== currentSize ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-alert">
            Changing format clears slots on this court.
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-3 border-t-[0.5px] border-hairline-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="solid"
            onClick={() => {
              updateCourt(courtId, { size, number });
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
