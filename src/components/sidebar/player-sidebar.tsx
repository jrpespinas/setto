"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Mars, Venus, Search, SlidersHorizontal, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { LEVELS, LEVEL_LABEL, type Level } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AddPlayerDialog } from "@/components/dialogs/add-player-dialog";
import { PlayerCard } from "./player-card";

type LevelFilter   = Level | "all";
type GenderFilter  = "all" | "male" | "female";
type StatusFilter  = "all" | "idle" | "break" | "playing" | "done";
type PaymentFilter = "all" | "paid" | "unpaid";

// ── Section header ────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5 rule-bottom bg-ink-050 sticky top-0 z-10">
      <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-bone-4">
        {label}
      </span>
      <span className="font-mono text-[8px] text-bone-4">{count}</span>
    </div>
  );
}

// ── Main sidebar ──────────────────────────────────────────────────────────

export function PlayerSidebar() {
  const session = useStore((s) => s.session);
  const [addOpen,       setAddOpen]       = useState(false);
  const [query,         setQuery]         = useState("");
  const [filtersOpen,   setFiltersOpen]   = useState(false);
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

  const avgWaitMs = useMemo(() => {
    const active = session.players.filter(
      (p) => p.status === "idle" || p.status === "playing" || p.status === "waiting",
    );
    if (active.length === 0) return 0;
    return active.reduce((s, p) => s + (tick - p.statusSince), 0) / active.length;
  }, [session.players, tick]);

  const groups = useMemo(() => {
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

    const g1 = pass
      .filter((p) => p.status === "idle" || p.status === "playing" || p.status === "waiting")
      .sort((a, b) => (a.gamesPlayed - b.gamesPlayed) || (a.statusSince - b.statusSince));

    const g2 = pass
      .filter((p) => p.status === "break")
      .sort((a, b) => (a.gamesPlayed - b.gamesPlayed) || (a.statusSince - b.statusSince));

    const g3 = pass
      .filter((p) => p.status === "done" && !p.paid)
      .sort((a, b) => a.arrivedAt - b.arrivedAt);

    return { g1, g2, g3 };
  }, [session.players, query, levelFilter, genderFilter, statusFilter, paymentFilter]);

  const { g1, g2, g3 } = groups;
  const total    = session.players.filter((p) => !(p.status === "done" && p.paid)).length;
  const filtered = g1.length + g2.length + g3.length;
  const isFiltered = activeFilterCount > 0 || query.trim() !== "";

  const clearFilters = () => {
    setLevelFilter("all");
    setGenderFilter("all");
    setStatusFilter("all");
    setPaymentFilter("all");
    setQuery("");
  };

  return (
    <aside className="relative flex min-h-0 flex-col bg-ink-050 rule-left slide-in xl:h-full overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="shrink-0 px-4 pt-4 pb-3 rule-bottom space-y-2.5">

        {/* Title + Add */}
        <div className="flex items-center justify-between gap-2">
          <h2 className="statement text-[20px] leading-none flex items-baseline gap-1.5">
            <span className="big-number digit text-[20px]">{total}</span>
            Players
          </h2>
          <Button variant="solid" size="sm" onClick={() => setAddOpen(true)}>
            + Add
          </Button>
        </div>

        {/* Search + filter toggle on same row */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name"
              className="w-full h-7 bg-transparent border-[0.5px] border-hairline-2 px-2.5 pr-6 font-mono text-[11px] text-bone placeholder:text-bone-4 outline-none focus:border-bone"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-bone-4 hover:text-bone cursor-pointer flex items-center"
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            ) : (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-bone-4 flex items-center pointer-events-none">
                <Search size={10} strokeWidth={2} />
              </span>
            )}
          </div>

          {/* Filter toggle — same row as search */}
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            aria-label="Toggle filters"
            className={`relative flex items-center justify-center h-7 w-7 border-[0.5px] cursor-pointer transition-colors shrink-0 ${
              filtersOpen || activeFilterCount > 0
                ? "border-bone text-bone"
                : "border-hairline-2 text-bone-3 hover:border-bone-3 hover:text-bone"
            }`}
          >
            <SlidersHorizontal size={11} strokeWidth={2.5} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-bone text-ink-000 font-bold text-[7px] w-3.5 h-3.5 flex items-center justify-center rounded-full leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="pt-2 border-t-[0.5px] border-hairline-2 space-y-1.5">
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
                { value: "all",    label: "All" },
                { value: "male",   label: <Mars size={10} strokeWidth={2} /> },
                { value: "female", label: <Venus size={10} strokeWidth={2} /> },
              ]}
              value={genderFilter}
              onChange={(v) => setGenderFilter(v as GenderFilter)}
            />
            <FilterRow
              label="Status"
              options={[
                { value: "all",     label: "All"     },
                { value: "idle",    label: "Idle"    },
                { value: "break",   label: "Rest"    },
                { value: "playing", label: "Playing" },
                { value: "done",    label: "Done"    },
              ]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
            />
            <FilterRow
              label="Pay"
              options={[
                { value: "all",    label: "All"    },
                { value: "paid",   label: "Paid"   },
                { value: "unpaid", label: "Unpaid" },
              ]}
              value={paymentFilter}
              onChange={(v) => setPaymentFilter(v as PaymentFilter)}
            />
            {(activeFilterCount > 0 || query) && (
              <button
                onClick={clearFilters}
                className="font-mono text-[8px] uppercase tracking-[0.22em] text-bone-3 hover:text-bone cursor-pointer transition-colors pt-0.5"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </header>

      {/* ── Player list ───────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* Filter banner */}
        {isFiltered && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-ink-000/20 rule-bottom">
            <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-bone-4">
              Showing {filtered} of {total}
            </span>
            <button
              onClick={clearFilters}
              className="font-mono text-[8px] uppercase tracking-[0.18em] text-bone-3 hover:text-bone cursor-pointer transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {total === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="font-display italic text-bone-3 text-sm leading-snug">
              No players yet.{"\n"}Add one to start.
            </p>
          </div>
        ) : filtered === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-4">
              No players match.
            </p>
          </div>
        ) : (
          <>
            {/* Active */}
            {g1.length > 0 && (
              <>
                <SectionHeader label="Active" count={g1.length} />
                <ol>
                  {g1.map((p, i) => (
                    <PlayerCard key={p.id} player={p} index={i + 1} tick={tick} avgWaitMs={avgWaitMs} />
                  ))}
                </ol>
              </>
            )}

            {/* Resting */}
            {g2.length > 0 && (
              <>
                <SectionHeader label="Resting" count={g2.length} />
                <ol>
                  {g2.map((p, i) => (
                    <PlayerCard key={p.id} player={p} index={i + 1} tick={tick} avgWaitMs={avgWaitMs} />
                  ))}
                </ol>
              </>
            )}

            {/* Done — unpaid */}
            {g3.length > 0 && (
              <>
                <SectionHeader label="Done · Unpaid" count={g3.length} />
                <ol>
                  {g3.map((p, i) => (
                    <PlayerCard key={p.id} player={p} index={i + 1} tick={tick} avgWaitMs={avgWaitMs} />
                  ))}
                </ol>
              </>
            )}

          </>
        )}
      </div>

      <AddPlayerDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </aside>
  );
}

// ── Filter row ────────────────────────────────────────────────────────────

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
