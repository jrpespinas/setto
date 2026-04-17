"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore, selectors } from "@/lib/store";
import { LEVEL_RANK } from "@/lib/types";
import { formatShortDuration } from "@/lib/format";
import { Hairline } from "@/components/ui/chip";

/** Command-centre metric bar — three conceptual zones.
 *  Zone 1: The Floor (operations) — always visible.
 *  Zone 2: The Queue (player flow) — hidden when collapsed.
 *  Zone 3: The Desk (admin & stats) — hidden when collapsed. */
export function MetricBar() {
  const session = useStore((s) => s.session);
  const [collapsed, setCollapsed] = useState(false);
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
    const unpaid  = session.players.filter((p) => !p.paid);

    const priorityPlayer = [...idle].sort(
      (a, b) => a.statusSince - b.statusSince || a.arrivedAt - b.arrivedAt,
    )[0];

    const topPerformer = [...session.players]
      .filter((p) => p.gamesPlayed >= 3)
      .sort((a, b) => {
        const rA = a.wins / a.gamesPlayed, rB = b.wins / b.gamesPlayed;
        if (rB !== rA) return rB - rA;
        if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
        const lvl = LEVEL_RANK[b.level] - LEVEL_RANK[a.level];
        return lvl !== 0 ? lvl : a.arrivedAt - b.arrivedAt;
      })[0];

    const waiters = [...idle, ...waiting];
    const avgStatusSince = waiters.length > 0
      ? waiters.reduce((sum, p) => sum + p.statusSince, 0) / waiters.length
      : 0;

    return {
      // Zone 1 — The Floor
      active:            ongoing.length,
      total:             session.courts.length,
      matchesCompleted:  session.matchesCompleted ?? 0,
      // Zone 2 — The Queue
      available:         idle.length + waiting.length,
      priorityPlayer,
      avgStatusSince,
      // Zone 3 — The Desk
      unpaid:            unpaid.length,
      checkedOut:        session.players.length,
      topPerformer,
    };
  }, [session]);

  const priorityMs = m.priorityPlayer ? tick - m.priorityPlayer.statusSince : 0;
  const avgWaitMs  = m.avgStatusSince > 0 ? tick - m.avgStatusSince : 0;

  // With more active courts, rotation is faster so deviations from avg hurt sooner.
  // Tolerance = one game cycle (13 min) spread across active courts.
  const GAME_MS       = 13 * 60 * 1000;
  const tolerance     = GAME_MS / Math.max(1, m.active);
  const excess        = avgWaitMs > 0 ? priorityMs - avgWaitMs : priorityMs;
  const priorityAmber = priorityMs > 0 && excess > tolerance;
  const priorityRed   = priorityMs > 0 && excess > 2 * tolerance;

  // Active courts: green when courts are running
  const activeAccent = m.active > 0 ? "neon" : "mute" as const;
  // Waiting players: amber bottleneck if courts open but fewer than 4 players ready
  const vacantCourts = m.total - m.active;
  const availAccent  = vacantCourts > 0 && m.available < 4 ? "warm"
    : m.available > 0 ? "neon" : "mute" as const;

  return (
    <div className="shrink-0">
      <div className="flex items-stretch">

        {/* ── Zone 1: THE FLOOR — always visible, dominant ── */}
        <Cluster title="The Floor" tier={1}>
          <CourtsRatio active={m.active} total={m.total} accent={activeAccent} />
          <Stat label="Completed" value={m.matchesCompleted} />
        </Cluster>

        {/* ── Zone 2: THE QUEUE — hidden when collapsed ── */}
        {!collapsed && (
          <Cluster title="The Queue" tier={2} gap="gap-10">
            <Stat label="Waiting" value={m.available} accent={availAccent} />
            <AvgWaitStat ms={avgWaitMs} hasWaiters={m.avgStatusSince > 0} />
            <PriorityCard
              player={m.priorityPlayer}
              ms={priorityMs}
              isRed={priorityRed}
              isAmber={priorityAmber}
            />
          </Cluster>
        )}

        {/* ── Zone 3: THE DESK — hidden when collapsed ── */}
        {!collapsed && (
          <Cluster title="The Desk" tier={3} last>
            <UnpaidRatio unpaid={m.unpaid} total={m.checkedOut} />
            <TopPerformerCard player={m.topPerformer} />
          </Cluster>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="w-8 shrink-0 flex items-center justify-center rule-left cursor-pointer text-bone-4 hover:text-bone transition-colors"
          title={collapsed ? "Expand metrics" : "Collapse to floor view"}
        >
          <span className={`transition-transform duration-200 ${collapsed ? "rotate-90" : "-rotate-90"}`}>
            ▾
          </span>
        </button>
      </div>

      <Hairline />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

function Cluster({
  title,
  children,
  tier = 2,
  gap = "gap-16",
  last,
}: {
  title: string;
  children: ReactNode;
  tier?: 1 | 2 | 3;
  gap?: string;
  last?: boolean;
}) {
  const bg         = tier === 1 ? "bg-neon-ghost" : "";
  const titleColor = tier === 1 ? "text-bone-3" : "text-bone-4";
  const py         = tier === 1 ? "py-4" : "py-3";

  return (
    <div className={`flex-1 flex flex-col px-6 ${py} ${!last ? "rule-right" : ""} ${bg}`}>
      <div className={`font-mono text-[9px] uppercase tracking-[0.28em] ${titleColor} mb-2.5`}>
        {title}
      </div>
      <div className={`flex items-center justify-center ${gap}`}>
        {children}
      </div>
    </div>
  );
}

type Accent = "default" | "neon" | "alert" | "moss" | "cold" | "warm" | "mute";

const NUM = "big-number digit text-[40px] leading-[0.85]";
const LBL = "font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4 mt-2";

function accentColor(accent: Accent) {
  return accent === "neon"  ? "text-neon"
    : accent === "alert" ? "text-alert"
    : accent === "moss"  ? "text-moss"
    : accent === "cold"  ? "text-cold"
    : accent === "warm"  ? "text-warm"
    : accent === "mute"  ? "text-bone-3"
    : "text-bone";
}

function Stat({ label, value, accent = "default" }: {
  label: string; value: number; accent?: Accent;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`${NUM} ${accentColor(accent)}`}>
        {String(value).padStart(2, "0")}
      </div>
      <div className={LBL}>{label}</div>
    </div>
  );
}

function UnpaidRatio({ unpaid, total }: { unpaid: number; total: number }) {
  const alert = unpaid > 0;
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`${NUM} flex items-baseline gap-[3px]`}>
        <span className={alert ? "text-alert" : "text-bone-3"}>{String(unpaid).padStart(2, "0")}</span>
        <span className="text-[24px] text-bone-4">/</span>
        <span className="text-bone-3">{String(total).padStart(2, "0")}</span>
      </div>
      <div className={LBL}>Unpaid / Total</div>
    </div>
  );
}

