"use client";

import { useStore } from "@/lib/store";
import { Shell } from "@/components/shell/shell";
import { Leaderboard } from "@/components/records/leaderboard";
import { MatchHistory } from "@/components/records/match-history";
import { formatShortDuration } from "@/lib/format";

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-[0.5px] border-hairline-2 bg-ink-050 px-4 py-3 flex flex-col gap-1.5">
      <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-bone-4">
        {label}
      </span>
      <span className="font-display font-semibold text-[28px] leading-none text-bone">
        {value}
      </span>
    </div>
  );
}

export default function RecordsPage() {
  const players    = useStore((s) => s.session.players);
  const matchesRaw = useStore((s) => s.session.matches);
  const matches    = matchesRaw ?? [];

  const totalPlayMs = matches.reduce((sum, m) => sum + m.durationMs, 0);
  const avgMatchMs  = matches.length > 0 ? Math.round(totalPlayMs / matches.length) : 0;

  return (
    <Shell>
      <div className="p-4 h-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3 h-full">

          {/* ── Left bento card: Leaderboard ──────────────────────────── */}
          <div className="border-[0.5px] border-hairline-2 bg-ink-050 overflow-hidden flex flex-col min-h-0">
            <Leaderboard />
          </div>

          {/* ── Right column ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 min-h-0">

            {/* Stat mini-cards */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <StatCard label="Players"    value={players.length} />
              <StatCard label="Matches"    value={matches.length} />
              <StatCard
                label="Avg length"
                value={avgMatchMs > 0 ? formatShortDuration(avgMatchMs) : "—"}
              />
            </div>

            {/* Match feed bento card */}
            <div className="border-[0.5px] border-hairline-2 bg-ink-050 overflow-hidden flex flex-col flex-1 min-h-0">
              <MatchHistory />
            </div>

          </div>
        </div>
      </div>
    </Shell>
  );
}
