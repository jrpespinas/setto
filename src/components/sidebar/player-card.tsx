"use client";

import { useState, type DragEvent } from "react";
import { useStore } from "@/lib/store";
import { LEVEL_LABEL, type Player } from "@/lib/types";
import { Chip } from "@/components/ui/chip";
import { formatShortDuration } from "@/lib/format";

/** Editorial player card.
 *  Hover reveals an action overlay — card content blurs behind it. */
export function PlayerCard({
  player,
  index,
  tick,
  variant,
  onEdit,
}: {
  player: Player;
  index: number;
  tick: number;
  variant: "idle" | "break" | "done";
  onEdit: () => void;
}) {
  const { setStatus, togglePaid, removePlayer } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const elapsed = tick - player.statusSince;
  const rail = variant === "idle"
    ? "bg-bone-3"
    : variant === "break"
      ? "bg-cold"
      : player.paid
        ? "bg-moss"
        : "bg-alert";

  const alertPulse = variant === "done" && !player.paid ? "pulse-alert" : "";

  const handleDragStart = (e: DragEvent<HTMLLIElement>) => {
    e.dataTransfer.setData("text/player-id", player.id);
    e.dataTransfer.effectAllowed = "move";
    document.body.classList.add("dragging");
  };

  const handleDragEnd = () => {
    document.body.classList.remove("dragging");
  };

  return (
    <li
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseLeave={() => setConfirmDelete(false)}
      className="group relative pl-3 pr-3 py-2.5 rule-bottom overflow-hidden cursor-grab active:cursor-grabbing"
    >
      {/* Status rail — 2px strip on left */}
      <span
        className={`absolute left-0 top-0 bottom-[0.5px] w-[2px] ${rail} ${alertPulse}`}
        aria-hidden
      />

      {/* Card body — blurs behind the overlay on hover */}
      <div className="flex items-start gap-2 transition-all duration-200 group-hover:opacity-20 group-hover:blur-[2px] pointer-events-none select-none">
        <span className="font-mono digit text-[10px] tracking-[0.14em] text-bone-4 pt-[3px] w-4 text-right shrink-0">
          {index}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {player.gender === "male" ? (
                <span className="g-male font-bold text-[11px] leading-none shrink-0" aria-label="Male">♂</span>
              ) : (
                <span className="g-female font-bold text-[11px] leading-none shrink-0" aria-label="Female">♀</span>
              )}
              <span className="font-display font-semibold text-[15px] leading-[1.1] text-bone truncate">
                {player.name}
              </span>
              <Chip tone={`level-${player.level}`} className="font-bold text-[8px] px-1 py-[2px] shrink-0">
                {LEVEL_LABEL[player.level]}
              </Chip>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {player.gamesPlayed > 0 && (
                <span className="font-mono text-[9px] tracking-[0.1em] text-bone-4">
                  {player.gamesPlayed}g
                </span>
              )}
              <span className="font-mono digit text-[11px] tracking-[0.1em] text-bone-3">
                {formatShortDuration(elapsed)}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Hover overlay — action buttons float above blurred content */}
      <div
        className="
          absolute inset-0 px-3
          flex items-center justify-center gap-1 flex-wrap
          opacity-0 group-hover:opacity-100
          pointer-events-none group-hover:pointer-events-auto
          transition-opacity duration-150
        "
      >
        <ActionBtn onClick={onEdit}>Edit</ActionBtn>

        {variant === "idle" && (
          <>
            <ActionBtn onClick={() => setStatus(player.id, "break")}>Rest</ActionBtn>
            <ActionBtn onClick={() => setStatus(player.id, "done")}>Finish</ActionBtn>
          </>
        )}
        {variant === "break" && (
          <>
            <ActionBtn onClick={() => setStatus(player.id, "idle")}>Return</ActionBtn>
            <ActionBtn onClick={() => setStatus(player.id, "done")}>Finish</ActionBtn>
          </>
        )}
        {variant === "done" && (
          <>
            {player.paid ? (
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-moss border-[0.5px] border-moss/50 px-1.5 py-0.5">
                  ✓ Paid
                </span>
                <button
                  onClick={() => togglePaid(player.id)}
                  className="font-mono text-[8px] uppercase tracking-[0.18em] text-bone-4 hover:text-alert cursor-pointer transition-colors"
                >
                  Undo
                </button>
              </span>
            ) : (
              <ActionBtn
                onClick={() => togglePaid(player.id)}
                className="text-alert hover:text-moss hover:border-moss/50"
              >
                Mark Paid
              </ActionBtn>
            )}
            <ActionBtn onClick={() => setStatus(player.id, "idle")}>Return</ActionBtn>
          </>
        )}

        <button
          onClick={() => {
            if (confirmDelete) {
              removePlayer(player.id);
            } else {
              setConfirmDelete(true);
              window.setTimeout(() => setConfirmDelete(false), 2500);
            }
          }}
          className={`
            font-mono text-[9px] uppercase tracking-[0.22em] px-1.5 py-0.5 cursor-pointer transition-colors border-[0.5px]
            ${confirmDelete ? "text-alert font-bold border-alert/50" : "text-bone-4 hover:text-alert border-transparent hover:border-alert/50"}
          `}
        >
          {confirmDelete ? "Confirm?" : "Remove"}
        </button>
      </div>
    </li>
  );
}

function ActionBtn({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[9px] uppercase tracking-[0.22em] text-bone-3 hover:text-neon px-1.5 py-0.5 cursor-pointer transition-colors border-[0.5px] border-transparent hover:border-neon/50 ${className}`}
    >
      {children}
    </button>
  );
}
