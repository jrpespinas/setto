"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Mars, Venus, Settings2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { LEVEL_FULL_LABEL, LEVEL_LABEL, LEVELS, type Level, type Player, type PlayerStatus } from "@/lib/types";
import { formatShortDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { AddPlayerDialog } from "@/components/dialogs/add-player-dialog";
import { EditPlayerDialog } from "@/components/dialogs/edit-player-dialog";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey = "name" | "gender" | "level" | "status" | "gamesPlayed" | "wins" | "losses" | "winRate" | "statusSince" | "paid";
type SortDir = "asc" | "desc";

type Filters = {
  level:  Level | "all";
  gender: "all" | "male" | "female";
  status: "all" | "idle" | "waiting" | "playing" | "break" | "done";
  paid:   "all" | "paid" | "unpaid";
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function winRate(p: Player): number {
  return (p.gamesPlayed ?? 0) > 0 ? (p.wins ?? 0) / (p.gamesPlayed ?? 0) : -1;
}

const STATUS_ORDER: Record<PlayerStatus, number> = {
  playing: 0, waiting: 1, idle: 2, break: 3, done: 4,
};

function sortPlayers(players: Player[], key: SortKey, dir: SortDir): Player[] {
  const mul = dir === "asc" ? 1 : -1;
  return [...players].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "name":       cmp = a.name.localeCompare(b.name); break;
      case "gender":     cmp = a.gender.localeCompare(b.gender); break;
      case "level":      cmp = LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level); break;
      case "status":     cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]; break;
      case "gamesPlayed":cmp = (a.gamesPlayed ?? 0) - (b.gamesPlayed ?? 0); break;
      case "wins":       cmp = (a.wins ?? 0) - (b.wins ?? 0); break;
      case "losses":     cmp = (a.losses ?? 0) - (b.losses ?? 0); break;
      case "winRate":    cmp = winRate(a) - winRate(b); break;
      case "statusSince":cmp = a.statusSince - b.statusSince; break;
      case "paid":       cmp = (a.paid ? 1 : 0) - (b.paid ? 1 : 0); break;
    }
    return cmp * mul;
  });
}

// ── Status chip (editable) ────────────────────────────────────────────────────

const STATUS_META: Record<PlayerStatus, { label: string; tone: string }> = {
  idle:    { label: "Idle",    tone: "muted" },
  waiting: { label: "Queue",   tone: "neon"  },
  playing: { label: "Playing", tone: "neon"  },
  break:   { label: "Resting", tone: "cold"  },
  done:    { label: "Done",    tone: "alert" },
};

function EditableStatusChip({ player }: { player: Player }) {
  const setStatus    = useStore((s) => s.setStatus);
  const [open, setOpen]           = useState(false);
  const [confirmDone, setConfirmDone] = useState(false);
  const [pos, setPos]             = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const { label, tone } = STATUS_META[player.status];
  const isSystemManaged = player.status === "waiting" || player.status === "playing";

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleOpen = () => {
    if (isSystemManaged) return;
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 4, left: rect.left });
    setOpen((v) => !v);
  };

  const transition = (next: PlayerStatus) => {
    setOpen(false);
    if (next === "done") { setConfirmDone(true); return; }
    const prev = useStore.getState().session;
    setStatus(player.id, next);
    toast(`${player.name} → ${STATUS_META[next].label}`, {
      action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
    });
  };

  const options: { status: PlayerStatus; label: string }[] = [];
  if (player.status === "idle")  { options.push({ status: "break", label: "Set Resting" }, { status: "done", label: "Set Done" }); }
  if (player.status === "break") { options.push({ status: "idle",  label: "Set Idle"    }, { status: "done", label: "Set Done" }); }
  if (player.status === "done")  { options.push({ status: "idle",  label: "Rejoin (Idle)" }); }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        title={isSystemManaged ? "Managed by queue / court" : "Change status"}
        className={`flex items-center gap-0.5 ${isSystemManaged ? "cursor-default" : "cursor-pointer hover:opacity-75 transition-opacity"}`}
      >
        <Chip tone={tone as Parameters<typeof Chip>[0]["tone"]} className="text-[9px] px-1.5 py-[1px]">
          {label}
        </Chip>
        {!isSystemManaged && (
          open
            ? <ChevronUp size={8} strokeWidth={2.5} className="text-bone-3 shrink-0" />
            : <ChevronDown size={8} strokeWidth={2.5} className="text-bone-3 shrink-0" />
        )}
      </button>

      {open && options.length > 0 && (
        <div
          className="fixed z-50 bg-ink-100 border-[0.5px] border-hairline-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] py-1 min-w-[140px]"
          style={{ top: pos.top, left: pos.left }}
        >
          {options.map(({ status, label: optLabel }) => (
            <button
              key={status}
              onClick={() => transition(status)}
              className="w-full text-left px-3 py-1.5 font-display text-[13px] text-bone hover:bg-ink-150 cursor-pointer transition-colors"
            >
              {optLabel}
            </button>
          ))}
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
        description={`${player.name} will be marked Done. They can rejoin later if needed.`}
        confirmLabel="Mark done"
      />
    </>
  );
}

