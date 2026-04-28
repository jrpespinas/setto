"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { Mars, Venus, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { LEVEL_LABEL, type Player, type PlayerStatus } from "@/lib/types";
import { Chip } from "@/components/ui/chip";
import { formatShortDuration } from "@/lib/format";
import type { CSSProperties } from "react";

/** Returns a card background tint based on player status and wait urgency. */
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

export function PlayerCard({
  player,
  index,
  tick,
  avgWaitMs,
  onEdit,
}: {
  player: Player;
  index: number;
  tick: number;
  avgWaitMs: number;
  onEdit: () => void;
}) {
  const { setStatus, togglePaid, removePlayer } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"done" | "remove" | null>(null);
  const cogRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const isIdle    = player.status === "idle";
  const isResting = player.status === "break";
  const isPlaying = player.status === "playing" || player.status === "waiting";
  const isDone    = player.status === "done";
  const canDrag   = isIdle;

  const elapsed  = tick - player.statusSince;
  const bgStyle  = cardTint(elapsed, avgWaitMs, player.status);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        cogRef.current  && !cogRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const openMenu = () => {
    if (cogRef.current) {
      const rect = cogRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setMenuOpen((v) => !v);
  };

  const handleDragStart = (e: DragEvent<HTMLLIElement>) => {
    if (!canDrag) { e.preventDefault(); return; }
    e.dataTransfer.setData("text/player-id", player.id);
    e.dataTransfer.effectAllowed = "move";
    document.body.classList.add("dragging");
  };
  const handleDragEnd = () => document.body.classList.remove("dragging");

  const railColor =
    isPlaying ? "bg-neon"  :
    isResting ? "bg-cold"  :
    isDone    ? "bg-alert" :
    "";

  return (
    <li
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`relative pl-3 pr-2 py-2.5 rule-bottom ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={bgStyle}
    >
      {railColor && (
        <span className={`absolute left-0 top-0 bottom-[0.5px] w-[2px] ${railColor}`} aria-hidden />
      )}

      <div className={`flex items-center gap-2 select-none transition-opacity ${isResting ? "opacity-50" : ""}`}>
        {/* Rank */}
        <span className="font-mono digit text-[10px] tracking-[0.14em] text-bone-4 w-4 text-right shrink-0">
          {index}
        </span>

        {/* Gender */}
        {player.gender === "male"
          ? <Mars size={12} className="g-male shrink-0" strokeWidth={2} aria-hidden />
          : <Venus size={12} className="g-female shrink-0" strokeWidth={2} aria-hidden />
        }

        {/* Name + chips */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="font-display font-semibold text-[15px] leading-[1.1] text-bone truncate">
            {player.name}
          </span>
          <Chip tone={`level-${player.level}`} className="font-bold text-[8px] px-1 py-[2px] shrink-0">
            {LEVEL_LABEL[player.level]}
          </Chip>
{isDone && !player.paid && (
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-alert shrink-0">
              Unpaid
            </span>
          )}
        </div>

        {/* Games + timer */}
        <div className="flex items-center gap-1.5 shrink-0">
          {player.gamesPlayed > 0 && (
            <span className="font-mono text-[9px] tracking-[0.1em] text-bone-4">
              {player.gamesPlayed}g
            </span>
          )}
          {!isPlaying && !isDone && (
            <span className="font-mono digit text-[11px] tracking-[0.1em] text-bone-3">
              {formatShortDuration(elapsed)}
            </span>
          )}
        </div>

        {/* Cog */}
        <button
          ref={cogRef}
          onClick={openMenu}
          className="shrink-0 text-bone-4 hover:text-bone cursor-pointer transition-colors px-1 py-0.5 flex items-center"
          aria-label="Player options"
        >
          <Settings2 size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* Fixed popup menu — escapes overflow-y-auto clipping */}
      {menuOpen && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 200 }}
          className="bg-ink-150 border-[0.5px] border-hairline-2 shadow-2xl min-w-[168px] py-1"
        >
          <MenuItem onClick={() => { setMenuOpen(false); onEdit(); }}>
            Edit player
          </MenuItem>

          <MenuDivider />

          {!isIdle && (
            <MenuItem onClick={() => {
              const prev = useStore.getState().session;
              setStatus(player.id, "idle");
              setMenuOpen(false);
              toast(`${player.name} set to idle`, {
                action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
              });
            }}>
              → Set Idle
            </MenuItem>
          )}
          {!isResting && !isDone && (
            <MenuItem onClick={() => {
              const prev = useStore.getState().session;
              setStatus(player.id, "break");
              setMenuOpen(false);
              toast(`${player.name} set to resting`, {
                action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
              });
            }}>
              → Set Resting
            </MenuItem>
          )}
          {!isDone && (
            <MenuItem onClick={() => { setConfirmMode("done"); setMenuOpen(false); }}>→ Set Done</MenuItem>
          )}

          <MenuDivider />

          <MenuItem onClick={() => {
            const prev = useStore.getState().session;
            togglePaid(player.id);
            setMenuOpen(false);
            toast(`${player.name} ${player.paid ? "marked unpaid" : "marked paid"}`, {
              action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
            });
          }}>
            {player.paid ? "Mark Unpaid" : "Mark Paid"}
          </MenuItem>

          <MenuDivider />

          <MenuItem
            onClick={() => { setConfirmMode("remove"); setMenuOpen(false); }}
            className="text-alert hover:text-alert"
          >
            Remove
          </MenuItem>
        </div>
      )}

      <ConfirmDialog
        open={confirmMode === "done"}
        onClose={() => setConfirmMode(null)}
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

      <ConfirmDialog
        open={confirmMode === "remove"}
        onClose={() => setConfirmMode(null)}
        onConfirm={() => {
          const prev = useStore.getState().session;
          removePlayer(player.id);
          toast(`${player.name} removed`, {
            action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
          });
        }}
        title="Remove player?"
        description={`${player.name} will be permanently removed from this session.`}
        confirmLabel="Remove"
        danger
      />
    </li>
  );
}

function MenuItem({
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
      className={`w-full text-left px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-bone hover:bg-ink-200 cursor-pointer transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function MenuDivider() {
  return <div className="border-t-[0.5px] border-hairline-2 my-1" />;
}

