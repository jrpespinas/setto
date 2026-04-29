"use client";

import { useEffect, useState, type DragEvent } from "react";
import { ArrowLeftRight, Mars, Venus, X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  LEVEL_LABEL,
  courtStatus,
  type Court,
  type Player,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Chip, LiveDot } from "@/components/ui/chip";
import { EditCourtDialog } from "@/components/dialogs/edit-court-dialog";
import { ConfirmDeleteCourtDialog } from "@/components/dialogs/confirm-delete-court-dialog";
import { FinishMatchDialog } from "@/components/dialogs/finish-match-dialog";
import { CourtPlayerPicker } from "./court-player-picker";

export function CourtCard({
  court,
  playersById,
  revealIndex,
}: {
  court: Court;
  playersById: Record<string, Player>;
  revealIndex: number;
}) {
  const assignToCourtSlot   = useStore((s) => s.assignToCourtSlot);
  const releaseCourtSlot    = useStore((s) => s.releaseCourtSlot);
  const swapCourtSlots      = useStore((s) => s.swapCourtSlots);
  const removeCourt         = useStore((s) => s.removeCourt);
  const finishMatch         = useStore((s) => s.finishMatch);
  const promoteQueueToCourt = useStore((s) => s.promoteQueueToCourt);

  const [edit, setEdit]                   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [finishOpen, setFinishOpen]       = useState(false);
  const [pickerOpen, setPickerOpen]       = useState(false);
  const [queueOver, setQueueOver]         = useState(false);
  const [tick, setTick]                   = useState(() => Date.now());

  useEffect(() => {
    if (!court.matchStartedAt) return;
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [court.matchStartedAt]);

  const half    = court.size / 2;
  const teamA   = court.slots.slice(0, half);
  const teamB   = court.slots.slice(half);
  const status  = courtStatus(court, playersById);
  const ongoing = status === "ongoing";

  const teamANames = teamA.filter((id): id is string => !!id && !!playersById[id]).map((id) => playersById[id].name);
  const teamBNames = teamB.filter((id): id is string => !!id && !!playersById[id]).map((id) => playersById[id].name);

  const handleFinish = (winner: "A" | "B" | "none") => {
    const prev = useStore.getState().session;
    finishMatch(court.id, winner);
    toast(`Court ${String(court.number).padStart(2, "0")} match finished`, {
      action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
    });
  };

  return (
    <>
      <article
        className={`reveal relative bg-ink-100 flex flex-col transition-[outline,box-shadow] duration-150 ${
          queueOver
            ? "outline outline-1 outline-neon shadow-[0_0_16px_-4px_var(--neon-soft)]"
            : "border-[0.5px] border-hairline-2"
        }`}
        style={{ animationDelay: `${revealIndex * 60}ms` }}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("text/queue-id")) return;
          e.preventDefault();
          setQueueOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setQueueOver(false);
        }}
        onDrop={(e) => {
          const queueId = e.dataTransfer.getData("text/queue-id");
          if (!queueId) return;
          e.preventDefault();
          setQueueOver(false);
          promoteQueueToCourt(queueId, court.id);
        }}
      >
        {/* header ---------------------------------------------------- */}
        <header className="flex items-start justify-between px-4 pt-3 pb-3 rule-bottom">
          <div className="flex items-baseline gap-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-bone-4">
              Court
            </div>
            <div className="big-number digit text-[48px]">
              {String(court.number).padStart(2, "0")}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {ongoing ? (
              <Chip tone="neon">
                <LiveDot className="bg-ink-000" /> Ongoing
              </Chip>
            ) : (
              <Chip tone="muted">Vacant</Chip>
            )}
            {ongoing && court.matchStartedAt ? (
              <MatchTimer startedAt={court.matchStartedAt} tick={tick} />
            ) : (
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4">
                {court.size === 2 ? "Singles" : "Doubles"}
              </span>
            )}
          </div>
        </header>

        {/* teams ----------------------------------------------------- */}
        <div className="grid grid-cols-[1fr_auto_1fr] court-surface">
          <TeamCol
            slots={teamA}
            offset={0}
            half={half}
            courtId={court.id}
            playersById={playersById}
            onAssign={assignToCourtSlot}
            onRelease={releaseCourtSlot}
            onSwap={(absIdx) =>
              swapCourtSlots(court.id, absIdx, absIdx < half ? absIdx + half : absIdx - half)
            }
            label="A"
          />
          <div className="flex items-center justify-center px-3 border-x-2 border-white/70">
            <span className="font-display italic text-white/80 text-xs tracking-wide">vs</span>
          </div>
          <TeamCol
            slots={teamB}
            offset={half}
            half={half}
            courtId={court.id}
            playersById={playersById}
            onAssign={assignToCourtSlot}
            onRelease={releaseCourtSlot}
            onSwap={(absIdx) =>
              swapCourtSlots(court.id, absIdx, absIdx < half ? absIdx + half : absIdx - half)
            }
            label="B"
          />
        </div>

        {/* footer ---------------------------------------------------- */}
        <footer className="flex items-center justify-between px-3 py-2 rule-top">
          <div className="flex gap-0.5">
            <Button
              size="xs"
              variant="ghost"
              disabled={ongoing}
              title={ongoing ? "Finish the match to edit" : undefined}
              onClick={() => setEdit(true)}
            >
              Edit
            </Button>
            <Button
              size="xs"
              variant="ghost"
              className="hover:text-alert"
              disabled={ongoing}
              title={ongoing ? "Finish the match to delete" : undefined}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          </div>
          {ongoing ? (
            <Button size="sm" variant="neon" onClick={() => setFinishOpen(true)}>
              Finish match
            </Button>
          ) : (
            <Button size="sm" variant="solid" onClick={() => setPickerOpen(true)}>
              + Set players
            </Button>
          )}
        </footer>
      </article>

      <FinishMatchDialog
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        onFinish={handleFinish}
        teamANames={teamANames}
        teamBNames={teamBNames}
      />
      <CourtPlayerPicker
        open={pickerOpen}
        courtId={court.id}
        courtNumber={court.number}
        courtSize={court.size}
        tick={tick}
        onClose={() => setPickerOpen(false)}
      />
      <EditCourtDialog
        open={edit}
        onClose={() => setEdit(false)}
        courtId={court.id}
        currentSize={court.size}
        currentNumber={court.number}
      />
      <ConfirmDeleteCourtDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          const prev = useStore.getState().session;
          removeCourt(court.id);
          toast(`Court ${String(court.number).padStart(2, "0")} deleted`, {
            action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
          });
        }}
        courtNumber={court.number}
        isOngoing={ongoing}
      />
    </>
  );
}

