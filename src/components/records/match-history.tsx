"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatDuration, formatShortDuration } from "@/lib/format";
import type { MatchRecord } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 60)  return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Match card (compact 2-line) ───────────────────────────────────────────

function MatchCard({ match, highlight }: { match: MatchRecord; highlight: string }) {
  const winA = match.winner === "A";
  const winB = match.winner === "B";
  const draw = match.winner === "none";

  const winnerSide = winB ? match.sideB : match.sideA;
  const loserSide  = winB ? match.sideA : match.sideB;

  const renderNames = (players: { playerId: string; name: string }[]) =>
    players.map((p, i) => {
      const isMatch = highlight !== "" && p.name.toLowerCase().includes(highlight);
      return (
        <span key={p.playerId}>
          {i > 0 && <span className="font-display font-semibold text-[13px] mx-0.5 text-bone-4">·</span>}
          <span className={`font-display font-semibold text-[13px] text-bone ${
            isMatch ? "underline decoration-neon decoration-[1.5px] underline-offset-2" : ""
          }`}>
            {p.name}
          </span>
        </span>
      );
    });

  return (
    <div className="px-5 py-2.5 rule-bottom">

      {/* ▲ Winner  vs  Loser — natural-width, no stretching */}
      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
        <span className={`font-mono text-[9px] shrink-0 leading-none ${!draw ? "text-neon" : "invisible"}`}>
          ▲
        </span>
        <div className="min-w-0 truncate shrink">
          {renderNames(winnerSide)}
        </div>
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-bone-4 shrink-0">
          {draw ? "draw" : "vs"}
        </span>
        <div className="min-w-0 truncate shrink opacity-40">
          {renderNames(loserSide)}
        </div>
      </div>

      {/* Metadata — all grouped left, no floating time */}
      <div className="flex items-center gap-1.5 mt-1 pl-4">
        <span className="font-mono text-[9px] text-bone-4 uppercase tracking-[0.12em]">
          C{String(match.courtNumber).padStart(2, "0")}
        </span>
        <span className="font-mono text-[9px] text-bone-4">·</span>
        <span className="font-mono text-[9px] text-bone-4">{formatDuration(match.durationMs)}</span>
        <span className="font-mono text-[9px] text-bone-4">·</span>
        <span className="font-mono text-[9px] text-bone-4">{relativeTime(match.completedAt)}</span>
      </div>

    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function MatchHistory() {
  const matchesRaw = useStore((s) => s.session.matches);
  const matches    = matchesRaw ?? [];

  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = [...matches]
    .sort((a, b) => b.completedAt - a.completedAt)
    .filter((m) => {
      if (!q) return true;
      return [...m.sideA, ...m.sideB].some((p) => p.name.toLowerCase().includes(q));
    });

  const totalPlayMs = matches.reduce((sum, m) => sum + m.durationMs, 0);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 pt-4 pb-3 rule-bottom space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4">
            Match Feed
          </span>
          {matches.length > 0 && (
            <span className="font-mono text-[9px] text-bone-4">
              {formatShortDuration(totalPlayMs)} total
            </span>
          )}
        </div>

        {/* Player search */}
        {matches.length > 0 && (
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search player…"
              className="w-full h-7 bg-transparent border-[0.5px] border-hairline-2 px-2.5 pr-7 font-mono text-[11px] text-bone placeholder:text-bone-4 outline-none focus:border-bone transition-colors"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-bone-4 hover:text-bone cursor-pointer flex items-center"
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            ) : (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-bone-4 flex items-center pointer-events-none">
                <Search size={10} strokeWidth={2} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Scrollable content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
      {matches.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-bone-4">
            No matches recorded yet.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-bone-4">
            No matches for &ldquo;{query}&rdquo;.
          </p>
        </div>
      ) : (
        filtered.map((m) => (
          <MatchCard key={m.id} match={m} highlight={q} />
        ))
      )}
      </div>
    </div>
  );
}
