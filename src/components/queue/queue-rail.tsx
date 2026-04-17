"use client";

import { useMemo, useState, type DragEvent } from "react";
import { useStore, selectors } from "@/lib/store";
import { LEVEL_LABEL, type Player, type QueueCard } from "@/lib/types";
import { Chip, LiveDot } from "@/components/ui/chip";

/** 3-slot queue rail — "prototype matches" feeding the courts.
 * Ghost-bordered, ready-pulses when filled to a valid size. */
export function QueueRail() {
  const session = useStore((s) => s.session);
  const playersById = useMemo(() => selectors.byId(session), [session]);
  const queue = session.queue;

  return (
    <aside className="relative flex flex-col bg-ink-050 rule-left">
      <header className="shrink-0 px-4 pt-4 pb-3 rule-bottom">
        <h2 className="statement text-[26px] leading-none">Match Queue</h2>
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4 mt-2">
          {queue.filter((q) => q.slots.some(Boolean)).length} / 3 matches ready
        </p>
      </header>
      <ul className="flex-1 min-h-0 overflow-y-auto">
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
  // FIX: Extracted into individual selectors to avoid returning a new object literal on every render
  const assignToQueueSlot = useStore((s) => s.assignToQueueSlot);
  const releaseQueueSlot = useStore((s) => s.releaseQueueSlot);
  const dumpQueueToIdle = useStore((s) => s.dumpQueueToIdle);

  const filled = card.slots.filter(Boolean).length;
  const half = card.slots.length / 2;
  const teamA = card.slots.slice(0, half);
  const teamB = card.slots.slice(half);
  const isReady = filled === card.slots.length;
  const isDraggable = filled > 0;

  const handleDragStart = (e: DragEvent<HTMLLIElement>) => {
    // Don't hijack drags that originate from a child player slot
    if ((e.target as HTMLElement).closest("[data-player-slot]")) {
      e.stopPropagation();
      return;
    }
    if (!isDraggable) { e.preventDefault(); return; }
    e.dataTransfer.setData("text/queue-id", card.id);
    e.dataTransfer.effectAllowed = "move";
    document.body.classList.add("dragging");
  };

  const handleDragEnd = () => {
    document.body.classList.remove("dragging");
  };

  return (
    <li
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        relative rule-bottom px-4 py-3.5
        ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}
        ${isReady ? "bg-neon-ghost" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          {isDraggable && (
            <span className="text-bone-4 text-[13px] leading-none select-none" title="Drag to a court" aria-hidden>
              ⠿
            </span>
          )}
          <span className="font-mono digit text-[9px] text-bone-4 tracking-[0.14em]">
            Q·{String(index).padStart(2, "0")}
          </span>
          <Chip tone={isReady ? "neon" : "muted"}>
            {isReady ? <LiveDot className="bg-ink-000" /> : null}
            {isReady ? "Ready" : `${filled}/${card.slots.length}`}
          </Chip>
        </div>
        {filled > 0 ? (
          <button
            onClick={() => dumpQueueToIdle(card.id)}
            className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4 hover:text-alert cursor-pointer"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
        <TeamSide
          slots={teamA}
          offset={0}
          queueId={card.id}
          playersById={playersById}
          onAssign={assignToQueueSlot}
          onRelease={releaseQueueSlot}
        />
        <div className="flex items-center font-display italic text-bone-4 text-[11px]">
          vs
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
    // Apply level class directly to the cell — bg + text color are baked in.
    // Removing the chip frees enough width that most names fit without clipping.
    return (
      <div
        data-player-slot
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData("text/player-id", player.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        className={`lvl-${player.level} h-[32px] border-[0.5px] flex items-center gap-1.5 px-2 cursor-grab active:cursor-grabbing active:opacity-70`}
      >
        {/* Gender icon — inherits level text color, always contrasted */}
        <span className="shrink-0 text-[11px] font-bold leading-none opacity-80" aria-hidden>
          {player.gender === "male" ? "♂" : "♀"}
        </span>

        {/* Name — clips without ellipsis so it doesn't look truncated */}
        <span className="font-display font-semibold text-[12px] leading-tight flex-1 min-w-0 overflow-hidden whitespace-nowrap">
          {player.name}
        </span>

        {/* Remove — explicit opacity so it works on any level bg */}
        <button
          onClick={onRelease}
          aria-label={`Remove ${player.name}`}
          className="shrink-0 font-mono text-[12px] opacity-50 hover:opacity-100 cursor-pointer pl-0.5"
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
      className="h-[30px] border-[0.5px] border-dashed border-hairline-3 flex items-center px-2 hover:border-hairline-strong transition-colors"
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4">
        Empty slot
      </span>
    </div>
  );
}