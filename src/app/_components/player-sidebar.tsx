"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { useStore } from "@/lib/store";
import {
  GENDER_LABEL,
  LEVEL_FULL_LABEL,
  type Level,
  type Player,
} from "@/lib/types";
import { Button, Chip, Rule, ThickRule } from "./ui";
import { AddPlayerDialog } from "./dialogs";

export function PlayerSidebar() {
  const { session, togglePaid, setStatus, removePlayer } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [tick, setTick] = useState(() => Date.now());

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

  const { active, resting } = useMemo(() => {
    const sorted = [...session.players].sort((a, b) => {
      return (
        a.gamesPlayed - b.gamesPlayed ||
        a.waitingSince - b.waitingSince ||
        a.arrivedAt - b.arrivedAt
      );
    });

    return {
      active: sorted.filter(
        (p) => p.status === "playing" && !occupiedPlayerIds.has(p.id),
      ),
      resting: sorted.filter((p) => p.status !== "playing"),
    };
  }, [occupiedPlayerIds, session.players]);

  return (
    <aside className="flex flex-col min-h-[40vh] bg-paper-soft border-t-2 border-ink xl:h-full xl:border-t-0 xl:border-l-2">
      <header className="px-4 pt-4 pb-2 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-3">
            Sign-in
          </div>
          <h2 className="font-display text-[22px] leading-none tracking-tight mt-1">
            Players
          </h2>
        </div>
        <Button size="sm" variant="ink" onClick={() => setAddOpen(true)}>
          + Add
        </Button>
      </header>

      <ThickRule />

      <div className="flex items-center justify-between px-4 py-2 bg-accent/30">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
          Active
        </span>
        <span className="font-mono text-[10px] text-ink-3 digit">
          {active.length}
        </span>
      </div>
      <Rule />

      <ol className="flex-1 overflow-y-auto">
        {active.length === 0 ? (
          <EmptyActive />
        ) : (
          active.map((p, i) => (
            <PlayerRow
              key={p.id}
              player={p}
              index={i + 1}
              tick={tick}
              onCourt={false}
              onBench={() => setStatus(p.id, "break")}
              onDone={() => setStatus(p.id, "done")}
              onRemove={() => removePlayer(p.id)}
              onTogglePaid={() => togglePaid(p.id)}
              draggable
            />
          ))
        )}
      </ol>

      <div className="flex items-center justify-between px-4 py-2 hatch border-t-2 border-ink">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
          Done / Break
        </span>
        <span className="font-mono text-[10px] text-ink-3 digit">
          {resting.length}
        </span>
      </div>
      <Rule />
      <ol className="max-h-[34vh] overflow-y-auto">
        {resting.map((p, i) => (
          <PlayerRow
            key={p.id}
            player={p}
            index={i + 1}
            tick={tick}
            onCourt={false}
            onBench={() => setStatus(p.id, "break")}
            onDone={() => setStatus(p.id, "done")}
            onRemove={() => removePlayer(p.id)}
            onTogglePaid={() => togglePaid(p.id)}
            onResume={() => setStatus(p.id, "playing")}
            resting
          />
        ))}
      </ol>

      <AddPlayerDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </aside>
  );
}

function EmptyActive() {
  return (
    <li className="px-4 py-10 text-center">
      <div className="font-display italic text-ink-3 text-lg">
        No one signed in yet
      </div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3 mt-2">
        Add a player to get the session going
      </p>
    </li>
  );
}

function PlayerRow({
  player,
  index,
  onBench,
  onDone,
  onRemove,
  onTogglePaid,
  onResume,
  onCourt,
  tick,
  draggable,
  resting,
}: {
  player: Player;
  index: number;
  onBench: () => void;
  onDone: () => void;
  onRemove: () => void;
  onTogglePaid: () => void;
  onResume?: () => void;
  onCourt: boolean;
  tick: number;
  draggable?: boolean;
  resting?: boolean;
}) {
  const handleDragStart = (e: DragEvent<HTMLLIElement>) => {
    e.dataTransfer.setData("text/player-id", player.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const isDone = player.status === "done";
  const waitingLabel =
    player.status === "playing" && !onCourt
      ? `${formatDuration(tick - player.waitingSince)} idle`
      : onCourt
        ? "on court"
        : player.status === "break"
          ? "on break"
          : "done";

  return (
    <li
      draggable={draggable}
      onDragStart={handleDragStart}
      className={`group relative px-4 py-2.5 border-b border-rule hover:bg-paper transition-colors ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="font-mono digit text-[9px] tracking-widest text-ink-3 pt-1 w-4 text-right">
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 pr-4">
            <span className="font-display font-medium text-[16px] leading-tight text-ink">
              {player.name}
            </span>
            <Chip tone={levelTone(player.level)} className="text-[9px] px-1.5 py-0.5">
              {LEVEL_FULL_LABEL[player.level]}
            </Chip>
            <Chip
              tone={player.gender === "male" ? "male" : "female"}
              className="text-[9px] px-1.5 py-0.5"
            >
              {GENDER_LABEL[player.gender]}
            </Chip>
          </div>
          <div className="mt-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-2">
            <span>
              <span className="digit">{player.gamesPlayed}</span> games
            </span>
            <span className="text-rule-strong/40">·</span>
            <span className="digit">
              {player.wins}
              <span className="text-ink-2">w</span>/{player.losses}
              <span className="text-ink-2">l</span>
            </span>
            <span className="text-rule-strong/40">·</span>
            <span>{waitingLabel}</span>
          </div>
          {isDone ? (
            <button
              onClick={onTogglePaid}
              className={`mt-1.5 w-full flex items-center justify-between border-l-2 pl-2 pr-2 py-1 cursor-pointer transition-colors ${
                player.paid
                  ? "border-moss bg-moss-soft/60 hover:bg-moss-soft"
                  : "border-clay bg-clay-soft/60 hover:bg-clay-soft"
              }`}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                {player.paid ? "Paid" : "Unpaid"}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-ink-3">
                tap to toggle
              </span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {resting ? (
          <button
            onClick={onResume}
            className="font-mono text-[9px] uppercase tracking-widest text-ink-2 hover:text-ink px-1 py-0.5 cursor-pointer"
          >
            Resume
          </button>
        ) : (
          <>
            <button
              onClick={onBench}
              className="font-mono text-[9px] uppercase tracking-widest text-ink-2 hover:text-ink px-1 py-0.5 cursor-pointer"
            >
              Break
            </button>
            <button
              onClick={onDone}
              className="font-mono text-[9px] uppercase tracking-widest text-ink-2 hover:text-ink px-1 py-0.5 cursor-pointer"
            >
              Done
            </button>
          </>
        )}
        <button
          onClick={onRemove}
          className="font-mono text-[9px] uppercase tracking-widest text-ink-3 hover:text-clay px-1 py-0.5 cursor-pointer ml-auto"
        >
          Remove
        </button>
      </div>

      <div className="absolute top-0 right-0 flex items-center gap-0.5 px-2 pt-2">
        {player.status === "playing" ? (
          <span
            title={onCourt ? "On court" : "Waiting"}
            className={`w-1.5 h-1.5 rounded-full ${
              onCourt ? "bg-accent" : "bg-accent-deep"
            }`}
          />
        ) : null}
        {isDone ? (
          <span
            title={player.paid ? "Paid" : "Unpaid"}
            className={`w-1.5 h-1.5 rounded-full ${
              player.paid ? "bg-moss" : "bg-clay"
            }`}
          />
        ) : null}
      </div>
    </li>
  );
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function levelTone(level: Level) {
  return `level-${level}` as const;
}
