"use client";

import type { Player } from "@/lib/types";
import { SectionShell } from "./section-shell";
import { PlayerCard } from "./player-card";

export function BreakSection({
  players,
  tick,
  collapsed,
  onToggleCollapse,
  onEdit,
}: {
  players: Player[];
  tick: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: (p: Player) => void;
}) {
  return (
    <SectionShell
      eyebrow="02 · Resting"
      title="Break"
      count={players.length}
      accent="break"
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      dropTarget="break"
      className="max-h-[28vh]"
      emptyState={
        <div className="max-w-[200px] mx-auto py-4 border-[0.5px] border-dashed border-cold/40 px-3">
          <div className="font-display italic text-cold text-sm leading-snug">
            No one resting.
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4 mt-2">
            Drag a player here to pause their timer.
          </p>
        </div>
      }
    >
      <ol>
        {players.map((p, i) => (
          <PlayerCard
            key={p.id}
            player={p}
            index={i + 1}
            tick={tick}
            variant="break"
            onEdit={() => onEdit(p)}
          />
        ))}
      </ol>
    </SectionShell>
  );
}