function CourtsRatio({ active, total, accent }: { active: number; total: number; accent: Accent }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`${NUM} flex items-baseline gap-[3px]`}>
        <span className={accentColor(accent)}>{String(active).padStart(2, "0")}</span>
        <span className="text-[24px] text-bone-4">/</span>
        <span className="text-bone">{String(total).padStart(2, "0")}</span>
      </div>
      <div className={LBL}>Active Courts</div>
    </div>
  );
}

function AvgWaitStat({ ms, hasWaiters }: { ms: number; hasWaiters: boolean }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`${NUM} ${hasWaiters ? "text-bone" : "text-bone-3"}`}>
        {hasWaiters ? formatShortDuration(ms) : "--"}
      </div>
      <div className={LBL}>Avg Wait</div>
    </div>
  );
}

function PriorityCard({ player, ms, isRed, isAmber }: {
  player?: { name: string }; ms: number; isRed: boolean; isAmber: boolean;
}) {
  const color = isRed ? "text-alert" : isAmber ? "text-warm" : "text-bone";
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`${NUM} ${player ? color : "text-bone-3"}`}>
        {player ? formatShortDuration(ms) : "--"}
      </div>
      <div className="font-display font-semibold text-[12px] text-bone-2 mt-1.5 truncate max-w-[90px]">
        {player ? player.name : ""}
      </div>
      <div className={LBL}>Longest Wait</div>
    </div>
  );
}

function TopPerformerCard({ player }: {
  player?: { name: string; wins: number; gamesPlayed: number };
}) {
  const winRate = player ? Math.round((player.wins / player.gamesPlayed) * 100) : null;
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`${NUM} ${winRate !== null ? "text-neon" : "text-bone-3"}`}>
        {winRate !== null ? `${winRate}%` : "--"}
      </div>
      <div className="font-display font-semibold text-[12px] text-bone-2 mt-1.5 truncate max-w-[110px]">
        {player ? player.name : ""}
      </div>
      <div className={LBL}>Top Win Rate</div>
    </div>
  );
}
