"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore, selectors } from "@/lib/store";
import type { Player } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/chip";
import { AddPlayerDialog } from "@/components/dialogs/add-player-dialog";
import { EditPlayerDialog } from "@/components/dialogs/edit-player-dialog";
import { IdleSection } from "./idle-section";
import { BreakSection } from "./break-section";
import { DoneSection } from "./done-section";

type SectionKey = "idle" | "break" | "done";

/** The 15% rail. Three editorial sections — Idle / Break / Done —
 *  each with its own counter, collapse toggle, and drag-target behavior. */
export function PlayerSidebar() {
  const session = useStore((s) => s.session);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    idle: false,
    break: false,
    done: false,
  });
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { idle, breakList, done } = useMemo(() => {
    const filter = (ps: Player[]) =>
      query.trim()
        ? ps.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
        : ps;

    // Idle: fewest games first, then longest wait.
    const idleSorted = [...selectors.idle(session)].sort(
      (a, b) =>
        a.gamesPlayed - b.gamesPlayed ||
        a.statusSince - b.statusSince ||
        a.arrivedAt - b.arrivedAt,
    );
    const breakSorted = [...selectors.breakList(session)].sort(
      (a, b) => a.statusSince - b.statusSince,
    );
    const doneSorted = [...selectors.done(session)].sort(
      (a, b) => Number(a.paid) - Number(b.paid),
    );

    return {
      idle: filter(idleSorted),
      breakList: filter(breakSorted),
      done: filter(doneSorted),
    };
  }, [session, query]);

  const total = session.players.length;

  return (
    <aside
      className="
        relative flex min-h-0 flex-col
        bg-ink-050 rule-left
        slide-in
        xl:h-full xl:overflow-hidden
      "
    >
      {/* Masthead ------------------------------------------------------- */}
      <header className="shrink-0 px-4 pt-5 pb-3 rule-bottom">
        <div className="flex items-baseline justify-between">
          <div>
            <Eyebrow>Roster</Eyebrow>
            <h2 className="statement text-[32px] mt-1 leading-none">
              Players
            </h2>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-bone-4">
              Signed-in
            </div>
            <div className="big-number digit text-[26px] mt-0.5">
              {String(total).padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-stretch gap-2">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter name"
              className="w-full h-8 bg-transparent border-[0.5px] border-hairline-2 px-2.5 pr-7 font-mono text-[11px] text-bone placeholder:text-bone-4 outline-none focus:border-bone"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-bone-4 hover:text-bone cursor-pointer"
              >
                ×
              </button>
            ) : (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[9px] text-bone-4 tracking-[0.2em] uppercase">
                /
              </span>
            )}
          </div>
          <Button variant="neon" size="sm" onClick={() => setAddOpen(true)}>
            + Add
          </Button>
        </div>
      </header>

      {/* Sections ------------------------------------------------------- */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <IdleSection
          players={idle}
          tick={tick}
          collapsed={collapsed.idle}
          onToggleCollapse={() =>
            setCollapsed((c) => ({ ...c, idle: !c.idle }))
          }
          onEdit={setEditing}
        />
        <BreakSection
          players={breakList}
          tick={tick}
          collapsed={collapsed.break}
          onToggleCollapse={() =>
            setCollapsed((c) => ({ ...c, break: !c.break }))
          }
          onEdit={setEditing}
        />
        <DoneSection
          players={done}
          tick={tick}
          collapsed={collapsed.done}
          onToggleCollapse={() =>
            setCollapsed((c) => ({ ...c, done: !c.done }))
          }
          onEdit={setEditing}
        />
      </div>

      <AddPlayerDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <EditPlayerDialog
        player={editing}
        onClose={() => setEditing(null)}
      />
    </aside>
  );
}
