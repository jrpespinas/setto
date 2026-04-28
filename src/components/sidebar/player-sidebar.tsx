"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Mars, Venus, Search, SlidersHorizontal, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { LEVELS, LEVEL_LABEL, type Level, type Player } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AddPlayerDialog } from "@/components/dialogs/add-player-dialog";
import { EditPlayerDialog } from "@/components/dialogs/edit-player-dialog";
import { PlayerCard } from "./player-card";

type LevelFilter   = Level | "all";
type GenderFilter  = "all" | "male" | "female";
type StatusFilter  = "all" | "idle" | "break" | "playing" | "done";
type PaymentFilter = "all" | "paid" | "unpaid";

export function PlayerSidebar() {
  const session = useStore((s) => s.session);
  const [addOpen,  setAddOpen]  = useState(false);
  const [editing,  setEditing]  = useState<Player | null>(null);
  const [query,    setQuery]    = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [levelFilter,   setLevelFilter]   = useState<LevelFilter>("all");
  const [genderFilter,  setGenderFilter]  = useState<GenderFilter>("all");
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const activeFilterCount = [levelFilter, genderFilter, statusFilter, paymentFilter]
    .filter((f) => f !== "all").length;

  // Session average wait — used by PlayerCard for the color gradient
  const avgWaitMs = useMemo(() => {
    const active = session.players.filter(
      (p) => p.status === "idle" || p.status === "playing" || p.status === "waiting",
    );
    if (active.length === 0) return 0;
    return active.reduce((s, p) => s + (tick - p.statusSince), 0) / active.length;
  }, [session.players, tick]);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    const pass = session.players
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .filter((p) => levelFilter   === "all" || p.level  === levelFilter)
      .filter((p) => genderFilter  === "all" || p.gender === genderFilter)
      .filter((p) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "playing") return p.status === "playing" || p.status === "waiting";
        return p.status === statusFilter;
      })
      .filter((p) => paymentFilter === "all" || (paymentFilter === "paid" ? p.paid : !p.paid));

    // Group 1: active — idle, playing, in-queue (fewest games → longest wait)
    const g1 = pass
      .filter((p) => p.status === "idle" || p.status === "playing" || p.status === "waiting")
      .sort((a, b) => (a.gamesPlayed - b.gamesPlayed) || (a.statusSince - b.statusSince));

    // Group 2: resting — low priority, dimmed (fewest games → longest wait)
    const g2 = pass
      .filter((p) => p.status === "break")
      .sort((a, b) => (a.gamesPlayed - b.gamesPlayed) || (a.statusSince - b.statusSince));

    // Group 3: done + unpaid — bottom of list
    const g3 = pass
      .filter((p) => p.status === "done" && !p.paid)
      .sort((a, b) => a.arrivedAt - b.arrivedAt);

    return [...g1, ...g2, ...g3];
  }, [session.players, query, levelFilter, genderFilter, statusFilter, paymentFilter]);

  const total = session.players.length;

  const clearFilters = () => {
    setLevelFilter("all");
    setGenderFilter("all");
    setStatusFilter("all");
    setPaymentFilter("all");
  };

  return (
    <aside
      className="
        relative flex min-h-0 flex-col
        bg-ink-050 rule-left
        slide-in
        xl:h-full xl:overflow-hidden
      "
    >
      {/* Header */}
      <header className="shrink-0 px-4 pt-5 pb-3 rule-bottom">
        {/* Title row */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="statement text-[28px] leading-none flex items-baseline gap-2">
            <span className="big-number digit text-[28px]">{total}</span>
            Players
          </h2>
          <Button variant="solid" size="sm" onClick={() => setAddOpen(true)}>
            + Add
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name"
            className="w-full h-8 bg-transparent border-[0.5px] border-hairline-2 px-2.5 pr-7 font-mono text-[11px] text-bone placeholder:text-bone-4 outline-none focus:border-bone"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-bone-4 hover:text-bone cursor-pointer flex items-center"
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          ) : (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-bone-4 flex items-center">
              <Search size={11} strokeWidth={2} />
            </span>
          )}
        </div>

        {/* Filter toggle */}
        <div className="mt-2">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] px-2 py-1 border-[0.5px] cursor-pointer transition-colors ${
              filtersOpen || activeFilterCount > 0
                ? "border-bone text-bone"
                : "border-hairline-2 text-bone-2 hover:border-bone hover:text-bone"
            }`}
          >
            <SlidersHorizontal size={11} strokeWidth={2.5} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-bone text-ink-000 font-bold text-[8px] w-4 h-4 flex items-center justify-center rounded-full leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filtersOpen && (
            <div className="mt-2 pt-2 border-t-[0.5px] border-hairline-2 space-y-1.5">
              <FilterRow
                label="Lvl"
                options={[
                  { value: "all", label: "All" },
                  ...LEVELS.map((lv) => ({ value: lv, label: LEVEL_LABEL[lv] })),
                ]}
                value={levelFilter}
                onChange={(v) => setLevelFilter(v as LevelFilter)}
              />
              <FilterRow
                label="Sex"
                options={[
                  { value: "all", label: "All" },
                  { value: "male",   label: <Mars size={11} strokeWidth={2} /> },
                  { value: "female", label: <Venus size={11} strokeWidth={2} /> },
                ]}
                value={genderFilter}
                onChange={(v) => setGenderFilter(v as GenderFilter)}
              />
              <FilterRow
                label="Status"
                options={[
                  { value: "all",     label: "All" },
                  { value: "idle",    label: "Idle" },
                  { value: "break",   label: "Resting" },
                  { value: "playing", label: "Playing" },
                  { value: "done",    label: "Done" },
                ]}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as StatusFilter)}
              />
              <FilterRow
                label="Pay"
                options={[
                  { value: "all",    label: "All" },
                  { value: "paid",   label: "Paid" },
                  { value: "unpaid", label: "Unpaid" },
                ]}
                value={paymentFilter}
                onChange={(v) => setPaymentFilter(v as PaymentFilter)}
              />
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="font-mono text-[8px] uppercase tracking-[0.22em] text-bone-2 hover:text-bone cursor-pointer transition-colors pt-0.5"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Player list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="font-display italic text-bone-3 text-sm leading-snug">
              {session.players.length === 0
                ? "No players yet.\nAdd one to start."
                : "No players match."}
            </p>
          </div>
        ) : (
          <ol>
            {sorted.map((p, i) => (
              <PlayerCard
                key={p.id}
                player={p}
                index={i + 1}
                tick={tick}
                avgWaitMs={avgWaitMs}
                onEdit={() => setEditing(p)}
              />
            ))}
          </ol>
        )}
      </div>

      <AddPlayerDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <EditPlayerDialog player={editing} onClose={() => setEditing(null)} />
    </aside>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: ReactNode }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-bone-2 pt-[3px] w-8 shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`font-mono text-[8px] uppercase tracking-[0.16em] px-1.5 py-0.5 border-[0.5px] cursor-pointer transition-colors ${
              value === opt.value
                ? "border-bone bg-bone text-ink-000"
                : "border-hairline-2 text-bone-2 hover:border-bone hover:text-bone"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
