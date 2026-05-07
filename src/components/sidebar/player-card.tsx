"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { Mars, Venus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { LEVEL_LABEL, type Player, type PlayerStatus } from "@/lib/types";
import { Chip } from "@/components/ui/chip";
import { formatShortDuration } from "@/lib/format";
import type { CSSProperties } from "react";

function cardTint(waitMs: number, avgWaitMs: number, status: PlayerStatus): CSSProperties {
  if (status === "playing" || status === "waiting") {
    return { backgroundColor: "rgba(0,223,192,0.08)" };
  }
  if (status !== "idle" || avgWaitMs <= 0 || waitMs <= 0) return {};
  const ratio = waitMs / avgWaitMs;
  if (ratio <= 0.75) return {};
  if (ratio <= 1.5) {
    const t = (ratio - 0.75) / 0.75;
    return { backgroundColor: `rgba(240,160,48,${(t * 0.10).toFixed(3)})` };
  }
  const t = Math.min((ratio - 1.5) / 1.5, 1);
  return { backgroundColor: `rgba(255,90,77,${(0.10 + t * 0.08).toFixed(3)})` };
}

const STATUS_ABBR: Partial<Record<PlayerStatus, string>> = {
  idle:    "Idle",
  break:   "Rest",
};

export function PlayerCard({
  player,
  index,
  tick,
  avgWaitMs,
}: {
  player: Player;
  index: number;
  tick: number;
  avgWaitMs: number;
}) {
  const { setStatus } = useStore();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [confirmDone,    setConfirmDone]    = useState(false);
  const chipBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef    = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const isIdle    = player.status === "idle";
  const isResting = player.status === "break";
  const isPlaying = player.status === "playing" || player.status === "waiting";
  const isDone    = player.status === "done";
  const canDrag   = isIdle;
  const canChangeStatus = isIdle || isResting;

  const elapsed = tick - player.statusSince;
  const bgStyle = cardTint(elapsed, avgWaitMs, player.status);

  // Close status menu on outside click
  useEffect(() => {
    if (!statusMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideChip = chipBtnRef.current?.contains(t);
      const insideMenu = menuRef.current?.contains(t);
      if (!insideChip && !insideMenu) setStatusMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [statusMenuOpen]);

  const openStatusMenu = () => {
    if (chipBtnRef.current) {
      const rect = chipBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setStatusMenuOpen((v) => !v);
  };

  const handleDragStart = (e: DragEvent<HTMLLIElement>) => {
    if (!canDrag) { e.preventDefault(); return; }
    e.dataTransfer.setData("text/player-id", player.id);
    e.dataTransfer.effectAllowed = "move";
    document.body.classList.add("dragging");
  };
  const handleDragEnd = () => document.body.classList.remove("dragging");

  return (
    <li
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`relative px-3 py-2 rule-bottom ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={bgStyle}
    >

      <div className={`flex items-center gap-1.5 select-none ${isResting || isDone ? "opacity-60" : ""}`}>
        {/* Rank */}
        <span className="font-mono digit text-[10px] tracking-[0.14em] text-bone-4 w-4 text-right shrink-0">
          {index}
        </span>

        {/* Gender */}
        {player.gender === "male"
          ? <Mars size={11} className="g-male shrink-0" strokeWidth={2} aria-hidden />
          : <Venus size={11} className="g-female shrink-0" strokeWidth={2} aria-hidden />
        }

        {/* Name + level chip */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="font-display font-semibold text-[14px] leading-[1.1] text-bone truncate">
            {player.name}
          </span>
          <Chip tone={`level-${player.level}`} className="font-bold text-[8px] px-1 py-[2px] shrink-0">
            {LEVEL_LABEL[player.level]}
          </Chip>
        </div>

        {/* Right cluster: games + timer + status chip or paid */}
        <div className="flex items-center gap-1.5 shrink-0">
          {player.gamesPlayed > 0 && (
            <span className="font-mono text-[9px] tracking-[0.1em] text-bone-4">
              {player.gamesPlayed}g
            </span>
          )}
          {!isPlaying && !isDone && (
            <span className="font-mono digit text-[10px] tracking-[0.1em] text-bone-3">
              {formatShortDuration(elapsed)}
            </span>
          )}

          {/* Status chip — only for idle/resting; clearly interactive */}
          {canChangeStatus && (
            <button
              ref={chipBtnRef}
              onClick={openStatusMenu}
              aria-label="Change status"
              className="flex items-center gap-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-bone-3 border-[0.5px] border-hairline-2 px-1.5 py-[2px] cursor-pointer hover:border-bone-3 hover:text-bone transition-colors shrink-0"
            >
              {STATUS_ABBR[player.status]}
              <ChevronDown size={7} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Status popup */}
      {statusMenuOpen && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 200 }}
          className="bg-ink-150 border-[0.5px] border-hairline-2 shadow-2xl min-w-[140px] py-1"
        >
          {!isIdle && (
            <StatusItem onClick={() => {
              const prev = useStore.getState().session;
              setStatus(player.id, "idle");
              setStatusMenuOpen(false);
              toast(`${player.name} set to idle`, {
                action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
              });
            }}>
              Set Idle
            </StatusItem>
          )}
          {!isResting && (
            <StatusItem onClick={() => {
              const prev = useStore.getState().session;
              setStatus(player.id, "break");
              setStatusMenuOpen(false);
              toast(`${player.name} set to resting`, {
                action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
              });
            }}>
              Set Resting
            </StatusItem>
          )}
          <StatusItem onClick={() => { setConfirmDone(true); setStatusMenuOpen(false); }}>
            Set Done
          </StatusItem>
        </div>
      )}

      <ConfirmDialog
        open={confirmDone}
        onClose={() => setConfirmDone(false)}
        onConfirm={() => {
          const prev = useStore.getState().session;
          setStatus(player.id, "done");
          toast(`${player.name} marked done`, {
            action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
          });
        }}
        title="Mark as done?"
        description={`${player.name} will be moved to the Done section and removed from rotation.`}
        confirmLabel="Mark done"
      />
    </li>
  );
}

function StatusItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-bone hover:bg-ink-200 cursor-pointer transition-colors"
    >
      {children}
    </button>
  );
}
