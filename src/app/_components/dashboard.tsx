"use client";

import { useEffect, useMemo, useState } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { CourtCard } from "./court-card";
import { PlayerSidebar } from "./player-sidebar";
import { AddCourtDialog } from "./dialogs";
import { Button } from "./ui";
import { courtStatus } from "@/lib/types";

export function Dashboard() {
  return (
    <StoreProvider>
      <DashboardInner />
    </StoreProvider>
  );
}

function DashboardInner() {
  const { session, ready } = useStore();
  const [addCourt, setAddCourt] = useState(false);
  const [tick, setTick] = useState(() => Date.now());

  const playersById = useMemo(
    () => Object.fromEntries(session.players.map((p) => [p.id, p])),
    [session.players],
  );

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const occupiedPlayerIds = useMemo(
    () =>
      new Set(
        session.courts.flatMap((court) => court.slots.filter(Boolean) as string[]),
      ),
    [session.courts],
  );

  const ongoingCount = session.courts.filter(
    (c) => courtStatus(c, playersById) === "ongoing",
  ).length;

  const activePlayers = session.players.filter(
    (player) => player.status === "playing",
  );
  const breakPlayers = session.players.filter((player) => player.status === "break");
  const donePlayers = session.players.filter((player) => player.status === "done");
  const paidPlayers = session.players.filter((player) => player.paid);
  const unpaidPlayers = session.players.filter((player) => !player.paid);
  const waitingPlayers = activePlayers.filter(
    (player) => !occupiedPlayerIds.has(player.id),
  );
  const longestWaitingPlayer = [...waitingPlayers].sort(
    (a, b) => a.waitingSince - b.waitingSince || a.arrivedAt - b.arrivedAt,
  )[0];
  const longestWaitMs = longestWaitingPlayer
    ? tick - longestWaitingPlayer.waitingSince
    : 0;

  const [sessionStamp, setSessionStamp] = useState("");
  useEffect(() => {
    const updateStamp = () => {
      setSessionStamp(
        new Date().toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      );
    };

    updateStamp();
    const id = window.setInterval(updateStamp, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex-1 grid min-h-screen xl:grid-cols-[minmax(0,1fr)_312px]">
      <main className="flex flex-col min-w-0">
        <header className="border-b-2 border-ink bg-paper-soft">
          <div className="px-6 py-4 md:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-3">
                <h1 className="font-sans font-medium text-[42px] leading-[0.88] tracking-[-0.04em] lowercase md:text-[52px]">
                  setto
                </h1>
                <div className="pb-1">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-3">
                    Session
                  </div>
                  <div className="font-display italic text-sm leading-tight md:text-base">
                    {sessionStamp}
                  </div>
                </div>
              </div>
              <Button variant="ink" size="sm" onClick={() => setAddCourt(true)}>
                + Court
              </Button>
            </div>
          </div>

          <section className="grid gap-px border-t border-ink/15 bg-rule/60 md:grid-cols-2 xl:grid-cols-4">
            <CompactMetricCard
              title="Courts"
              items={[
                { label: "Total", value: session.courts.length },
                { label: "Ongoing", value: ongoingCount },
                { label: "Vacant", value: session.courts.length - ongoingCount },
              ]}
            />
            <CompactMetricCard
              title="Players"
              items={[
                { label: "Signed in", value: session.players.length },
                { label: "Active", value: activePlayers.length },
                {
                  label: "Break / Done",
                  value: `${breakPlayers.length}/${donePlayers.length}`,
                },
              ]}
            />
            <CompactMetricCard
              title="Payment"
              items={[
                { label: "Paid", value: paidPlayers.length },
                { label: "Unpaid", value: unpaidPlayers.length },
                { label: "Waiting", value: waitingPlayers.length },
              ]}
            />
            <CompactMetricCard
              title="Longest Idle"
              items={[
                { label: "Player", value: longestWaitingPlayer?.name ?? "None" },
                {
                  label: "Time",
                  value: longestWaitingPlayer
                    ? formatDuration(longestWaitMs)
                    : "--:--",
                },
              ]}
            />
          </section>
        </header>

        <section className="flex-1 bg-paper p-5 md:p-6 xl:p-8">
          {!ready ? (
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Loading…
            </div>
          ) : session.courts.length === 0 ? (
            <EmptyCourts onAdd={() => setAddCourt(true)} />
          ) : (
            <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(380px,1fr))]">
              {session.courts
                .sort((a, b) => a.number - b.number)
                .map((c) => (
                  <CourtCard key={c.id} court={c} playersById={playersById} />
                ))}
            </div>
          )}
        </section>

        <footer className="px-6 py-3 md:px-8 border-t border-rule flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-3">
            No database · State kept in your browser
          </span>
          <span className="font-display italic text-sm text-ink-3">
            game · set · match
          </span>
        </footer>
      </main>

      <PlayerSidebar />
      <AddCourtDialog open={addCourt} onClose={() => setAddCourt(false)} />
    </div>
  );
}

function CompactMetricCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number | string }[];
}) {
  return (
    <article className="bg-paper-soft px-4 py-3 md:px-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-3">
        {title}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 items-start">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 self-start">
            <div className="font-display digit text-[26px] leading-none tracking-tight">
              {typeof item.value === "number"
                ? String(item.value).padStart(2, "0")
                : item.value}
            </div>
            <div className="mt-2 min-h-[2.4em] font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function EmptyCourts({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-start max-w-md">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-3">
        Empty hall
      </div>
      <h3 className="font-display text-3xl leading-tight mt-2">
        No courts set up — add your first one to start the session.
      </h3>
      <Button variant="ink" className="mt-5" onClick={onAdd}>
        + Add a court
      </Button>
    </div>
  );
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