function TeamCol({
  slots,
  offset,
  half,
  courtId,
  playersById,
  onAssign,
  onRelease,
  onSwap,
  label,
}: {
  slots: (string | null)[];
  offset: number;
  half: number;
  courtId: string;
  playersById: Record<string, Player>;
  onAssign: (courtId: string, slotIndex: number, playerId: string) => void;
  onRelease: (courtId: string, slotIndex: number) => void;
  onSwap: (absoluteSlotIndex: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col">
      <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/80 px-3 pt-2.5 pb-1.5">
        Side {label}
      </div>
      <div className="flex flex-col px-3 pb-3">
        {slots.map((playerId, i) => (
          <div key={i} className="h-[40px]">
            <Slot
              player={playerId ? playersById[playerId] : undefined}
              onDrop={(id) => onAssign(courtId, offset + i, id)}
              onRelease={() => onRelease(courtId, offset + i)}
              onSwap={() => onSwap(offset + i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Slot({
  player,
  onDrop,
  onRelease,
  onSwap,
}: {
  player?: Player;
  onDrop: (playerId: string) => void;
  onRelease: () => void;
  onSwap: () => void;
}) {
  const [over, setOver] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const id = e.dataTransfer.getData("text/player-id");
    if (id) onDrop(id);
  };

  if (player) {
    return (
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/player-id", player.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        className="h-full border-[0.5px] border-black/10 bg-[#f0f2f5] flex items-center justify-between px-2.5 cursor-grab active:cursor-grabbing active:opacity-70 transition-opacity"
      >
        <div className="min-w-0 flex-1 flex items-center gap-1.5">
          {player.gender === "male"
            ? <Mars size={12} className="g-male shrink-0" strokeWidth={2} aria-hidden />
            : <Venus size={12} className="g-female shrink-0" strokeWidth={2} aria-hidden />
          }
          <span className="font-display font-semibold text-[13px] leading-tight text-[#0e1018] truncate">
            {player.name}
          </span>
          <Chip tone={`level-${player.level}`} className="text-[8px] px-1 py-[2px] shrink-0">
            {LEVEL_LABEL[player.level]}
          </Chip>
        </div>
        <div className="flex items-center shrink-0">
          <button
            onClick={onSwap}
            aria-label="Switch sides"
            title="Switch sides"
            className="text-[#0e1018]/35 hover:text-[#0e1018] cursor-pointer px-1 flex items-center"
          >
            <ArrowLeftRight size={13} strokeWidth={2.5} />
          </button>
          <button
            onClick={onRelease}
            aria-label={`Remove ${player.name}`}
            className="text-[#0e1018]/40 hover:text-[#0e1018] cursor-pointer px-1 flex items-center"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-drop={over ? "over" : undefined}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("text/player-id")) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className="h-full border-[0.75px] border-dashed border-white/40 hover:border-white/80 flex items-center px-2.5 transition-colors"
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/50">
        Drop player
      </span>
    </div>
  );
}

function MatchTimer({ startedAt, tick }: { startedAt: number; tick: number }) {
  const elapsedMs = tick - startedAt;
  const AMBER_MS  = 12 * 60 * 1000;
  const RED_MS    = 15 * 60 * 1000;

  const totalSec = Math.floor(elapsedMs / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");

  const color =
    elapsedMs >= RED_MS   ? "text-alert" :
    elapsedMs >= AMBER_MS ? "text-warm"  :
    "text-bone-3";

  return (
    <span className={`font-mono digit text-[13px] tracking-[0.08em] tabular-nums transition-colors ${color}`}>
      {mm}:{ss}
    </span>
  );
}
