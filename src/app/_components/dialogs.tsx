"use client";

import { useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import {
  GENDER_LABEL,
  LEVELS,
  LEVEL_LABEL,
  type CourtSize,
  type Gender,
  type Level,
} from "@/lib/types";
import { Button, Chip } from "./ui";
import { Dialog } from "./dialog";

export function AddPlayerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addPlayer } = useStore();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [level, setLevel] = useState<Level>("intermediate");
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");

  return (
    <Dialog open={open} onClose={onClose} title="Sign in player">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const added = addPlayer({ name, gender, level, paid });
          if (!added) {
            setError(
              "Duplicate player. Matching name, level, and gender count as the same player.",
            );
            return;
          }
          setName("");
          setPaid(false);
          setError("");
          onClose();
        }}
        className="space-y-4"
      >
        <Field label="Name">
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder="Mia Cruz"
            className="w-full bg-transparent border-b-2 border-ink/30 focus:border-ink outline-none px-1 py-2 font-display text-2xl"
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
          <div className="grid grid-cols-3 gap-1.5">
            {LEVELS.map((lv) => (
              <Toggle
                key={lv}
                active={level === lv}
                onClick={() => {
                  setLevel(lv);
                  if (error) setError("");
                }}
                label={LEVEL_LABEL[lv]}
              />
            ))}
          </div>
        </Field>

        <Field label="Payment">
          <div className="flex gap-2">
            <Toggle
              active={paid}
              onClick={() => setPaid(true)}
              label="Paid"
            />
            <Toggle
              active={!paid}
              onClick={() => setPaid(false)}
              label="Unpaid"
            />
          </div>
        </Field>

        {error ? (
          <p className="text-[11px] font-mono uppercase tracking-wide text-clay">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2 border-t border-rule">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="ink">
            Sign in
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function AddCourtDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addCourt } = useStore();
  const [size, setSize] = useState<CourtSize>(4);
  return (
    <Dialog open={open} onClose={onClose} title="Add court">
      <div className="space-y-4">
        <Field label="Format">
          <div className="flex gap-2">
            <Toggle active={size === 2} onClick={() => setSize(2)} label="Singles · 2" />
            <Toggle active={size === 4} onClick={() => setSize(4)} label="Doubles · 4" />
          </div>
        </Field>
        <div className="flex justify-end gap-2 pt-2 border-t border-rule">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="ink"
            onClick={() => {
              addCourt(size);
              onClose();
            }}
          >
            Add court
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

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
  const { updateCourt } = useStore();
  const [size, setSize] = useState<CourtSize>(currentSize);
  const [number, setNumber] = useState(currentNumber);
  return (
    <Dialog open={open} onClose={onClose} title={`Edit court ${currentNumber}`}>
      <div className="space-y-4">
        <Field label="Court number">
          <input
            type="number"
            min={1}
            value={number}
            onChange={(e) => setNumber(Number(e.target.value))}
            className="w-full bg-transparent border-b-2 border-ink/30 focus:border-ink outline-none px-1 py-2 font-display text-2xl digit"
          />
        </Field>
        <Field label="Format">
          <div className="flex gap-2">
            <Toggle active={size === 2} onClick={() => setSize(2)} label="Singles · 2" />
            <Toggle active={size === 4} onClick={() => setSize(4)} label="Doubles · 4" />
          </div>
        </Field>
        {size !== currentSize ? (
          <p className="text-[11px] font-mono uppercase tracking-wide text-clay">
            Changing format clears slots on this court.
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2 border-t border-rule">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="ink"
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

export function ConfirmDeleteCourt({
  open,
  onClose,
  onConfirm,
  courtNumber,
  isOngoing,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  courtNumber: number;
  isOngoing: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={`Delete court ${courtNumber}?`}>
      <div className="space-y-4">
        <p className="text-ink-2 text-sm leading-relaxed">
          Court {courtNumber} and its slots will be removed. Players assigned to
          this court will be released back to the sign-in rail.
        </p>
        {isOngoing ? (
          <div className="border-l-2 border-clay pl-3 py-1">
            <Chip tone="clay">Ongoing match</Chip>
            <p className="text-ink-2 text-sm mt-2 leading-relaxed">
              The match in progress will not be recorded. No wins, losses, or
              games played will be counted for the players on this court.
            </p>
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2 border-t border-rule">
          <Button variant="ghost" onClick={onClose}>
            Keep court
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete court
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export function FinishMatchDialog({
  open,
  onClose,
  onFinish,
  teamANames,
  teamBNames,
}: {
  open: boolean;
  onClose: () => void;
  onFinish: (winner: "A" | "B" | "none") => void;
  teamANames: string[];
  teamBNames: string[];
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Finish match">
      <div className="space-y-3">
        <p className="text-ink-2 text-sm">Who won? Stats are recorded for the winning side.</p>
        <div className="grid grid-cols-2 gap-2">
          <SidePick names={teamANames} label="Side A" onClick={() => { onFinish("A"); onClose(); }} />
          <SidePick names={teamBNames} label="Side B" onClick={() => { onFinish("B"); onClose(); }} />
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-rule">
          <Button variant="ghost" onClick={() => { onFinish("none"); onClose(); }}>
            End without recording
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function SidePick({
  names,
  label,
  onClick,
}: {
  names: string[];
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left border-2 border-ink p-3 bg-paper hover:bg-accent transition-colors cursor-pointer group"
    >
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3 group-hover:text-ink-2">
        {label}
      </div>
      <div className="font-display text-lg leading-tight mt-1">
        {names.length ? names.join(" & ") : "—"}
      </div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3 mb-1.5">
        {label}
      </div>
      {children}
    </label>
  );
}

function Toggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 h-9 px-3 font-mono text-[11px] uppercase tracking-widest border transition-colors cursor-pointer ${
        active
          ? "bg-ink text-paper border-ink"
          : "bg-transparent text-ink-2 border-ink/25 hover:border-ink"
      }`}
    >
      {label}
    </button>
  );
}
