"use client";

import type { Player } from "@/lib/types";
import { SectionShell } from "./section-shell";
import { PlayerCard } from "./player-card";

export function IdleSection({
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
      title="Waiting"
      count={players.length}
      accent="idle"
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      dropTarget="idle"
      emptyState={
        <EmptyState
          message="No one is waiting."
          hint="Sign in a player, or drag a player here from Resting or Finished."
        />
      }
    >
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
    </SectionShell>
  );
}

function EmptyState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="max-w-[200px] mx-auto py-4 border-[0.5px] border-dashed border-hairline-3 px-3">
      <div className="font-display italic text-bone-2 text-sm leading-snug">
        {message}
      </div>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4 mt-2 leading-relaxed">
        {hint}
      </p>
    </div>
  );
}
