"use client";

import { useState, type DragEvent, type ReactNode } from "react";
import type { PlayerStatus } from "@/lib/types";
import { useStore } from "@/lib/store";


/** Shared section chrome: eyebrow, big count, collapse chevron, drop zone.
 *  Accepts a player drop that re-assigns to the target status. */
export function SectionShell({
  eyebrow,
  title,
  count,
  accent,
  collapsed,
  onToggleCollapse,
  dropTarget,
  children,
  emptyState,
  className = "",
  height = "auto",
}: {
  eyebrow: string;
  title: string;
  count: number;
  accent: "idle" | "break" | "done";
  collapsed: boolean;
  onToggleCollapse: () => void;
  dropTarget: PlayerStatus;
  children: ReactNode;
  emptyState: ReactNode;
  className?: string;
  height?: "flex" | "auto";
}) {
  const setStatus = useStore((s) => s.setStatus);
  const dumpQueueToIdle = useStore((s) => s.dumpQueueToIdle);
  const [over, setOver] = useState(false);

  const accentClass =
    accent === "idle" ? "text-bone" : accent === "break" ? "text-cold" : "text-bone-2";

  const dotClass =
    accent === "idle" ? "bg-bone" : accent === "break" ? "bg-cold" : "bg-bone-3";

  const handleDragOver = (e: DragEvent) => {
    const hasPlayer = e.dataTransfer.types.includes("text/player-id");
    const hasQueue = dropTarget === "idle" && e.dataTransfer.types.includes("text/queue-id");
    if (!hasPlayer && !hasQueue) return;
    e.preventDefault();
    setOver(true);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const playerId = e.dataTransfer.getData("text/player-id");
    if (playerId) { setStatus(playerId, dropTarget); return; }
    const queueId = e.dataTransfer.getData("text/queue-id");
    if (queueId && dropTarget === "idle") dumpQueueToIdle(queueId);
  };

  return (
    <section
      className={`
        relative flex flex-col min-h-0
        ${height === "flex" ? "flex-1" : ""}
        ${accent === "done" ? "hatch" : ""}
        ${className}
      `}
      data-drop={over ? "over" : undefined}
      onDragOver={handleDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
    >
      {/* Section header — editorial: eyebrow, massive count, chevron */}
      <header className="shrink-0 relative rule-bottom">
        <button
          onClick={onToggleCollapse}
          className="w-full text-left px-4 pt-3 pb-2.5 flex items-end justify-between gap-2 cursor-pointer group"
        >
          <div className="flex items-end gap-2 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass} mb-1.5`} aria-hidden />
            <div className="min-w-0">
              <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-bone-4 leading-none">
                {eyebrow}
              </div>
              <div className={`statement text-[22px] mt-1.5 leading-[0.85] ${accentClass}`}>
                {title}
              </div>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <span className="big-number digit text-[22px] text-bone-3 group-hover:text-bone transition-colors">
              {String(count).padStart(2, "0")}
            </span>
            <span
              className={`
                font-mono text-[10px] text-bone-3 group-hover:text-bone
                transition-transform duration-200 ease-out mb-1
                ${collapsed ? "-rotate-90" : "rotate-0"}
              `}
              aria-hidden
            >
              ▾
            </span>
          </div>
        </button>
      </header>

      {/* Content */}
      {!collapsed ? (
        <div
          className={`
            flex-1 min-h-0 overflow-y-auto
            ${over ? "bg-neon-soft" : ""}
          `}
        >
          {count === 0 ? (
            <div className="px-4 py-8 flex items-center justify-center text-center">
              {emptyState}
            </div>
          ) : (
            children
          )}
        </div>
      ) : null}
    </section>
  );
}
