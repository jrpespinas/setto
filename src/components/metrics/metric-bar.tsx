"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore, selectors } from "@/lib/store";
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

    const avgMatchMs = session.matchesCompleted > 0
      ? (session.totalMatchDurationMs ?? 0) / session.matchesCompleted
      : 0;

    return {
      active:           ongoing.length,
      total:            session.courts.length,
      waiters,
      avgStatusSince,
      avgMatchMs,
      onBreak:          selectors.breakList(session).length,
      unpaid:           unpaid.length,
      matchesCompleted: session.matchesCompleted,
    };
  }, [session]);

  const avgWaitMs = m.avgStatusSince > 0 ? tick - m.avgStatusSince : 0;
  const activeAccent = m.active > 0 ? "neon" : "mute" as const;

  return (
    <div className="shrink-0 hidden md:block">
      <div className="flex items-stretch">

        {/* ── COURTS ── */}
        <Cluster title="Courts" flex="flex-3" highlight gap="gap-8">
          <CourtsRatio active={m.active} total={m.total} accent={activeAccent} />
          <Stat
            label="Matches"
            value={m.matchesCompleted}
            accent={m.matchesCompleted > 0 ? "default" : "mute"}
          />
          <DurationStat
            label="Avg Match"
            durationMs={m.avgMatchMs}
            accent={m.avgMatchMs > 0 ? "default" : "mute"}
          />
        </Cluster>

        {/* ── PLAYERS ── */}
        <Cluster title="Players" flex="flex-3" gap="gap-8">
          <Stat
            label="Waiting"
            value={m.waiters.length}
            accent={m.waiters.length > 0 ? "default" : "mute"}
          />
          <Stat
            label="On Break"
            value={m.onBreak}
            accent={m.onBreak > 0 ? "default" : "mute"}
          />
          <AvgWaitStat avgWaitMs={avgWaitMs} />
        </Cluster>

        {/* ── FEES ── */}
        <Cluster title="Fees" last>
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
  last,
}: {
  title: string;
  children: ReactNode;
  gap?: string;
  flex?: string;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`${flex} flex flex-col px-6 py-4 ${!last ? "rule-right" : ""} ${highlight ? "bg-neon-ghost" : ""}`}>
      <div className={`font-mono text-[9px] uppercase tracking-[0.28em] ${highlight ? "text-bone-3" : "text-bone-4"} mb-2.5`}>
        {title}
      </div>
      <div className={`flex items-center justify-center ${gap}`}>
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

function formatAvgWait(ms: number): string {
  if (ms <= 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = String(totalSec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function AvgWaitStat({ avgWaitMs }: { avgWaitMs: number }) {
  const AMBER_MS = 8 * 60 * 1000;
  const RED_MS   = 15 * 60 * 1000;
  const accent: Accent =
    avgWaitMs >= RED_MS   ? "alert" :
    avgWaitMs >= AMBER_MS ? "warm"  :
    avgWaitMs > 0         ? "default" : "mute";

  return (
    <div className="flex flex-col items-center text-center">
      <div className={`${NUM} ${accentColor(accent)}`}>{formatAvgWait(avgWaitMs)}</div>
      <div className={`${LBL} mt-2`}>Avg Wait</div>
    </div>
  );
}

function DurationStat({ label, durationMs, accent = "default" }: {
  label: string;
  durationMs: number;
  accent?: Accent;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`${NUM} ${accentColor(accent)}`}>{formatAvgWait(durationMs)}</div>
      <div className={`${LBL} mt-2`}>{label}</div>
    </div>
  );
}