// ── Pay chip (editable) ───────────────────────────────────────────────────────

function EditablePayChip({ player }: { player: Player }) {
  const togglePaid = useStore((s) => s.togglePaid);

  const handleClick = () => {
    const prev = useStore.getState().session;
    togglePaid(player.id);
    toast(player.paid ? `${player.name} marked unpaid` : `${player.name} marked paid`, {
      action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
    });
  };

  return (
    <button
      onClick={handleClick}
      title={player.paid ? "Mark unpaid" : "Mark paid"}
      className="flex items-center gap-0.5 cursor-pointer hover:opacity-75 transition-opacity"
    >
      {player.paid
        ? <Chip tone="muted" className="text-[9px] px-1.5 py-[1px]">Paid</Chip>
        : <Chip tone="alert" className="text-[9px] px-1.5 py-[1px]">Unpaid</Chip>
      }
      <ChevronDown size={8} strokeWidth={2.5} className="text-bone-3 shrink-0" />
    </button>
  );
}

// ── Sort icon ─────────────────────────────────────────────────────────────────

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={10} strokeWidth={2.5} className="text-bone-4 ml-0.5" />;
  return sortDir === "asc"
    ? <ChevronUp size={10} strokeWidth={2.5} className="text-bone ml-0.5" />
    : <ChevronDown size={10} strokeWidth={2.5} className="text-bone ml-0.5" />;
}

// ── Row action menu ───────────────────────────────────────────────────────────

function RowActionMenu({ player }: { player: Player }) {
  const setStatus     = useStore((s) => s.setStatus);
  const togglePaid    = useStore((s) => s.togglePaid);
  const removePlayer  = useStore((s) => s.removePlayer);

  const [open, setOpen]             = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [confirmDone, setConfirmDone]     = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [menuPos, setMenuPos]       = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleOpen = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpen((v) => !v);
  };

  const act = (fn: () => void) => { setOpen(false); fn(); };

  const isDone    = player.status === "done";
  const isIdle    = player.status === "idle";
  const isBreak   = player.status === "break";

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="text-bone-4 hover:text-bone cursor-pointer flex items-center p-1 transition-colors"
        aria-label="Player actions"
      >
        {open ? <X size={13} strokeWidth={2.5} /> : <Settings2 size={13} strokeWidth={2} />}
      </button>

      {open && (
        <div
          className="fixed z-50 bg-ink-100 border-[0.5px] border-hairline-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] py-1 min-w-[160px]"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <MenuItem onClick={() => act(() => setEditOpen(true))}>Edit player</MenuItem>
          {!isIdle  && <MenuItem onClick={() => act(() => { const p = useStore.getState().session; setStatus(player.id, "idle");  toast(`${player.name} set to idle`,    { action: { label: "Undo", onClick: () => useStore.getState().restoreSession(p) } }); })}>→ Set Idle</MenuItem>}
          {!isBreak && !isDone && <MenuItem onClick={() => act(() => { const p = useStore.getState().session; setStatus(player.id, "break"); toast(`${player.name} set to resting`, { action: { label: "Undo", onClick: () => useStore.getState().restoreSession(p) } }); })}>→ Set Resting</MenuItem>}
          {!isDone  && <MenuItem onClick={() => act(() => setConfirmDone(true))}>→ Set Done</MenuItem>}
          <MenuItem onClick={() => act(() => { const p = useStore.getState().session; togglePaid(player.id); toast(player.paid ? `${player.name} marked unpaid` : `${player.name} marked paid`, { action: { label: "Undo", onClick: () => useStore.getState().restoreSession(p) } }); })}>
            {player.paid ? "Mark Unpaid" : "Mark Paid"}
          </MenuItem>
          <div className="my-1 border-t-[0.5px] border-hairline-2" />
          <MenuItem danger onClick={() => act(() => setConfirmRemove(true))}>Remove</MenuItem>
        </div>
      )}

      <EditPlayerDialog player={editOpen ? player : null} onClose={() => setEditOpen(false)} />

      <ConfirmDialog
        open={confirmDone}
        onClose={() => setConfirmDone(false)}
        onConfirm={() => {
          const prev = useStore.getState().session;
          setStatus(player.id, "done");
          toast(`${player.name} marked done`, { action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) } });
        }}
        title="Mark as done?"
        description={`${player.name} will be moved to Done and hidden once paid.`}
        confirmLabel="Mark done"
      />
      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => {
          const prev = useStore.getState().session;
          removePlayer(player.id);
          toast(`${player.name} removed`, { action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) } });
        }}
        title="Remove player?"
        description={`${player.name} will be permanently removed from this session.`}
        confirmLabel="Remove"
        danger
      />
    </>
  );
}

