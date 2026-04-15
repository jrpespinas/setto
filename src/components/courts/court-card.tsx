"use client";

import { useMemo, useRef, useState, type DragEvent } from "react";
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

export function CourtCard({
  court,
  playersById,
  revealIndex,
}: {
  court: Court;
  playersById: Record<string, Player>;
  revealIndex: number;
}) {
  const assignToCourtSlot = useStore((s) => s.assignToCourtSlot);
  const releaseCourtSlot = useStore((s) => s.releaseCourtSlot);
  const removeCourt = useStore((s) => s.removeCourt);
  const finishMatch = useStore((s) => s.finishMatch);
  const promoteQueueToCourt = useStore((s) => s.promoteQueueToCourt);

  const [edit, setEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [finish, setFinish] = useState(false);
  const [queueOver, setQueueOver] = useState(false);

  const half = court.size / 2;
  const teamA = court.slots.slice(0, half);
  const teamB = court.slots.slice(half);
  const status = courtStatus(court, playersById);
  const ongoing = status === "ongoing";

  const teamANames = teamA
    .map((id) => (id ? playersById[id]?.name : null))
    .filter(Boolean) as string[];
  const teamBNames = teamB
    .map((id) => (id ? playersById[id]?.name : null))
    .filter(Boolean) as string[];

  const canFinish = teamANames.length === teamBNames.length && teamANames.length > 0;

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
          // only clear when leaving the article itself, not a child
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
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4">
              {court.size === 2 ? "Singles" : "Doubles"}
            </span>
          </div>
        </header>

        {/* teams ----------------------------------------------------- */}
        <div className="grid grid-cols-[1fr_auto_1fr] court-surface">
          <TeamCol
            slots={teamA}
            offset={0}
            courtId={court.id}
            playersById={playersById}
            onAssign={assignToCourtSlot}
            onRelease={releaseCourtSlot}
            label="A"
          />
          <div className="flex items-center justify-center px-3 border-x-2 border-white/70">
            <span className="font-display italic text-white/80 text-xs tracking-wide">
              vs
            </span>
          </div>
          <TeamCol
            slots={teamB}
            offset={half}
            courtId={court.id}
            playersById={playersById}
            onAssign={assignToCourtSlot}
            onRelease={releaseCourtSlot}
            label="B"
          />
        </div>

        {/* footer ---------------------------------------------------- */}
        <footer className="flex items-center justify-between px-3 py-2 rule-top">
          <div className="flex gap-0.5">
            <Button size="xs" variant="ghost" onClick={() => setEdit(true)}>
              Edit
            </Button>
            <Button
              size="xs"
              variant="ghost"
              className="hover:text-alert"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          </div>
          <Button
            size="sm"
            variant={canFinish ? "neon" : "outline"}
            disabled={!canFinish}
            onClick={() => setFinish(true)}
          >
            Finish match
          </Button>
        </footer>
      </article>

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
        onConfirm={() => removeCourt(court.id)}
        courtNumber={court.number}
        isOngoing={ongoing}
      />
      <FinishMatchDialog
        open={finish}
        onClose={() => setFinish(false)}
        onFinish={(winner) => finishMatch(court.id, winner)}
        teamANames={teamANames}
        teamBNames={teamBNames}
      />
    </>
  );
}

function TeamCol({
  slots,
  offset,
  courtId,
  playersById,
  onAssign,
  onRelease,
  label,
}: {
  slots: (string | null)[];
  offset: number;
  courtId: string;
  playersById: Record<string, Player>;
  onAssign: (courtId: string, slotIndex: number, playerId: string) => void;
  onRelease: (courtId: string, slotIndex: number) => void;
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
}: {
  player?: Player;
  onDrop: (playerId: string) => void;
  onRelease: () => void;
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
        className="h-full border-[0.5px] border-white/30 bg-white/[0.06] flex items-center justify-between px-2.5 cursor-grab active:cursor-grabbing active:opacity-60 transition-opacity"
      >
        <div className="min-w-0 flex-1 flex items-center gap-1.5">
          <span className="font-display font-semibold text-[13px] leading-tight text-white truncate">
            {player.name}
          </span>
          <Chip
            tone={`level-${player.level}`}
            className="text-[8px] px-1 py-[2px] shrink-0"
          >
            {LEVEL_LABEL[player.level]}
          </Chip>
        </div>
        <button
          onClick={onRelease}
          aria-label={`Remove ${player.name}`}
          className="shrink-0 font-mono text-[11px] text-white/60 hover:text-white cursor-pointer px-1.5"
        >
          ×
        </button>
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