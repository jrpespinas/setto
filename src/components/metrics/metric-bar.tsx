"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore, selectors } from "@/lib/store";
import { LEVEL_RANK } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { Hairline } from "@/components/ui/chip";

/** Command-centre metric bar.
 *  T1 Matchmaking — T2 Active — T3 Summary.
 *  Collapse hides T2 + T3, leaving T1 always visible. */
export function MetricBar() {
  const session = useStore((s) => s.session);
  const [collapsed, setCollapsed] = useState(false);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const m = useMemo(() => {
    const byId = selectors.byId(session);
    const occupied = selectors.occupiedOnCourts(session.courts);
    const ongoing = session.courts.filter((c) => {
      const half = c.size / 2;
      const a = c.slots.slice(0, half).filter((id) => id && byId[id]);
      const b = c.slots.slice(half).filter((id) => id && byId[id]);
      return a.length > 0 && b.length > 0;
    });

    const idle    = selectors.idle(session);
    const waiting = selectors.waiting(session);
    const breaks  = selectors.breakList(session);
    const done    = selectors.done(session);
    const playing = session.players.filter((p) => p.status === "playing" && occupied.has(p.id));
    const paid    = session.players.filter((p) => p.paid);
    const unpaid  = session.players.filter((p) => !p.paid);

    const priorityPlayer = [...idle].sort(
      (a, b) => a.statusSince - b.statusSince || a.arrivedAt - b.arrivedAt,
    )[0];

    const topPerformer = [...session.players]
      .filter((p) => p.gamesPlayed > 0)
      .sort((a, b) => {
        const rA = a.wins / a.gamesPlayed, rB = b.wins / b.gamesPlayed;
        if (rB !== rA) return rB - rA;
        if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
        const lvl = LEVEL_RANK[b.level] - LEVEL_RANK[a.level];
        return lvl !== 0 ? lvl : a.arrivedAt - b.arrivedAt;
      })[0];

    return {
      // T1 — Matchmaking
      vacant:   session.courts.length - ongoing.length,
      available: idle.length + waiting.length,
      priorityPlayer,
      // T2 — Active
      occupied: ongoing.length,
      playing:  playing.length,
      unpaid:   unpaid.length,
      // T3 — Summary
      total:    session.courts.length,
      settled:  paid.length,
      sidelined: breaks.length + done.length,
      topPerformer,
    };
  }, [session]);

  const priorityMs    = m.priorityPlayer ? tick - m.priorityPlayer.statusSince : 0;
  const priorityRed   = priorityMs > 25 * 60 * 1000;
  const priorityAmber = priorityMs > 15 * 60 * 1000;

  // Vacant: green if courts open + enough players; red if no courts
  const vacantAccent  = m.vacant === 0 ? "alert" : m.available >= 4 ? "neon" : "neon";
  // Available: warn (cold) if courts open but not enough players for a match
  const availAccent   = m.vacant > 0 && m.available < 4 ? "cold"
    : m.available > 0 ? "neon" : "mute";

  return (
    <div className="shrink-0">
      <div className="flex items-stretch">

        {/* ── T1: MATCHMAKING — always visible, dominant ── */}
        <Cluster title="Matchmaking" tier={1} width="flex-[1.5]">
          <Stat label="Vacant Courts"    value={m.vacant}    accent={vacantAccent} size="lg" />
          <Stat label="Avail. Players"  value={m.available} accent={availAccent}  size="lg" />
          <PriorityCard
            player={m.priorityPlayer}
            ms={priorityMs}
            isRed={priorityRed}
            isAmber={priorityAmber}
          />
        </Cluster>

        {/* ── T2: ACTIVE — hidden when collapsed ── */}
        {!collapsed && (
          <Cluster title="Active" tier={2} width="flex-1">
            <Stat label="Courts Active"   value={m.occupied} accent={m.occupied > 0 ? "neon" : "mute"} />
            <Stat label="Players Playing" value={m.playing}  accent={m.playing  > 0 ? "neon" : "mute"} />
            <Stat label="Unpaid Fees"     value={m.unpaid}   accent={m.unpaid   > 0 ? "alert" : "moss"} />
          </Cluster>
        )}

        {/* ── T3: SUMMARY — hidden when collapsed, smaller ── */}
        {!collapsed && (
          <Cluster title="Summary" tier={3} width="flex-[1.3]" last>
            <Stat label="Total Courts"  value={m.total}     size="sm" />
            <Stat label="Fees Settled"  value={m.settled}   accent="moss" size="sm" />
            <Stat label="Sidelined"     value={m.sidelined} size="sm" />
            <TopPerformerCard player={m.topPerformer} />
          </Cluster>
        )}

        {/* Collapse toggle — collapses T2 + T3 */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="w-8 shrink-0 flex items-center justify-center rule-left cursor-pointer text-bone-4 hover:text-bone transition-colors"
          title={collapsed ? "Expand metrics" : "Collapse to matchmaking"}
        >
          <span className={`transition-transform duration-200 ${collapsed ? "rotate-90" : "-rotate-90"}`}>
            ▾
          </span>
        </button>
      </div>

      {!collapsed && <Hairline />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

function Cluster({
  title,
  children,
  width,
  tier = 2,
  last,
}: {
  title: string;
  children: ReactNode;
  width: string;
  tier?: 1 | 2 | 3;
  last?: boolean;
}) {
  const bg         = tier === 1 ? "bg-neon-ghost" : "";
  const titleColor = tier === 1 ? "text-bone-3" : "text-bone-4";
  const py         = tier === 1 ? "py-4" : tier === 3 ? "py-3" : "py-3.5";

  return (
    <div className={`${width} flex flex-col px-6 ${py} ${!last ? "rule-right" : ""} ${bg}`}>
      <div className={`font-mono text-[9px] uppercase tracking-[0.28em] ${titleColor} mb-2.5`}>
        {title}
      </div>
      <div className="flex items-end justify-between flex-1">
        {children}
      </div>
    </div>
  );
}

type Accent = "default" | "neon" | "alert" | "moss" | "cold" | "mute";

function Stat({
  label,
  value,
  accent = "default",
  size = "md",
}: {
  label: string;
  value: number;
  accent?: Accent;
  size?: "lg" | "md" | "sm";
}) {
  const color =
    accent === "neon"  ? "text-neon"
    : accent === "alert" ? "text-alert"
    : accent === "moss"  ? "text-moss"
    : accent === "cold"  ? "text-cold"
    : accent === "mute"  ? "text-bone-3"
    : "text-bone";

  const numSize =
    size === "lg" ? "text-[42px]"
    : size === "sm" ? "text-[26px]"
    : "text-[34px]";

  return (
    <div className="flex flex-col items-center text-center">
      <div className={`big-number digit ${numSize} leading-[0.85] ${color}`}>
        {String(value).padStart(2, "0")}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4 mt-1.5">
        {label}
      </div>
    </div>
  );
}

function PriorityCard({
  player,
  ms,
  isRed,
  isAmber,
}: {
  player?: { name: string };
  ms: number;
  isRed: boolean;
  isAmber: boolean;
}) {
  const color = isRed ? "text-alert" : isAmber ? "text-cold" : "text-bone";

  return (
    <div className="flex flex-col items-center text-center border-l-[0.5px] border-hairline-2 pl-5">
      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-bone-4 mb-1.5">
        Priority
      </div>
      {player ? (
        <>
          <div className={`big-number digit text-[28px] leading-none ${color}`}>
            {formatDuration(ms)}
          </div>
          <div className="font-display italic text-[12px] text-bone-2 mt-1 truncate max-w-[90px]">
            {player.name}
          </div>
        </>
      ) : (
        <>
          <div className="big-number digit text-[28px] leading-none text-bone-3">--:--</div>
          <div className="font-mono text-[9px] text-bone-4 mt-1 tracking-[0.2em] uppercase">None</div>
        </>
      )}
    </div>
  );
}

function TopPerformerCard({
  player,
}: {
  player?: { name: string; wins: number; gamesPlayed: number };
}) {
  return (
    <div className="flex flex-col items-center text-center border-l-[0.5px] border-hairline-2 pl-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-bone-4 mb-1.5">
        Top
      </div>
      {player ? (
        <>
          <div className="statement text-[18px] leading-tight truncate max-w-[80px]">
            {player.name}
          </div>
          <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-bone-3 mt-1">
            <span className="digit text-neon">
              {Math.round((player.wins / player.gamesPlayed) * 100)}%
            </span>
            <span className="text-bone-4"> · </span>
            <span className="digit">{player.gamesPlayed}g</span>
          </div>
        </>
      ) : (
        <>
          <div className="statement text-[18px] text-bone-3">—</div>
          <div className="font-mono text-[9px] text-bone-4 mt-1 tracking-[0.18em] uppercase">
            No data
          </div>
        </>
      )}
    </div>
  );
}
