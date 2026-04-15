"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore, selectors } from "@/lib/store";
import { LEVEL_RANK, type Player } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { Hairline } from "@/components/ui/chip";

/** Operational numbers at the top of the shell.
 *  Read-only. Updates every second. Visual-grouped into clusters. */
export function MetricBar() {
  const session = useStore((s) => s.session);
  const [collapsed, setCollapsed] = useState(false);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const metrics = useMemo(() => {
    const byId = selectors.byId(session);
    const occupied = selectors.occupiedOnCourts(session.courts);
    const ongoing = session.courts.filter((c) => {
      const half = c.size / 2;
      const a = c.slots.slice(0, half).filter((id) => id && byId[id]);
      const b = c.slots.slice(half).filter((id) => id && byId[id]);
      return a.length > 0 && b.length > 0;
    });

    const idle = selectors.idle(session);
    const waiting = selectors.waiting(session);
    const breakList = selectors.breakList(session);
    const done = selectors.done(session);
    const playing = session.players.filter(
      (p) => p.status === "playing" && occupied.has(p.id),
    );
    const paid = session.players.filter((p) => p.paid);
    const unpaid = session.players.filter((p) => !p.paid);

    // Longest idle
    const longestIdle = [...idle].sort(
      (a, b) => a.statusSince - b.statusSince || a.arrivedAt - b.arrivedAt,
    )[0];

    // Best player: win-rate > games played > level > earliest arrival
    const best = [...session.players]
      .filter((p) => p.gamesPlayed > 0)
      .sort((a, b) => {
        const rateA = a.wins / a.gamesPlayed;
        const rateB = b.wins / b.gamesPlayed;
        if (rateB !== rateA) return rateB - rateA;
        if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
        const lvl = LEVEL_RANK[b.level] - LEVEL_RANK[a.level];
        if (lvl !== 0) return lvl;
        return a.arrivedAt - b.arrivedAt;
      })[0];

    return {
      totalCourts: session.courts.length,
      ongoingCourts: ongoing.length,
      vacantCourts: session.courts.length - ongoing.length,
      playing: playing.length,
      idle: idle.length,
      waiting: waiting.length,
      breakList: breakList.length,
      done: done.length,
      paid: paid.length,
      unpaid: unpaid.length,
      longestIdle,
      best,
    };
  }, [session]);

  const longestMs = metrics.longestIdle ? tick - metrics.longestIdle.statusSince : 0;
  const longestIsHot = longestMs > 20 * 60 * 1000; // 20 min threshold

  return (
    <div className="shrink-0">
      <div className="flex items-stretch">
        {/* Cluster 1 — Courts */}
        <Cluster title="Courts" width="flex-1">
          <Stat label="Total"   value={metrics.totalCourts} />
          <Stat label="Ongoing" value={metrics.ongoingCourts} accent={metrics.ongoingCourts > 0 ? "neon" : "mute"} />
          <Stat label="Vacant"  value={metrics.vacantCourts} accent={metrics.vacantCourts === 0 ? "alert" : "neon"} />
        </Cluster>

        {/* Cluster 2 — Players */}
        <Cluster title="Players" width="flex-[1.6]">
          <Stat label="Playing" value={metrics.playing} accent={metrics.playing > 0 ? "neon" : "mute"} />
          <Stat label="Idle"    value={metrics.idle} />
          <Stat label="Waiting" value={metrics.waiting} accent={metrics.waiting > 0 ? "neon" : "mute"} />
          <Stat label="Break"   value={metrics.breakList} />
          <Stat label="Done"    value={metrics.done} />
        </Cluster>

        {/* Cluster 3 — Payments */}
        <Cluster title="Settled" width="flex-[0.65]">
          <Stat label="Paid"   value={metrics.paid} accent="moss" />
          <Stat label="Unpaid" value={metrics.unpaid} accent={metrics.unpaid > 0 ? "alert" : "mute"} />
        </Cluster>

        {/* Cluster 4 — Status (feature) */}
        <Cluster title="Status" width="flex-[1.4]" last>
          <StatusCard
            label="Longest idle"
            accent={longestIsHot ? "alert" : "mute"}
          >
            {metrics.longestIdle ? (
              <>
                <div className="big-number digit text-[30px] leading-none">
                  {formatDuration(longestMs)}
                </div>
                <div className="font-display italic text-[13px] text-bone-2 mt-1 truncate">
                  {metrics.longestIdle.name}
                </div>
              </>
            ) : (
              <>
                <div className="big-number digit text-[30px] leading-none text-bone-3">
                  --:--
                </div>
                <div className="font-mono text-[10px] text-bone-4 mt-1 tracking-[0.2em] uppercase">
                  No one idle
                </div>
              </>
            )}
          </StatusCard>

          <StatusCard label="Best" accent="neon">
            {metrics.best ? (
              <>
                <div className="statement text-[22px] truncate">
                  {metrics.best.name}
                </div>
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-bone-3 mt-1">
                  <span className="digit text-neon">
                    {Math.round((metrics.best.wins / metrics.best.gamesPlayed) * 100)}%
                  </span>
                  <span> · </span>
                  <span className="digit">{metrics.best.gamesPlayed}g</span>
                </div>
              </>
            ) : (
              <>
                <div className="statement text-[22px] text-bone-3">—</div>
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-bone-4 mt-1">
                  No matches yet
                </div>
              </>
            )}
          </StatusCard>
        </Cluster>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="w-8 shrink-0 flex items-center justify-center rule-left cursor-pointer text-bone-4 hover:text-bone transition-colors"
          title={collapsed ? "Expand metrics" : "Collapse metrics"}
        >
          <span className={`transition-transform duration-200 ${collapsed ? "rotate-0" : "rotate-180"}`}>
            ▾
          </span>
        </button>
      </div>
      {collapsed ? null : <Hairline />}
    </div>
  );
}

function Cluster({
  title,
  children,
  width,
  last,
}: {
  title: string;
  children: ReactNode;
  width: string;
  last?: boolean;
}) {
  return (
    <div
      className={`${width} flex flex-col px-5 py-3.5 ${!last ? "rule-right" : ""}`}
    >
      <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-bone-4 mb-2.5">
        {title}
      </div>
      <div className="flex items-end justify-between flex-1">
        {children}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: number;
  accent?: "default" | "neon" | "alert" | "moss" | "mute";
}) {
  const color =
    accent === "neon"
      ? "text-neon"
      : accent === "alert"
        ? "text-alert"
        : accent === "moss"
          ? "text-moss"
          : accent === "mute"
            ? "text-bone-3"
            : "text-bone";
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`big-number digit text-[34px] leading-[0.85] ${color}`}>
        {String(value).padStart(2, "0")}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4 mt-1.5">
        {label}
      </div>
    </div>
  );
}

function StatusCard({
  label,
  children,
  accent,
}: {
  label: string;
  children: ReactNode;
  accent: "neon" | "alert" | "mute";
}) {
  const border =
    accent === "neon"
      ? "border-neon/40"
      : accent === "alert"
        ? "border-alert/40"
        : "border-hairline-2";
  return (
    <div className={`flex-1 min-w-0 border-l-[0.5px] ${border} pl-3 py-1`}>
      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-bone-4 mb-1.5">
        {label}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