function MenuItem({ children, onClick, danger }: { children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 font-display text-[13px] hover:bg-ink-150 cursor-pointer transition-colors ${danger ? "text-alert" : "text-bone"}`}
    >
      {children}
    </button>
  );
}

// ── Player row (inline editing) ───────────────────────────────────────────────

function PlayerRow({ player, index, tick }: { player: Player; index: number; tick: number }) {
  const updatePlayer = useStore((s) => s.updatePlayer);

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal]         = useState(player.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setNameVal(player.name); }, [player.name]);
  useEffect(() => { if (editingName) nameInputRef.current?.select(); }, [editingName]);

  const saveName = () => {
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== player.name) {
      const prev = useStore.getState().session;
      updatePlayer(player.id, { name: trimmed });
      toast(`Renamed to ${trimmed}`, { action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) } });
    } else {
      setNameVal(player.name);
    }
    setEditingName(false);
  };

  // Sex toggle
  const toggleSex = () => {
    const prev = useStore.getState().session;
    updatePlayer(player.id, { gender: player.gender === "male" ? "female" : "male" });
    toast(`${player.name} updated`, { action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) } });
  };

  // Level picker
  const [levelOpen, setLevelOpen] = useState(false);
  const [levelPos, setLevelPos]   = useState({ top: 0, left: 0 });
  const levelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!levelOpen) return;
    const close = (e: MouseEvent) => {
      if (levelBtnRef.current && !levelBtnRef.current.contains(e.target as Node)) setLevelOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [levelOpen]);

  const handleLevelOpen = () => {
    const rect = levelBtnRef.current?.getBoundingClientRect();
    if (rect) setLevelPos({ top: rect.bottom + 4, left: rect.left });
    setLevelOpen((v) => !v);
  };

  const pickLevel = (level: Level) => {
    setLevelOpen(false);
    if (level === player.level) return;
    const prev = useStore.getState().session;
    updatePlayer(player.id, { level });
    toast(`${player.name} → ${LEVEL_FULL_LABEL[level]}`, { action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) } });
  };

  const wr = winRate(player);
  const waitMs = tick - player.statusSince;
  const showWait = player.status !== "done" && player.status !== "playing" && player.status !== "waiting";

  return (
    <tr
      className={`rule-bottom last:border-b-0 hover:bg-ink-050 transition-colors border-l-2 ${
        player.status === "playing" || player.status === "waiting" ? "border-l-neon" :
        player.status === "break"   ? "border-l-cold"  :
        player.status === "done"    ? "border-l-alert" : "border-l-transparent"
      }`}
    >
      <td className="px-3 py-2.5 font-mono digit text-[10px] text-bone-4 hidden md:table-cell">{index + 1}</td>

      {/* Name — click to edit inline */}
      <td className="px-3 py-2.5">
        {editingName ? (
          <input
            ref={nameInputRef}
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") { setNameVal(player.name); setEditingName(false); }
            }}
            className="font-display font-semibold text-[14px] text-bone bg-transparent border-b border-bone-3 outline-none w-full max-w-[120px]"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            title="Click to rename"
            className="font-display font-semibold text-[14px] text-bone truncate max-w-[120px] block text-left cursor-text hover:text-bone-2 transition-colors"
          >
            {player.name}
          </button>
        )}
      </td>

      {/* Sex — click to toggle */}
      <td className="px-3 py-2.5 hidden md:table-cell">
        <button onClick={toggleSex} title="Toggle gender" className="cursor-pointer hover:opacity-75 transition-opacity">
          {player.gender === "male"
            ? <Mars size={13} className="g-male shrink-0" strokeWidth={2} aria-hidden />
            : <Venus size={13} className="g-female shrink-0" strokeWidth={2} aria-hidden />
          }
        </button>
      </td>

      {/* Level — click to open picker */}
      <td className="px-3 py-2.5">
        <button ref={levelBtnRef} onClick={handleLevelOpen} className="flex items-center gap-0.5 cursor-pointer hover:opacity-75 transition-opacity">
          <Chip tone={`level-${player.level}`} className="text-[8px] px-1 py-[1px] whitespace-nowrap">
            {LEVEL_LABEL[player.level]}
          </Chip>
          {levelOpen
            ? <ChevronUp size={8} className="text-bone-3 shrink-0" />
            : <ChevronDown size={8} className="text-bone-3 shrink-0" />
          }
        </button>
        {levelOpen && (
          <div
            className="fixed z-50 bg-ink-100 border-[0.5px] border-hairline-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)] py-1 min-w-[160px]"
            style={{ top: levelPos.top, left: levelPos.left }}
          >
            {LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => pickLevel(lv)}
                className={`w-full text-left px-3 py-1.5 font-display text-[13px] hover:bg-ink-150 cursor-pointer transition-colors ${lv === player.level ? "text-bone font-semibold" : "text-bone-3"}`}
              >
                {LEVEL_FULL_LABEL[lv]}
              </button>
            ))}
          </div>
        )}
      </td>

      {/* Status */}
      <td className="px-3 py-2.5"><EditableStatusChip player={player} /></td>

      {/* Games */}
      <td className="px-3 py-2.5 font-mono digit text-[11px] text-bone-2 hidden md:table-cell">
        {(player.gamesPlayed ?? 0) > 0 ? `${player.gamesPlayed}g` : "—"}
      </td>

      {/* W / L */}
      <td className="px-3 py-2.5 font-mono digit text-[11px] hidden md:table-cell">
        <span className={(player.wins ?? 0) > 0 ? "text-neon" : "text-bone-4"}>{player.wins ?? 0}</span>
      </td>
      <td className="px-3 py-2.5 font-mono digit text-[11px] hidden md:table-cell">
        <span className={(player.losses ?? 0) > 0 ? "text-alert" : "text-bone-4"}>{player.losses ?? 0}</span>
      </td>

      {/* Win% */}
      <td className="px-3 py-2.5 font-mono digit text-[11px] text-bone-2 hidden lg:table-cell">
        {wr >= 0 ? `${Math.round(wr * 100)}%` : "—"}
      </td>

      {/* Wait */}
      <td className="px-3 py-2.5 font-mono digit text-[11px] text-bone-4 hidden lg:table-cell tabular-nums">
        {showWait && waitMs >= 60_000 ? formatShortDuration(waitMs) : "—"}
      </td>

      {/* Pay */}
      <td className="px-3 py-2.5 hidden lg:table-cell">
        <EditablePayChip player={player} />
      </td>

      {/* Actions */}
      <td className="px-2 py-2.5 text-right">
        <RowActionMenu player={player} />
      </td>
    </tr>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function Toolbar({
  search, onSearch,
  filters, onFilter,
  onAdd,
}: {
  search: string;
  onSearch: (v: string) => void;
  filters: Filters;
  onFilter: (f: Partial<Filters>) => void;
  onAdd: () => void;
}) {
  const activeCount = [
    filters.level  !== "all",
    filters.gender !== "all",
    filters.status !== "all",
    filters.paid   !== "all",
  ].filter(Boolean).length;

  return (
    <div className="shrink-0 mb-3 space-y-0">
      {/* Search + Add row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 flex items-center gap-2 border-[0.5px] border-hairline-2 px-3 h-9 bg-ink-050 focus-within:border-bone-3 transition-colors">
          <Search size={13} strokeWidth={2.5} className="text-bone-4 shrink-0" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search name…"
            className="flex-1 bg-transparent font-display text-[13px] text-bone placeholder:text-bone-4 outline-none"
          />
          {search && (
            <button onClick={() => onSearch("")} className="text-bone-4 hover:text-bone cursor-pointer" aria-label="Clear search">
              <X size={12} strokeWidth={2.5} aria-hidden />
            </button>
          )}
        </div>
        <Button variant="solid" size="sm" onClick={onAdd}>+ Add</Button>
      </div>

      {/* Always-visible filter rows — 2 × 2 grid */}
      <div className="border-[0.5px] border-hairline-2 bg-ink-050 px-4 py-2.5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
        <FilterRow label="Level" value={filters.level}
          options={[{ v: "all", l: "All" }, ...LEVELS.map((lv) => ({ v: lv, l: LEVEL_LABEL[lv] }))]}
          onChange={(v) => onFilter({ level: v as Level | "all" })}
        />
        <FilterRow label="Gender" value={filters.gender}
          options={[
            { v: "all",    l: "All" },
            { v: "male",   l: <Mars   size={11} strokeWidth={2} className="g-male"   aria-hidden /> },
            { v: "female", l: <Venus  size={11} strokeWidth={2} className="g-female" aria-hidden /> },
          ]}
          onChange={(v) => onFilter({ gender: v as Filters["gender"] })}
        />
        <FilterRow label="Status" value={filters.status}
          options={[
            { v: "all", l: "All" }, { v: "idle", l: "Idle" }, { v: "waiting", l: "Queue" },
            { v: "playing", l: "Playing" }, { v: "break", l: "Rest" }, { v: "done", l: "Done" },
          ]}
          onChange={(v) => onFilter({ status: v as Filters["status"] })}
        />
        <FilterRow label="Pay" value={filters.paid}
          options={[{ v: "all", l: "All" }, { v: "paid", l: "Paid" }, { v: "unpaid", l: "Unpaid" }]}
          onChange={(v) => onFilter({ paid: v as Filters["paid"] })}
        />
        {activeCount > 0 && (
          <div className="md:col-span-2 pt-0.5">
            <button
              onClick={() => onFilter({ level: "all", gender: "all", status: "all", paid: "all" })}
              className="font-mono text-[9px] uppercase tracking-[0.1em] text-bone-4 hover:text-bone cursor-pointer transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterRow({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { v: string; l: ReactNode }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-display text-[10px] font-medium text-bone-3 w-12 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map(({ v, l }) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`font-mono text-[9px] uppercase tracking-[0.08em] px-2 py-0.5 border-[0.5px] cursor-pointer transition-colors ${
              value === v ? "border-bone bg-bone text-ink-000" : "border-hairline-2 text-bone-2 hover:border-bone-3 hover:text-bone"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Column header ─────────────────────────────────────────────────────────────

function ColHead({ col, label, sortKey, sortDir, onSort, className = "" }: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir;
  onSort: (k: SortKey) => void; className?: string;
}) {
  return (
    <th
      className={`text-left px-3 py-2 font-display text-[10px] font-semibold text-bone-4 cursor-pointer hover:text-bone-2 select-none whitespace-nowrap ${className}`}
      onClick={() => onSort(col)}
    >
      <span className="flex items-center gap-0.5">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlayerTable() {
  const session    = useStore((s) => s.session);
  const [tick, setTick] = useState(() => Date.now());
  const [sortKey, setSortKey] = useState<SortKey>("winRate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch]   = useState("");
  const [filters, setFilters] = useState<Filters>({ level: "all", gender: "all", status: "all", paid: "all" });
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = session.players.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filters.level  !== "all" && p.level  !== filters.level)  return false;
      if (filters.gender !== "all" && p.gender !== filters.gender) return false;
      if (filters.status !== "all" && p.status !== filters.status) return false;
      if (filters.paid   === "paid"   && !p.paid)  return false;
      if (filters.paid   === "unpaid" &&  p.paid)  return false;
      return true;
    });
    return sortPlayers(filtered, sortKey, sortDir);
  }, [session.players, search, filters, sortKey, sortDir]);

  const colHead = (col: SortKey, label: string, className = "") => (
    <ColHead col={col} label={label} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className={className} />
  );

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        search={search} onSearch={setSearch}
        filters={filters} onFilter={(f) => setFilters((prev) => ({ ...prev, ...f }))}
        onAdd={() => setAddOpen(true)}
      />

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto border-[0.5px] border-hairline-2">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center h-40 font-mono text-[10px] uppercase tracking-[0.22em] text-bone-4">
            {session.players.length === 0 ? "No players yet. Add one to start." : "No players match."}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-ink-050 rule-bottom z-10">
              <tr>
                <th className="px-3 py-2 w-8 text-left font-display text-[10px] font-semibold text-bone-4 hidden md:table-cell">#</th>
                {colHead("name",        "Name")}
                {colHead("gender",      "Sex",    "hidden md:table-cell")}
                {colHead("level",       "Level")}
                {colHead("status",      "Status")}
                {colHead("gamesPlayed", "Games",  "hidden md:table-cell")}
                {colHead("wins",        "W",      "hidden md:table-cell")}
                {colHead("losses",      "L",      "hidden md:table-cell")}
                {colHead("winRate",     "Win%",   "hidden lg:table-cell")}
                {colHead("statusSince", "Wait",   "hidden lg:table-cell")}
                {colHead("paid",        "Pay",    "hidden lg:table-cell")}
                <th className="px-3 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((player, i) => (
                <PlayerRow key={player.id} player={player} index={i} tick={tick} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Row count */}
      <div className="shrink-0 pt-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4">
        {rows.length} player{rows.length !== 1 ? "s" : ""}
        {rows.length !== session.players.length && ` of ${session.players.length}`}
      </div>

      <AddPlayerDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
