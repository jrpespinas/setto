"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore, selectors } from "@/lib/store";
import { formatShortDuration } from "@/lib/format";
import { Hairline } from "@/components/ui/chip";

/** Metric bar — hidden on phones (<768px). Tablets and up only. */
export function MetricBar() {
  const session = useStore((s) => s.session);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const m = useMemo(() => {
    const byId    = selectors.byId(session);
    const ongoing = session.courts.filter((c) => {
      const half = c.size / 2;
      const a = c.slots.slice(0, half).filter((id) => id && byId[id]);
      const b = c.slots.slice(half).filter((id) => id && byId[id]);
      return a.length > 0 && b.length > 0;
    });

    const idle    = selectors.idle(session);
    const waiting = selectors.waiting(session);
    const waiters = [...idle, ...waiting];
    const unpaid  = session.players.filter((p) => !p.paid);

    const avgStatusSince = waiters.length > 0
      ? waiters.reduce((sum, p) => sum + p.statusSince, 0) / waiters.length
      : 0;

    const ongoingIds  = new Set(ongoing.map((c) => c.id));
    const vacantSorted = session.courts
      .filter((c) => !ongoingIds.has(c.id))
      .sort((a, b) => a.number - b.number);
    const activeSorted = [...ongoing].sort(
      (a, b) => (a.matchStartedAt ?? Infinity) - (b.matchStartedAt ?? Infinity),
    );
    const nextFreeCourt = vacantSorted[0] ?? activeSorted[0] ?? session.courts[0];

    return {
      active:        ongoing.length,
      total:         session.courts.length,
      waiters,
      avgStatusSince,
      unpaid:        unpaid.length,
      nextFreeCourt,
    };
  }, [session]);

  const avgWaitMs    = m.avgStatusSince > 0 ? tick - m.avgStatusSince : 0;
  const GAME_MS      = 13 * 60 * 1000;
  const tolerance    = GAME_MS / Math.max(1, m.active);
  const activeAccent = m.active > 0 ? "neon" : "mute" as const;
  const nextFreeElapsed = m.nextFreeCourt?.matchStartedAt
    ? tick - m.nextFreeCourt.matchStartedAt
    : null;

  return (
    <div className="shrink-0 hidden md:block">
      <div className="flex items-stretch">

        {/* ── COURTS ── */}
        <Cluster title="Courts" highlight>
          <CourtsRatio active={m.active} total={m.total} accent={activeAccent} />
          <NextFreeCourtStat court={m.nextFreeCourt} elapsed={nextFreeElapsed} />
        </Cluster>

        {/* ── PLAYERS — unified dot-matrix chart ── */}
        <Cluster title="Players" flex="flex-[1.4]" stretch>
          <UnifiedWaitChart
            waiters={m.waiters}
            tick={tick}
            avgWaitMs={avgWaitMs}
            tolerance={tolerance}
          />
        </Cluster>

        {/* ── FEES ── */}
        <Cluster title="Fees" flex="flex-[0.75]" last>
          <Stat
            label="Unpaid"
            value={m.unpaid}
            accent={m.unpaid > 0 ? "alert" : "mute"}
          />
        </Cluster>

      </div>
      <Hairline />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Layout shell
───────────────────────────────────────────────────────────── */

function Cluster({
  title,
  children,
  gap = "gap-12",
  flex = "flex-1",
  highlight,
  stretch,
  last,
}: {
  title: string;
  children: ReactNode;
  gap?: string;
  flex?: string;
  highlight?: boolean;
  stretch?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`${flex} flex flex-col px-6 py-4 ${!last ? "rule-right" : ""} ${highlight ? "bg-neon-ghost" : ""}`}>
      <div className={`font-mono text-[9px] uppercase tracking-[0.28em] ${highlight ? "text-bone-3" : "text-bone-4"} mb-2.5`}>
        {title}
      </div>
      <div className={stretch
        ? "flex-1 flex items-center w-full"
        : `flex items-center justify-center ${gap}`
      }>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Shared tokens
───────────────────────────────────────────────────────────── */

type Accent = "default" | "neon" | "alert" | "warm" | "mute";
const NUM = "big-number digit text-[40px] leading-[0.85]";
const LBL = "font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4";

function accentColor(accent: Accent) {
  return accent === "neon"  ? "text-neon"
    : accent === "alert" ? "text-alert"
    : accent === "warm"  ? "text-warm"
    : accent === "mute"  ? "text-bone-3"
    : "text-bone";
}

/* ─────────────────────────────────────────────────────────────
   Stat components
───────────────────────────────────────────────────────────── */

function Stat({ label, value, accent = "default" }: {
  label: string; value: number; accent?: Accent;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`${NUM} ${accentColor(accent)}`}>{value}</div>
      <div className={`${LBL} mt-2`}>{label}</div>
    </div>
  );
}

function CourtsRatio({ active, total, accent }: { active: number; total: number; accent: Accent }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`${NUM} flex items-baseline gap-[3px]`}>
        <span className={accentColor(accent)}>{active}</span>
        <span className="text-[24px] text-bone-4">/</span>
        <span className="text-bone">{total}</span>
      </div>
      <div className={`${LBL} mt-2`}>Active Courts</div>
    </div>
  );
}

