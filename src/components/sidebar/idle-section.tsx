"use client";

import { useMemo } from "react";
import { LEVEL_LABEL, LEVELS, type Level, type Player } from "@/lib/types";
import { SectionShell } from "./section-shell";
import { PlayerCard } from "./player-card";

export function IdleSection({
  players,
  tick,
  collapsed,
  onToggleCollapse,
  onEdit,
  groupByLevel,
  onToggleGroup,
}: {
  players: Player[];
  tick: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: (p: Player) => void;
  groupByLevel: boolean;
  onToggleGroup: () => void;
}) {
  const groups = useMemo(() => {
    if (!groupByLevel) return null;
    const map: Partial<Record<Level, Player[]>> = {};
    for (const p of players) {
      (map[p.level] ??= []).push(p);
    }
    return [...LEVELS].reverse()
      .map((lv) => ({ level: lv, players: map[lv] ?? [] }))
      .filter((g) => g.players.length > 0);
  }, [players, groupByLevel]);

  const toggleEl = (
    <button
      onClick={onToggleGroup}
      className={`font-mono text-[8px] uppercase tracking-[0.2em] px-1.5 py-0.5 border-[0.5px] cursor-pointer transition-colors
        ${groupByLevel
          ? "border-bone text-bone"
          : "border-hairline-2 text-bone-4 hover:border-bone-3 hover:text-bone-3"
        }`}
    >
      Group by level
    </button>
  );

  return (
    <SectionShell
      title="Waiting"
      count={players.length}
      accent="idle"
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      dropTarget="idle"
      headerExtra={toggleEl}
      emptyState={
        <EmptyState
          message="No one is waiting."
          hint="Sign in a player, or drag a player here from Resting or Finished."
        />
      }
    >
      {groupByLevel && groups ? (
        groups.map(({ level, players: group }, gi) => (
          <div key={level}>
            <div className={`px-4 py-1.5 flex items-center gap-2 bg-ink-050 ${gi > 0 ? "rule-top" : ""}`}>
              <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-bone-4">
                {LEVEL_LABEL[level]}
              </span>
              <span className="font-mono text-[8px] text-bone-4 opacity-60">{group.length}</span>
            </div>
            <ol>
              {group.map((p, i) => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  index={i + 1}
                  tick={tick}
                  variant="idle"
                  onEdit={() => onEdit(p)}
                />
              ))}
            </ol>
          </div>
        ))
      ) : (
        <ol>
          {players.map((p, i) => (
            <PlayerCard
              key={p.id}
              player={p}
              index={i + 1}
              tick={tick}
              variant="idle"
              onEdit={() => onEdit(p)}
            />
          ))}
        </ol>
      )}
    </SectionShell>
  );
}

function EmptyState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="max-w-[200px] mx-auto py-4 border-[0.5px] border-dashed border-hairline-3 px-3">
      <div className="font-display italic text-bone-2 text-sm leading-snug">{message}</div>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4 mt-2 leading-relaxed">
        {hint}
      </p>
    </div>
  );
}
