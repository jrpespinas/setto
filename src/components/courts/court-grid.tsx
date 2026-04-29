"use client";

import { useMemo } from "react";
import { useStore, selectors } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/chip";
import { CourtCard } from "./court-card";

export function CourtGrid({ onAddCourt }: { onAddCourt: () => void }) {
  const session = useStore((s) => s.session);
  const playersById = useMemo(() => selectors.byId(session), [session]);
  const courts = useMemo(
    () => [...session.courts].sort((a, b) => a.number - b.number),
    [session.courts],
  );

  if (courts.length === 0) return <EmptyCourts onAdd={onAddCourt} />;

  return (
    <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(380px,1fr))]">
      {courts.map((c, i) => (
        <CourtCard
          key={c.id}
          court={c}
          playersById={playersById}
          revealIndex={i}
        />
      ))}
    </div>
  );
}

function EmptyCourts({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-start max-w-[520px] reveal">
      <Eyebrow>Empty hall</Eyebrow>
      <h3 className="statement text-[56px] mt-3">
        No courts yet.
        <br />
        Add one to <span className="text-neon">open the floor.</span>
      </h3>
      <Button variant="solid" className="mt-6" onClick={onAdd}>
        + Add first court
      </Button>
    </div>
  );
}