function NextFreeCourtStat({ court, elapsed }: {
  court?: { number: number };
  elapsed: number | null;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4 mb-0.5`}>
        {court ? "Court" : ""}
      </div>
      <div className={`${NUM} ${court ? "text-bone" : "text-bone-3"}`}>
        {court ? String(court.number).padStart(2, "0") : "--"}
      </div>
      {elapsed !== null && (
        <div className="font-mono text-[11px] text-bone-3 mt-0.5 tracking-[0.08em]">
          {formatShortDuration(elapsed)}
        </div>
      )}
      <div className={`${LBL} mt-2`}>Next Free</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Unified Wait Chart — Nothing-inspired dot matrix
   ─ Columns sorted ascending: shortest wait left → longest right
   ─ Ghost dots (top) + filled dots (bottom) per column
   ─ Outlier name · time always visible above rightmost column
   ─ Hover reveals name · time for all other columns (desktop)
   ─ "N Waiting" left-aligned below as chart legend
───────────────────────────────────────────────────────────── */

const MAX_ROWS = 6;
const DOT_PX   = 5;   // dot diameter in px
const GAP_PX   = 2;   // vertical gap between dots
const CHART_H  = MAX_ROWS * (DOT_PX + GAP_PX) - GAP_PX; // 40px

function UnifiedWaitChart({ waiters, tick, avgWaitMs, tolerance }: {
  waiters: Array<{ name: string; statusSince: number }>;
  tick: number;
  avgWaitMs: number;
  tolerance: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const sorted = [...waiters]
    .map((p) => ({ name: p.name, ms: tick - p.statusSince }))
    .sort((a, b) => a.ms - b.ms);

  const count = sorted.length;
  const maxMs = count > 0 ? sorted[count - 1].ms : 1;

  const getDotFill = (ms: number): string => {
    const dev = avgWaitMs > 0 ? ms - avgWaitMs : ms;
    if (dev > tolerance * 2) return "var(--alert)";
    if (dev > tolerance)     return "var(--warm)";
    return "var(--bone-3)";
  };

  const outlier     = count > 0 ? sorted[count - 1] : null;
  const outlierDev  = outlier ? (avgWaitMs > 0 ? outlier.ms - avgWaitMs : outlier.ms) : 0;
  const outlierColor = outlierDev > tolerance * 2 ? "var(--alert)"
    : outlierDev > tolerance ? "var(--warm)"
    : "var(--bone-3)";

  return (
    <div className="w-full flex flex-col" onMouseLeave={() => setHoveredIdx(null)}>

      {/* Outlier label — fixed height, right-aligned above rightmost column */}
      <div className="relative h-5 mb-2 flex items-end">
        {outlier && (
          <div className="absolute right-0 flex items-baseline gap-1.5" style={{ color: outlierColor }}>
            <span className="font-display font-semibold text-[13px] leading-none">
              {outlier.name}
            </span>
            <span className="font-mono text-[9px] tracking-[0.08em] opacity-80">
              {formatShortDuration(outlier.ms)}
            </span>
          </div>
        )}
      </div>

      {/* Dot matrix columns */}
      <div
        className="relative flex gap-[3px] w-full"
        style={{ height: `${CHART_H}px` }}
      >
        {count === 0 ? (
          <span className="font-mono text-[11px]" style={{ color: "var(--bone-4)" }}>—</span>
        ) : (
          sorted.map((player, i) => {
            const filledDots = Math.max(1, Math.round((player.ms / maxMs) * MAX_ROWS));
            const isOutlier  = i === count - 1;
            const dotFill    = getDotFill(player.ms);

            return (
              <div
                key={i}
                className="relative flex-1 flex flex-col gap-[2px] items-center cursor-default"
                style={{ height: `${CHART_H}px` }}
                onMouseEnter={() => setHoveredIdx(i)}
              >
                {Array.from({ length: MAX_ROWS }).map((_, row) => {
                  // Rows near the bottom (high index) are filled
                  const filled = row >= MAX_ROWS - filledDots;
                  return (
                    <div
                      key={row}
                      style={{
                        width:           `${DOT_PX}px`,
                        height:          `${DOT_PX}px`,
                        borderRadius:    "50%",
                        flexShrink:       0,
                        backgroundColor: filled ? dotFill : "var(--hairline-2)",
                        transition:      "background-color 0.3s ease",
                      }}
                    />
                  );
                })}

                {/* Hover tooltip — non-outlier columns, desktop only */}
                {hoveredIdx === i && !isOutlier && (
                  <div
                    className="absolute bottom-full mb-2 z-50 px-2 py-1
                               bg-ink-200 border-[0.5px] border-hairline-2
                               font-mono text-[9px] text-bone whitespace-nowrap
                               pointer-events-none"
                    style={{ left: "50%", transform: "translateX(-50%)" }}
                  >
                    {player.name} · {formatShortDuration(player.ms)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* N Waiting — left-aligned legend */}
      <div className={`${LBL} mt-2`}>
        {count} Waiting
      </div>

    </div>
  );
}
