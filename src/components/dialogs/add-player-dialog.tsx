"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { GENDER_LABEL, LEVELS, LEVEL_FULL_LABEL, type Gender, type Level } from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, TextInput, Toggle } from "./field";

export function AddPlayerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addPlayer = useStore((s) => s.addPlayer);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [level, setLevel] = useState<Level>("intermediate");
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  // Programmatic focus works on mobile where autoFocus is suppressed in modals.
  // 120ms delay lets the modal animation finish before the keyboard is invoked.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => nameRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open]);

  const reset = () => {
    setName("");
    setPaid(false);
    setError("");
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      eyebrow="Roster / New"
      title="Add player"
      placement="top-right"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const prev = useStore.getState().session;
          const ok = addPlayer({ name, gender, level, paid });
          if (!ok) {
            setError("Duplicate — same name, gender, and level exists.");
            return;
          }
          toast(`${name.trim()} added`, {
            action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
          });
          reset();
          onClose();
        }}
        className="space-y-5"
      >
        <Field label="Name">
          <TextInput
            ref={nameRef}
            value={name}
            onChange={(v) => {
              setName(v);
              if (error) setError("");
            }}
            placeholder="Mia Cruz"
          />
        </Field>

        <Field label="Gender">
          <div className="flex gap-2">
            {(["male", "female"] as Gender[]).map((g) => (
              <Toggle
                key={g}
                active={gender === g}
                onClick={() => {
                  setGender(g);
                  if (error) setError("");
                }}
                label={GENDER_LABEL[g]}
              />
            ))}
          </div>
        </Field>

        <Field label="Level">
          <div className="grid grid-cols-2 gap-1.5">
            {LEVELS.map((lv) => (
              <Toggle
                key={lv}
                active={level === lv}
                onClick={() => {
                  setLevel(lv);
                  if (error) setError("");
                }}
                label={LEVEL_FULL_LABEL[lv]}
              />
            ))}
          </div>
        </Field>

        <Field label="Payment">
          <div className="flex gap-2">
            <Toggle active={paid} onClick={() => setPaid(true)} label="Paid" />
            <Toggle active={!paid} onClick={() => setPaid(false)} label="Unpaid" />
          </div>
        </Field>

        {error ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-3 border-t-[0.5px] border-hairline-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" variant="solid">
            Add
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
