"use client";

import { useState } from "react";
import { Mars, Venus } from "lucide-react";
import { useStore } from "@/lib/store";
import { Chip } from "@/components/ui/chip";
import { LEVEL_LABEL, type Level, type Gender } from "@/lib/types";

// ── Pill ──────────────────────────────────────────────────────────────────

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[8px] uppercase tracking-[0.14em] px-1.5 py-0.5 border-[0.5px] transition-colors cursor-pointer ${
        active
          ? "border-bone bg-bone text-ink-000"
          : "border-hairline-2 text-bone-3 hover:border-bone-3 hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

// ── Win rate bar ──────────────────────────────────────────────────────────

function WinRateBar({ rate, bestRate }: { rate: number; bestRate: number }) {
  const pct    = bestRate > 0 ? (rate / bestRate) * 100 : 0;
  const isZero = rate === 0;
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 h-[3px] bg-hairline-2 overflow-hidden">
        {!isZero && (
          <div
            className="absolute inset-y-0 left-0 bg-neon transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <span className={`font-mono text-[11px] w-7 text-right shrink-0 ${isZero ? "text-alert" : "text-bone"}`}>
        {Math.round(rate * 100)}%
      </span>
    </div>
  );
}

// ── Rank helpers ──────────────────────────────────────────────────────────

function rankAccent(rank: number): string {
  if (rank === 1) return "border-l-2 border-neon";
  if (rank === 2) return "border-l-2 border-bone-2";
  if (rank === 3) return "border-l-2 border-bone-3";
  return "border-l-2 border-transparent";
}

function rankNumberColor(rank: number): string {
  if (rank === 1) return "text-neon";
  if (rank === 2) return "text-bone-2";
  if (rank === 3) return "text-bone-3";
  return "text-bone-4";
}

// ── Options ───────────────────────────────────────────────────────────────

const LEVEL_OPTS: { label: string; value: Level | "all" }[] = [
  { label: "All",   value: "all" },
  { label: "Beg",   value: "beginner" },
  { label: "L-Int", value: "low-intermediate" },
  { label: "Int",   value: "intermediate" },
  { label: "U-Int", value: "upper-intermediate" },
  { label: "Adv",   value: "advanced" },
  { label: "Pro",   value: "professional" },
];

const MIN_GAMES_OPTS: { label: string; value: number }[] = [
  { label: "All", value: 0 },
  { label: "1+",  value: 1 },
  { label: "3+",  value: 3 },
  { label: "5+",  value: 5 },
];

// ── Main component ────────────────────────────────────────────────────────

export function Leaderboard() {
  const players    = useStore((s) => s.session.players);
  const matchesRaw = useStore((s) => s.session.matches);
  const matches    = matchesRaw ?? [];

  const [levelFilter,    setLevelFilter]    = useState<Level | "all">("all");
  const [genderFilter,   setGenderFilter]   = useState<Gender | "all">("all");
  const [minGamesFilter, setMinGamesFilter] = useState(0);

  const filtered = players.filter((p) => {
    if (levelFilter  !== "all" && p.level  !== levelFilter)  return false;
    if (genderFilter !== "all" && p.gender !== genderFilter) return false;
    if (p.gamesPlayed < minGamesFilter)                      return false;
    return true;
  });

  const ranked   = filtered.filter((p) => p.gamesPlayed > 0);
  const unranked = filtered.filter((p) => p.gamesPlayed === 0);

  ranked.sort((a, b) => {
    const rA = a.wins / a.gamesPlayed;
    const rB = b.wins / b.gamesPlayed;
    if (rB !== rA) return rB - rA;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.gamesPlayed - a.gamesPlayed;
  });

  const rankOf: number[] = [];
  let currentRank = 1;
  for (let i = 0; i < ranked.length; i++) {
    if (i > 0) {
      const prev = ranked[i - 1];
      const curr = ranked[i];
      const sameRate = prev.wins / prev.gamesPlayed === curr.wins / curr.gamesPlayed;
      const sameWins = prev.wins === curr.wins;
      if (!(sameRate && sameWins)) currentRank = i + 1;
    }
    rankOf.push(currentRank);
  }

  const bestRate = ranked.length > 0 ? ranked[0].wins / ranked[0].gamesPlayed : 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 pt-4 pb-3 rule-bottom space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4">
            Leaderboard
          </span>
          <span className="font-mono text-[9px] text-bone-4">{ranked.length}</span>
        </div>

        {/* Filters */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-bone-4 w-6 shrink-0">Lvl</span>
            {LEVEL_OPTS.map((o) => (
              <Pill key={o.value} active={levelFilter === o.value} onClick={() => setLevelFilter(o.value)}>
                {o.label}
              </Pill>
            ))}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-bone-4 w-6 shrink-0">Sex</span>
            <Pill active={genderFilter === "all"}    onClick={() => setGenderFilter("all")}>All</Pill>
            <Pill active={genderFilter === "male"}   onClick={() => setGenderFilter("male")}>
              <Mars size={9} strokeWidth={2.5} className="inline" />
            </Pill>
            <Pill active={genderFilter === "female"} onClick={() => setGenderFilter("female")}>
              <Venus size={9} strokeWidth={2.5} className="inline" />
            </Pill>
            <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-bone-4 ml-2 shrink-0">Min</span>
            {MIN_GAMES_OPTS.map((o) => (
              <Pill key={o.value} active={minGamesFilter === o.value} onClick={() => setMinGamesFilter(o.value)}>
                {o.label}
              </Pill>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrollable body ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
      {matches.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-bone-4">No matches yet.</p>
        </div>
      ) : ranked.length === 0 && unranked.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-bone-4">No players match.</p>
        </div>
      ) : (
        <>
          {/* ── Column headers ──────────────────────────────────────── */}
          <div className="flex items-center gap-2 px-5 py-2 border-l-2 border-transparent rule-bottom">
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-bone-4 w-5 shrink-0">#</span>
            <span className="w-4 shrink-0" />
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-bone-4 flex-1">Player</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-bone-4 w-6 text-center shrink-0">Gms</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-bone-4 w-6 text-center shrink-0">Won</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-bone-4 w-6 text-center shrink-0">Lst</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-bone-4 w-32 text-right shrink-0">Win rate</span>
          </div>

          {/* ── Ranked rows ──────────────────────────────────────────── */}
          {ranked.map((p, i) => {
            const rank    = rankOf[i];
            const winRate = p.wins / p.gamesPlayed;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-5 py-2.5 rule-bottom ${rankAccent(rank)} ${rank === 1 ? "bg-neon/[0.08]" : ""} hover:bg-ink-100 transition-colors`}
              >
                <span className={`font-mono text-[12px] font-semibold w-5 shrink-0 ${rankNumberColor(rank)}`}>
                  {rank}
                </span>
                <span className="w-4 shrink-0 flex items-center justify-center">
                  {p.gender === "male"
                    ? <Mars size={10} strokeWidth={2} className="text-cold" />
                    : <Venus size={10} strokeWidth={2} className="text-alert" />
                  }
                </span>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="font-display font-semibold text-[13px] text-bone truncate">
                    {p.name}
                  </span>
                  <Chip tone="muted" className="shrink-0">{LEVEL_LABEL[p.level]}</Chip>
                </div>
                <span className="font-mono text-[11px] text-bone-3 w-6 text-center shrink-0">
                  {p.gamesPlayed}
                </span>
                <span className={`font-mono text-[11px] w-6 text-center shrink-0 ${p.wins > 0 ? "text-neon" : "text-bone-4"}`}>
                  {p.wins}
                </span>
                <span className={`font-mono text-[11px] w-6 text-center shrink-0 ${p.losses > 0 ? "text-alert" : "text-bone-4"}`}>
                  {p.losses}
                </span>
                <div className="w-32 shrink-0">
                  <WinRateBar rate={winRate} bestRate={bestRate} />
                </div>
              </div>
            );
          })}

          {/* ── Unranked ─────────────────────────────────────────────── */}
          {unranked.length > 0 && minGamesFilter === 0 && (
            <>
              <div className="flex items-center gap-2 px-5 py-2 border-l-2 border-transparent rule-bottom bg-ink-050/60">
                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-bone-4">
                  Unranked
                </span>
                <span className="font-mono text-[8px] text-bone-4">{unranked.length}</span>
              </div>
              {unranked.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-5 py-2.5 rule-bottom border-l-2 border-transparent opacity-40 hover:bg-ink-100 transition-colors"
                >
                  <span className="font-mono text-[12px] text-bone-4 w-5 shrink-0">—</span>
                  <span className="w-4 shrink-0 flex items-center justify-center">
                    {p.gender === "male"
                      ? <Mars size={10} strokeWidth={2} className="text-cold" />
                      : <Venus size={10} strokeWidth={2} className="text-alert" />
                    }
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="font-display font-semibold text-[13px] text-bone-3 truncate">
                      {p.name}
                    </span>
                    <Chip tone="muted" className="shrink-0">{LEVEL_LABEL[p.level]}</Chip>
                  </div>
                  <span className="font-mono text-[11px] text-bone-4 w-6 text-center shrink-0">0</span>
                  <span className="font-mono text-[11px] text-bone-4 w-6 text-center shrink-0">0</span>
                  <span className="font-mono text-[11px] text-bone-4 w-6 text-center shrink-0">0</span>
                  <span className="font-mono text-[11px] text-bone-4 w-32 text-right shrink-0">—</span>
                </div>
              ))}
            </>
          )}
        </>
      )}
      </div>
    </div>
  );
}
