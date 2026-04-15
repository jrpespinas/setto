"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Match"
      title="Finish match"
    >
      <div className="space-y-4">
        <p className="text-bone-2 text-sm leading-relaxed">
          Who won? Wins, losses, and games-played are recorded against the
          match result. This cannot be undone.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <SidePick
            names={teamANames}
            label="Side A"
            onClick={() => {
              onFinish("A");
              onClose();
            }}
          />
          <SidePick
            names={teamBNames}
            label="Side B"
            onClick={() => {
              onFinish("B");
              onClose();
            }}
          />
        </div>
        <button
          onClick={() => {
            onFinish("none");
            onClose();
          }}
          className="w-full text-left border-[0.5px] border-dashed border-hairline-2 hover:border-bone p-3 cursor-pointer transition-colors group"
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-bone-4 group-hover:text-bone-3">
            Draw · no record
          </div>
          <div className="font-display italic text-sm text-bone-3 group-hover:text-bone mt-0.5">
            End without recording wins or losses
          </div>
        </button>
        <div className="flex justify-end pt-3 border-t-[0.5px] border-hairline-2">
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
      className="text-left border-[0.5px] border-hairline-2 p-3 bg-ink-050 hover:bg-neon-soft hover:border-neon transition-colors cursor-pointer group"
    >
      <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-bone-4 group-hover:text-neon">
        {label} wins
      </div>
      <div className="statement text-[18px] mt-1.5 text-bone">
        {names.length ? names.join(" & ") : "—"}
      </div>
    </button>
  );
}
