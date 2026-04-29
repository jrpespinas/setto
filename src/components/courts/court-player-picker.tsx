"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { Mars, Venus, X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { LEVEL_LABEL, LEVELS, type Level, type Player } from "@/lib/types";
import { formatShortDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Chip, LiveDot } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";

export function CourtPlayerPicker({
  open,
  courtId,
  courtNumber,
  courtSize,
  tick,
  onClose,
}: {
  open: boolean;
  courtId: string;
  courtNumber: number;
  courtSize: number;
  tick: number;
  onClose: () => void;
}) {
  const session       = useStore((s) => s.session);
  const bulkAssign    = useStore((s) => s.bulkAssignToCourt);
  const half          = courtSize / 2;

  // ── slot state ────────────────────────────────────────────────────────────
  const [slots, setSlots]         = useState<(string | null)[]>(() => Array(courtSize).fill(null));
  const [queries, setQueries]     = useState<string[]>(() => Array(courtSize).fill(""));
  const [focusedSlot, setFocused] = useState<number | null>(null);
  const [highlighted, setHL]      = useState(0);
  const [queueDragOver, setQueueDragOver] = useState(false);
  const inputRefs                 = useRef<(HTMLInputElement | null)[]>([]);
  const blurTimer                 = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── filter state (reset on every open) ───────────────────────────────────
  const [levelFilter,  setLevelFilter]  = useState<Level | "all">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "idle" | "queue">("all");

  const playersById = useMemo(
    () => Object.fromEntries(session.players.map((p) => [p.id, p])),
    [session.players],
  );

  // Sorted roster: waiting (queue) > idle, fewest games > longest wait
  const roster = useMemo(
    () =>
      session.players
        .filter((p) => p.status === "idle" || p.status === "waiting")
        .sort((a, b) => {
          if (a.status === "waiting" && b.status !== "waiting") return -1;
          if (b.status === "waiting" && a.status !== "waiting") return 1;
          return a.statusSince - b.statusSince || (a.gamesPlayed ?? 0) - (b.gamesPlayed ?? 0);
        }),
    [session.players],
  );

  const selectedIds = useMemo(() => new Set(slots.filter(Boolean) as string[]), [slots]);

  // Roster table — applies filters + search query, excludes selected players
  // Note: handleNext (Next N) intentionally bypasses these filters.
  const tableRoster = useMemo(() => {
    const q = focusedSlot !== null ? queries[focusedSlot].trim().toLowerCase() : "";
    return roster
      .filter((p) => !selectedIds.has(p.id))
      .filter((p) => levelFilter  === "all" || p.level  === levelFilter)
      .filter((p) => genderFilter === "all" || p.gender === genderFilter)
      .filter((p) => {
        if (statusFilter === "idle")  return p.status === "idle";
        if (statusFilter === "queue") return p.status === "waiting";
        return true;
      })
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [roster, selectedIds, levelFilter, genderFilter, statusFilter, focusedSlot, queries]);

  // Reset table highlight when list content changes
  const tableKey = tableRoster.map((p) => p.id).join();
  useEffect(() => { setHL(0); }, [tableKey]);

  // Queue preview data
  const queueCards = useMemo(
    () =>
      session.queue.map((card) => {
        const h      = card.slots.length / 2;
        const filled = card.slots.filter(Boolean).length;
        return {
          id: card.id,
          filled,
          total:   card.slots.length,
          isReady: filled === card.slots.length,
          sideA:   card.slots.slice(0, h).map((id) => (id ? playersById[id] : null)),
          sideB:   card.slots.slice(h).map((id)    => (id ? playersById[id] : null)),
        };
      }),
    [session.queue, playersById],
  );

  // ── reset on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setSlots(Array(courtSize).fill(null));
    setQueries(Array(courtSize).fill(""));
    setFocused(null);
    setHL(0);
    setLevelFilter("all");
    setGenderFilter("all");
    setStatusFilter("all");
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 80);
    return () => clearTimeout(t);
  }, [open, courtSize]);

  // ── slot helpers ──────────────────────────────────────────────────────────
  const focusNextEmpty = (afterIndex: number) => {
    const next = slots.findIndex((s, i) => i > afterIndex && s === null);
    if (next !== -1) setTimeout(() => inputRefs.current[next]?.focus(), 0);
  };

  const selectPlayer = (slotIndex: number, playerId: string) => {
    setSlots((prev) => prev.map((s, i) => {
      if (i === slotIndex) return playerId;
      if (s === playerId) return null; // move out of old slot if already picked
      return s;
    }));
    setQueries((prev) => prev.map((q, i) => (i === slotIndex ? "" : q)));
    setHL(0);
    focusNextEmpty(slotIndex);
  };

  const clearSlot = (slotIndex: number) => {
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? null : s)));
    setTimeout(() => inputRefs.current[slotIndex]?.focus(), 0);
  };

  const swapSlots = (a: number, b: number) => {
    setSlots((prev) => {
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  };

  // ── focus tracking ────────────────────────────────────────────────────────
  const handleSlotFocus = (slotIndex: number) => {
    clearTimeout(blurTimer.current);
    setFocused(slotIndex);
  };

  const handleSlotBlur = () => {
    blurTimer.current = setTimeout(() => setFocused(null), 150);
  };

  // ── keyboard ──────────────────────────────────────────────────────────────
  const handleSlotKeyDown = (e: KeyboardEvent<HTMLInputElement>, slotIndex: number) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHL((h) => Math.min(h + 1, tableRoster.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHL((h) => Math.max(h - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (tableRoster[highlighted]) selectPlayer(slotIndex, tableRoster[highlighted].id);
        break;
      case "Tab":
        if (tableRoster[highlighted] && queries[slotIndex]) {
          e.preventDefault();
          selectPlayer(slotIndex, tableRoster[highlighted].id);
        }
        break;
      case "Escape":
        e.preventDefault();
        setQueries((prev) => prev.map((q, i) => (i === slotIndex ? "" : q)));
        setHL(0);
        break;
    }
  };

  // ── roster table click ────────────────────────────────────────────────────
  const handleRosterClick = (i: number) => {
    const player = tableRoster[i];
    if (!player) return;
    const target =
      focusedSlot !== null && slots[focusedSlot] === null
        ? focusedSlot
        : slots.findIndex((s) => s === null);
    if (target === -1) return;
    selectPlayer(target, player.id);
  };

  // ── Next N ────────────────────────────────────────────────────────────────
  const handleNext = () => {
    const prevSlots   = [...slots];
    const prevQueries = [...queries];
    const top = roster.slice(0, courtSize);
    setSlots(Array.from({ length: courtSize }, (_, i) => top[i]?.id ?? null));
    setQueries(Array(courtSize).fill(""));
    toast(`Next ${courtSize} filled`, {
      action: { label: "Undo", onClick: () => { setSlots(prevSlots); setQueries(prevQueries); } },
    });
  };

  // ── drag-drop player into slot (with undo toast) ──────────────────────────
  const dropPlayerToSlot = (slotIndex: number, playerId: string) => {
    const prevSlots   = [...slots];
    const prevQueries = [...queries];
    selectPlayer(slotIndex, playerId);
    const name = playersById[playerId]?.name ?? "Player";
    toast(`${name} added`, {
      action: { label: "Undo", onClick: () => { setSlots(prevSlots); setQueries(prevQueries); } },
    });
  };

  const canConfirm =
    slots.slice(0, half).some(Boolean) && slots.slice(half).some(Boolean);

  const handleConfirm = () => {
    const prev = useStore.getState().session;
    bulkAssign(
      courtId,
      slots.slice(0, half).filter(Boolean) as string[],
      slots.slice(half).filter(Boolean) as string[],
    );
    toast(`Players assigned to Court ${String(courtNumber).padStart(2, "0")}`, {
      action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
    });
    onClose();
  };

  const slotLabel = (i: number) => `${i < half ? "A" : "B"}${(i % half) + 1}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="wide"
      eyebrow={`Court ${String(courtNumber).padStart(2, "0")} · ${courtSize === 2 ? "Singles" : "Doubles"}`}
      title="Set players"
    >
      <div className="space-y-5">
        {/* ── two-column body ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_200px] gap-5">

          {/* ── left: slots + queue strip + roster ── */}
          <div className="space-y-4">

            {/* Slot grid — also accepts whole-queue-card drops */}
            <div
              className={`grid grid-cols-[1fr_auto_1fr] gap-x-3 transition-all rounded-sm ${queueDragOver ? "ring-1 ring-neon ring-offset-2 ring-offset-ink-100" : ""}`}
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes("text/picker-queue-card")) return;
                e.preventDefault();
                setQueueDragOver(true);
              }}
              onDragLeave={() => setQueueDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setQueueDragOver(false);
                const raw = e.dataTransfer.getData("text/picker-queue-card");
                if (!raw) return;
                const prevSlots   = [...slots];
                const prevQueries = [...queries];
                const { sideA, sideB } = JSON.parse(raw) as { sideA: string[]; sideB: string[] };
                setSlots(Array.from({ length: courtSize }, (_, i) => {
                  if (i < half) return sideA[i] ?? null;
                  return sideB[i - half] ?? null;
                }));
                setQueries(Array(courtSize).fill(""));
                toast("Queue card applied", {
                  action: { label: "Undo", onClick: () => { setSlots(prevSlots); setQueries(prevQueries); } },
                });
              }}
            >
              <div className="space-y-2">
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4">Side A</div>
                {Array.from({ length: half }, (_, row) => (
                  <SlotInput
                    key={row}
                    slotIndex={row}
                    label={slotLabel(row)}
                    selectedId={slots[row]}
                    query={queries[row]}
                    playersById={playersById}
                    ref={(el) => { inputRefs.current[row] = el; }}
                    onQueryChange={(q) => setQueries((prev) => prev.map((v, i) => (i === row ? q : v)))}
                    onFocus={() => handleSlotFocus(row)}
                    onBlur={handleSlotBlur}
                    onKeyDown={(e) => handleSlotKeyDown(e, row)}
                    onClear={() => clearSlot(row)}
                    onSwap={(from) => swapSlots(row, from)}
                    onPlayerDrop={(id) => dropPlayerToSlot(row, id)}
                  />
                ))}
              </div>

              <div className="flex items-center justify-center font-display italic text-bone-4 text-[11px]">
                vs
              </div>

              <div className="space-y-2">
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4">Side B</div>
                {Array.from({ length: half }, (_, row) => {
                  const bIdx = half + row;
                  return (
                    <SlotInput
                      key={row}
                      slotIndex={bIdx}
                      label={slotLabel(bIdx)}
                      selectedId={slots[bIdx]}
                      query={queries[bIdx]}
                      playersById={playersById}
                      ref={(el) => { inputRefs.current[bIdx] = el; }}
                      onQueryChange={(q) => setQueries((prev) => prev.map((v, i) => (i === bIdx ? q : v)))}
                      onFocus={() => handleSlotFocus(bIdx)}
                      onBlur={handleSlotBlur}
                      onKeyDown={(e) => handleSlotKeyDown(e, bIdx)}
                      onClear={() => clearSlot(bIdx)}
                      onSwap={(from) => swapSlots(bIdx, from)}
                      onPlayerDrop={(id) => dropPlayerToSlot(bIdx, id)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Compact Q·1 strip — small screens only */}
            {queueCards[0] && (
              <CompactQStrip card={queueCards[0]} index={1} className="lg:hidden" />
            )}

            {/* Filters */}
            <div className="space-y-1.5 pt-1 border-t-[0.5px] border-hairline-2">
              <PickerFilterRow
                label="Lvl"
                options={[
                  { value: "all", label: "All" },
                  ...LEVELS.map((lv) => ({ value: lv, label: LEVEL_LABEL[lv] })),
                ]}
                value={levelFilter}
                onChange={(v) => { setLevelFilter(v as Level | "all"); setHL(0); }}
              />
              <PickerFilterRow
                label="Sex"
                options={[
                  { value: "all",    label: "All" },
                  { value: "male",   label: <Mars size={11} strokeWidth={2} /> },
                  { value: "female", label: <Venus size={11} strokeWidth={2} /> },
                ]}
                value={genderFilter}
                onChange={(v) => { setGenderFilter(v as "all" | "male" | "female"); setHL(0); }}
              />
              <PickerFilterRow
                label="Status"
                options={[
                  { value: "all",   label: "All" },
                  { value: "idle",  label: "Idle" },
                  { value: "queue", label: "Queue" },
                ]}
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v as "all" | "idle" | "queue"); setHL(0); }}
              />
            </div>

            {/* Persistent roster table */}
            <RosterTable
              players={tableRoster}
              highlighted={highlighted}
              focusedSlot={focusedSlot}
              query={focusedSlot !== null ? queries[focusedSlot] : ""}
              tick={tick}
              onClick={handleRosterClick}
              onHover={setHL}
            />
          </div>

          {/* ── right: full queue panel — large screens only ── */}
          <div className="hidden lg:flex lg:flex-col lg:gap-2.5">
            <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-bone-4 mb-0.5">
              Match Queue
            </div>
            {queueCards.map((card, i) => (
              <QueueCardPreview key={card.id} card={card} index={i + 1} />
            ))}
          </div>
        </div>

        {/* ── footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t-[0.5px] border-hairline-2">
          <button
            onClick={handleNext}
            className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4 hover:text-bone px-2 py-1 border-[0.5px] border-hairline-2 hover:border-bone-3 cursor-pointer transition-colors"
          >
            Next {courtSize}
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              variant={canConfirm ? "solid" : "outline"}
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              Start match
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

// ─── SlotInput ────────────────────────────────────────────────────────────────

type SlotInputProps = {
  slotIndex: number;
  label: string;
  selectedId: string | null;
  query: string;
  playersById: Record<string, Player>;
  onQueryChange: (q: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onSwap: (fromSlot: number) => void;
  onPlayerDrop: (playerId: string) => void;
};

const SlotInput = forwardRef<HTMLInputElement, SlotInputProps>(function SlotInput(
  { slotIndex, label, selectedId, query, playersById, onQueryChange, onFocus, onBlur, onKeyDown, onClear, onSwap, onPlayerDrop },
  inputRef,
) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    if (!e.dataTransfer.types.includes("text/picker-slot") &&
        !e.dataTransfer.types.includes("text/picker-player-id")) return;
    e.preventDefault();
    setDragOver(true);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const slotFrom = e.dataTransfer.getData("text/picker-slot");
    if (slotFrom !== "") {
      const from = parseInt(slotFrom, 10);
      if (!isNaN(from) && from !== slotIndex) onSwap(from);
      return;
    }
    const playerId = e.dataTransfer.getData("text/picker-player-id");
    if (playerId) onPlayerDrop(playerId);
  };

  // ── filled chip ───────────────────────────────────────────────────────────
  if (selectedId && playersById[selectedId]) {
    const player = playersById[selectedId];
    return (
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/picker-slot", String(slotIndex));
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`h-[38px] border-[0.5px] flex items-center gap-1.5 px-2 cursor-grab active:cursor-grabbing select-none transition-colors ${
          dragOver ? "border-neon bg-neon-ghost" : "border-hairline-2 bg-ink-050"
        }`}
      >
        <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-bone-4 shrink-0 w-5">{label}</span>
        {player.gender === "male"
          ? <Mars size={11} className="g-male shrink-0" strokeWidth={2} />
          : <Venus size={11} className="g-female shrink-0" strokeWidth={2} />
        }
        <span className="font-display font-semibold text-[13px] text-bone flex-1 min-w-0 truncate">{player.name}</span>
        <Chip tone={`level-${player.level}`} className="text-[8px] px-1 py-[1px] shrink-0">
          {LEVEL_LABEL[player.level]}
        </Chip>
        <button
          tabIndex={-1}
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="shrink-0 text-bone-4 hover:text-alert cursor-pointer flex items-center"
          aria-label={`Remove ${player.name}`}
        >
          <X size={11} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  // ── empty input ───────────────────────────────────────────────────────────
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div
        className={`h-[38px] border-[0.5px] flex items-center gap-2 px-2 transition-colors ${
          dragOver
            ? "border-neon bg-neon-ghost"
            : query
            ? "border-bone-3"
            : "border-dashed border-hairline-3 focus-within:border-bone-3"
        }`}
      >
        <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-bone-4 shrink-0 w-5">{label}</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder="Type name…"
          className="flex-1 bg-transparent font-display text-[13px] text-bone placeholder:text-bone-4 outline-none min-w-0"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
});

// ─── RosterTable ──────────────────────────────────────────────────────────────

function RosterTable({
  players,
  highlighted,
  focusedSlot,
  query,
  tick,
  onClick,
  onHover,
}: {
  players: Player[];
  highlighted: number;
  focusedSlot: number | null;
  query: string;
  tick: number;
  onClick: (i: number) => void;
  onHover: (i: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4">
          {query ? "Search" : "Roster"}
        </span>
        {focusedSlot !== null && !query && (
          <span className="font-mono text-[8px] tracking-[0.14em] text-bone-4">
            ↑↓ navigate · Enter select
          </span>
        )}
      </div>
      <div className="border-[0.5px] border-hairline-2">
        {players.length === 0 ? (
          <div className="px-4 py-5 font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4 text-center">
            {query ? "No match" : "No players available"}
          </div>
        ) : (
          players.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onClick(i)}
              onMouseEnter={() => onHover(i)}
              className={`w-full flex items-center gap-2 px-3 h-[38px] rule-bottom last:border-b-0 cursor-pointer text-left transition-colors ${
                i === highlighted ? "bg-neon-ghost" : "hover:bg-ink-150"
              }`}
            >
              <span className="font-mono digit text-[10px] text-bone-4 w-3 shrink-0 text-right">{i + 1}</span>
              {p.gender === "male"
                ? <Mars size={11} className="g-male shrink-0" strokeWidth={2} />
                : <Venus size={11} className="g-female shrink-0" strokeWidth={2} />
              }
              <span className="font-display font-semibold text-[13px] text-bone flex-1 min-w-0 truncate">{p.name}</span>
              <Chip tone={`level-${p.level}`} className="text-[8px] px-1 py-[1px] shrink-0">
                {LEVEL_LABEL[p.level]}
              </Chip>
              {p.status === "waiting" && (
                <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-neon shrink-0">Q</span>
              )}
              {(p.gamesPlayed ?? 0) > 0 && (
                <span className="font-mono text-[9px] text-bone-4 shrink-0">{p.gamesPlayed}g</span>
              )}
              {tick - p.statusSince >= 60_000 && (
                <span className="font-mono digit text-[9px] text-bone-4 shrink-0 tabular-nums w-8 text-right">
                  {formatShortDuration(tick - p.statusSince)}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── QueueCardPreview (large screen right panel) ──────────────────────────────

function QueueCardPreview({
  card,
  index,
}: {
  card: {
    id: string;
    filled: number;
    total: number;
    isReady: boolean;
    sideA: (Player | null)[];
    sideB: (Player | null)[];
  };
  index: number;
}) {
  const hasPlayers = card.filled > 0;

  const cardPayload = JSON.stringify({
    sideA: card.sideA.filter(Boolean).map((p) => p!.id),
    sideB: card.sideB.filter(Boolean).map((p) => p!.id),
  });

  return (
    <div
      draggable={hasPlayers}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/picker-queue-card", cardPayload);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className={`border-[0.5px] px-3 py-2.5 transition-colors ${
        hasPlayers ? "cursor-grab active:cursor-grabbing" : ""
      } ${
        card.isReady
          ? "border-neon/40 bg-neon-ghost"
          : "border-hairline-2"
      }`}
    >
      {/* header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono digit text-[9px] text-bone-4 tracking-[0.14em]">Q·{index}</span>
        <Chip tone={card.isReady ? "neon" : "muted"} className="text-[8px]">
          {card.isReady ? <><LiveDot className="bg-ink-000" /> Ready</> : `${card.filled}/${card.total}`}
        </Chip>
      </div>

      {/* players */}
      {hasPlayers ? (
        <div className="mt-1 space-y-0.5">
          {[...card.sideA.map((p, i) => ({ p, side: "A", i })),
            ...card.sideB.map((p, i) => ({ p, side: "B", i }))
          ].map(({ p, side, i }) => {
            if (!p) return null;
            return (
              <div
                key={p.id}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.setData("text/picker-player-id", p.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="flex items-center gap-1.5 px-1 py-[3px] cursor-grab hover:bg-ink-150 transition-colors"
              >
                <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-bone-4 shrink-0 w-3">
                  {side}{i + 1}
                </span>
                {p.gender === "male"
                  ? <Mars size={9} className="g-male shrink-0" strokeWidth={2} />
                  : <Venus size={9} className="g-female shrink-0" strokeWidth={2} />
                }
                <span className="font-display text-[11px] text-bone truncate leading-tight flex-1 min-w-0">
                  {p.name}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-bone-4">Empty</div>
      )}
    </div>
  );
}

// ─── PickerFilterRow ─────────────────────────────────────────────────────────

function PickerFilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-bone-2 pt-[3px] w-10 shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`font-mono text-[8px] uppercase tracking-[0.16em] px-1.5 py-0.5 border-[0.5px] cursor-pointer transition-colors ${
              value === opt.value
                ? "border-bone bg-bone text-ink-000"
                : "border-hairline-2 text-bone-2 hover:border-bone-3 hover:text-bone"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── CompactQStrip (small screens — Q·1 only) ────────────────────────────────

function CompactQStrip({
  card,
  index,
  className = "",
}: {
  card: {
    id: string;
    filled: number;
    total: number;
    isReady: boolean;
    sideA: (Player | null)[];
    sideB: (Player | null)[];
  };
  index: number;
  className?: string;
}) {
  const allNames = [...card.sideA, ...card.sideB]
    .filter(Boolean)
    .map((p) => p!.name);

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 border-[0.5px] ${
        card.isReady ? "border-neon/40 bg-neon-ghost" : "border-hairline-2"
      } ${className}`}
    >
      <span className="font-mono digit text-[9px] text-bone-4 tracking-[0.14em] shrink-0">Q·{index}</span>
      <Chip tone={card.isReady ? "neon" : "muted"} className="text-[8px] shrink-0">
        {card.isReady ? <><LiveDot className="bg-ink-000" /> Ready</> : `${card.filled}/${card.total}`}
      </Chip>
      {allNames.length > 0 ? (
        <span className="font-display text-[11px] text-bone-2 truncate min-w-0">
          {allNames.join(" · ")}
        </span>
      ) : (
        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-bone-4">Empty</span>
      )}
    </div>
  );
}
