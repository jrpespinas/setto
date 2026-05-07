"use client";

import { useMemo, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { useStore, selectors } from "@/lib/store";
import { type Player, type QueueCard } from "@/lib/types";
import { LiveDot } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";

/** 4-slot queue rail — prototype matches feeding the courts. */
export function QueueRail() {
  const session    = useStore((s) => s.session);
  const playersById = useMemo(() => selectors.byId(session), [session]);
  const queue       = session.queue;
  const readyCount  = queue.filter((q) => q.slots.every(Boolean)).length;

  return (
    <aside className="flex flex-col bg-white border-[0.5px] border-hairline-2">
      <header className="px-4 pt-4 pb-3 rule-bottom bg-ink-050">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="statement text-[22px] leading-none">Match Queue</h2>
          <span className="font-mono digit text-[11px] text-bone-3 tabular-nums shrink-0">
            {readyCount} / 4
          </span>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4 mt-1.5">
          {readyCount === 4
            ? "All slots ready"
            : readyCount === 0
            ? "Drag players to fill slots"
            : `${4 - readyCount} slot${4 - readyCount > 1 ? "s" : ""} pending`}
        </p>
      </header>

      <ul className="flex flex-col gap-2 p-3">
        {queue.map((q, i) => (
          <QueueCardRow
            key={q.id}
            card={q}
            index={i + 1}
            playersById={playersById}
          />
        ))}
      </ul>
    </aside>
  );
}

function QueueCardRow({
  card,
  index,
  playersById,
}: {
  card: QueueCard;
  index: number;
  playersById: Record<string, Player>;
}) {
  const assignToQueueSlot = useStore((s) => s.assignToQueueSlot);
  const releaseQueueSlot  = useStore((s) => s.releaseQueueSlot);
  const dumpQueueToIdle   = useStore((s) => s.dumpQueueToIdle);
  const [clearOpen, setClearOpen] = useState(false);

  const filled     = card.slots.filter(Boolean).length;
  const half       = card.slots.length / 2;
  const teamA      = card.slots.slice(0, half);
  const teamB      = card.slots.slice(half);
  const isReady    = filled === card.slots.length;
  const isPartial  = filled > 0 && !isReady;
  const isDraggable = filled > 0;

  const handleDragStart = (e: DragEvent<HTMLLIElement>) => {
    if ((e.target as HTMLElement).closest("[data-player-slot]")) {
      e.stopPropagation();
      return;
    }
    if (!isDraggable) { e.preventDefault(); return; }
    e.dataTransfer.setData("text/queue-id", card.id);
    e.dataTransfer.effectAllowed = "move";
    document.body.classList.add("dragging");
  };

  const handleDragEnd = () => document.body.classList.remove("dragging");

  return (
    <>
      <li
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`
          relative bg-white border-[0.5px] transition-colors duration-200
          ${isReady   ? "border-neon shadow-[0_0_0_3px_var(--color-neon-soft)]" : ""}
          ${isPartial ? "border-warm/60" : ""}
          ${!isReady && !isPartial ? "border-hairline-2" : ""}
          ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}
        `}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-2">
          <div className="flex items-center gap-2">
            {isDraggable && (
              <span className="text-bone-4 text-[13px] leading-none select-none" title="Drag to a court" aria-hidden>
                ⠿
              </span>
            )}
            <span className={`font-mono text-[10px] font-bold tracking-[0.16em] ${isReady ? "text-neon" : "text-bone-3"}`}>
              Q{index}
            </span>

            {/* Progress pips */}
            <div className="flex items-center gap-[3px]">
              {card.slots.map((slot, i) => (
                <div
                  key={i}
                  className={`w-[5px] h-[5px] rounded-full transition-colors duration-200 ${
                    slot
                      ? isReady ? "bg-neon" : "bg-warm"
                      : "bg-hairline-3"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isReady && (
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-neon flex items-center gap-1">
                <LiveDot className="bg-neon" /> Ready
              </span>
            )}
            {filled > 0 && !isReady && (
              <span className="font-mono text-[8px] text-bone-4 tabular-nums">
                {filled}/{card.slots.length}
              </span>
            )}
            {filled > 0 && (
              <button
                onClick={() => setClearOpen(true)}
                className="font-mono text-[8px] uppercase tracking-[0.18em] text-bone-4 hover:text-alert cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="grid grid-cols-[1fr_20px_1fr] px-3 pb-3 gap-x-1">
          <TeamSide
            slots={teamA}
            offset={0}
            queueId={card.id}
            playersById={playersById}
            onAssign={assignToQueueSlot}
            onRelease={releaseQueueSlot}
          />
          <div className="flex items-center justify-center">
            <span className="font-display italic text-[10px] text-bone-4">vs</span>
          </div>
          <TeamSide
            slots={teamB}
            offset={half}
            queueId={card.id}
            playersById={playersById}
            onAssign={assignToQueueSlot}
            onRelease={releaseQueueSlot}
          />
        </div>
      </li>

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          const prev = useStore.getState().session;
          dumpQueueToIdle(card.id);
          toast("Queue slot cleared", {
            action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
          });
        }}
        title="Clear queue slot?"
        description="All players in this queue slot will be returned to idle."
        confirmLabel="Clear"
        danger
      />
    </>
  );
}

function TeamSide({
  slots,
  offset,
  queueId,
  playersById,
  onAssign,
  onRelease,
}: {
  slots: (string | null)[];
  offset: number;
  queueId: string;
  playersById: Record<string, Player>;
  onAssign: (queueId: string, slotIndex: number, playerId: string) => void;
  onRelease: (queueId: string, slotIndex: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {slots.map((playerId, i) => (
        <QueueSlot
          key={i}
          player={playerId ? playersById[playerId] : undefined}
          onDrop={(id) => onAssign(queueId, offset + i, id)}
          onRelease={() => onRelease(queueId, offset + i)}
        />
      ))}
    </div>
  );
}

function QueueSlot({
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
        data-player-slot
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData("text/player-id", player.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        className={`lvl-${player.level} h-[30px] border-[0.5px] flex items-center gap-1.5 px-2 cursor-grab active:cursor-grabbing active:opacity-70 transition-opacity`}
      >
        <span className="shrink-0 text-[10px] font-bold leading-none opacity-70" aria-hidden>
          {player.gender === "male" ? "♂" : "♀"}
        </span>
        <span className="font-display font-semibold text-[12px] leading-tight flex-1 min-w-0 overflow-hidden whitespace-nowrap">
          {player.name}
        </span>
        <button
          onClick={onRelease}
          aria-label={`Remove ${player.name}`}
          className="shrink-0 font-mono text-[13px] opacity-40 hover:opacity-100 cursor-pointer pl-0.5 transition-opacity"
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
      className={`h-[26px] border-[0.5px] border-dashed flex items-center justify-center px-2 transition-colors ${
        over
          ? "border-neon bg-neon-ghost"
          : "border-hairline-3 hover:border-bone-4"
      }`}
    >
      <span className={`font-mono text-[8px] uppercase tracking-[0.2em] transition-colors ${
        over ? "text-neon" : "text-bone-4"
      }`}>
        {over ? "Drop" : "Drag here"}
      </span>
    </div>
  );
}
