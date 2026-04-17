"use client";

import type { Player } from "@/lib/types";
import { SectionShell } from "./section-shell";
import { PlayerCard } from "./player-card";

export function DoneSection({
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
      title="Finished"
      count={players.length}
      accent="done"
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      dropTarget="done"
      emptyState={
        <div className="max-w-[200px] mx-auto py-4 border-[0.5px] border-dashed border-hairline-3 px-3">
          <div className="font-display italic text-bone-3 text-sm leading-snug">
            No one finished yet.
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4 mt-2">
            Players leaving the session land here with payment status.
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
            variant="done"
            onEdit={() => onEdit(p)}
          />
        ))}
      </ol>
    </SectionShell>
  );
}
