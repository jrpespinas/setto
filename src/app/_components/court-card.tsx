"use client";

import { useState, type DragEvent } from "react";
import { useStore } from "@/lib/store";
import {
  GENDER_LABEL,
  LEVEL_LABEL,
  LEVEL_FULL_LABEL,
  type Level,
  courtStatus,
  type Court,
  type Player,
} from "@/lib/types";
import { Button, Chip, ThickRule } from "./ui";
import {
  ConfirmDeleteCourt,
  EditCourtDialog,
  FinishMatchDialog,
} from "./dialogs";

export function CourtCard({
  court,
  playersById,
}: {
  court: Court;
  playersById: Record<string, Player>;
}) {
  const { assignPlayer, releaseSlot, removeCourt, finishMatch } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [edit, setEdit] = useState(false);
  const [finish, setFinish] = useState(false);

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

  const canFinish = ongoing;

  return (
    <>
      <article className="bg-paper-soft border-2 border-ink relative shadow-[6px_6px_0_var(--ink)] rise">
        {/* header */}
        <header className="flex items-start justify-between px-4 pt-3 pb-2">
          <div className="flex items-baseline gap-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">
              Court
            </div>
            <div className="font-display digit text-[52px] leading-none tracking-tight">
              {String(court.number).padStart(2, "0")}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {ongoing ? (
              <Chip tone="accent">
                <span className="inline-block w-1.5 h-1.5 bg-ink rounded-full animate-pulse" />
                Ongoing
              </Chip>
            ) : (
              <Chip tone="muted">Vacant</Chip>
            )}
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
              {court.size === 2 ? "Singles" : "Doubles"}
            </span>
          </div>
        </header>

        <ThickRule />

        {/* teams */}
        <div className="grid grid-cols-[1fr_auto_1fr] court-surface">
          <TeamCol
            slots={teamA}
            offset={0}
            courtId={court.id}
            playersById={playersById}
            onAssign={assignPlayer}
            onRelease={releaseSlot}
            label="A"
          />
          <div className="flex items-center justify-center px-4 border-x border-white/40 bg-white/12">
            <span className="font-display bold text-white/90 text-sm rotate-0">
              vs
            </span>
          </div>
          <TeamCol
            slots={teamB}
            offset={half}
            courtId={court.id}
            playersById={playersById}
            onAssign={assignPlayer}
            onRelease={releaseSlot}
            label="B"
          />
        </div>

        <ThickRule />

        {/* footer actions */}
        <footer className="flex items-center justify-between px-3 py-2 bg-paper">
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEdit(true)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="hover:text-clay"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          </div>
          <Button
            size="sm"
            variant={ongoing ? "accent" : "outline"}
            disabled={!canFinish}
            onClick={() => setFinish(true)}
          >
            Finish match
          </Button>
        </footer>
      </article>

      <ConfirmDeleteCourt
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => removeCourt(court.id)}
        courtNumber={court.number}
        isOngoing={ongoing}
      />
      <EditCourtDialog
        open={edit}
        onClose={() => setEdit(false)}
        courtId={court.id}
        currentSize={court.size}
        currentNumber={court.number}
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
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/88 px-3 pt-2 pb-1">
        Side {label}
      </div>
      <div className="flex flex-col gap-1 px-3 pb-3">
        {slots.map((playerId, i) => (
          <Slot
            key={i}
            player={playerId ? playersById[playerId] : undefined}
            onDrop={(droppedId) => onAssign(courtId, offset + i, droppedId)}
            onRelease={() => onRelease(courtId, offset + i)}
          />
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

  return (
    <div
      data-drop={over ? "over" : undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className={`min-h-[52px] border flex items-start justify-between px-2.5 py-1.5 transition-colors ${
        player
          ? "bg-white/88 border-solid border-ink/55 text-ink"
          : "bg-transparent border-dashed border-white/55 text-white/88"
      }`}
    >
      {player ? (
        <>
          <div className="min-w-0 flex-1 pr-2">
            <div className="font-display font-medium text-[17px] leading-tight text-ink truncate">
              {player.name}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Chip tone={levelTone(player.level)} className="text-[9px] px-1.5 py-0.5">
                {LEVEL_LABEL[player.level]}
              </Chip>
              <Chip
                tone={player.gender === "male" ? "male" : "female"}
                className="text-[9px] px-1.5 py-0.5"
              >
                {player.gender === "male" ? "M" : "F"}
              </Chip>
            </div>
          </div>
          <button
            onClick={onRelease}
            aria-label={`Remove ${player.name}`}
            className="shrink-0 pt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-2 hover:text-clay cursor-pointer px-1"
          >
            ×
          </button>
        </>
      ) : (
        <span className="font-mono font-medium text-[10px] uppercase tracking-[0.2em] text-white">
          Drop player
        </span>
      )}
    </div>
  );
}

function levelTone(level: Level) {
  return `level-${level}` as const;
}
