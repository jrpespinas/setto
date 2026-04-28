"use client";

import { useMemo, useState } from "react";
import { Mars, Venus, X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { LEVEL_LABEL, LEVELS, type Level, type Player } from "@/lib/types";
import { formatShortDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";

export function CourtPlayerPicker({
  open,
  courtId,
  courtNumber,
  courtSize,
  tick,
  onClose,
}: {
  open: boolean;
  courtId: string;
  courtNumber: number;
  courtSize: number;
  tick: number;
  onClose: () => void;
}) {
  const session = useStore((s) => s.session);
  const bulkAssignToCourt = useStore((s) => s.bulkAssignToCourt);

  const half = courtSize / 2;

  const [sideA, setSideA] = useState<(string | null)[]>(Array(half).fill(null));
  const [sideB, setSideB] = useState<(string | null)[]>(Array(half).fill(null));
  const [levelFilter, setLevelFilter] = useState<Level | "all">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");

  const playersById = useMemo(
    () => Object.fromEntries(session.players.map((p) => [p.id, p])),
    [session.players],
  );

  const selectedIds = new Set([...sideA, ...sideB].filter(Boolean) as string[]);
  const sideAFull = sideA.every(Boolean);
  const sideBFull = sideB.every(Boolean);
  const canConfirm = sideA.some(Boolean) && sideB.some(Boolean);

  const available = useMemo(() => {
    return session.players
      .filter((p) => p.status === "idle" || p.status === "waiting")
      .filter((p) => !selectedIds.has(p.id))
      .filter((p) => levelFilter === "all" || p.level === levelFilter)
      .filter((p) => genderFilter === "all" || p.gender === genderFilter)
      .sort(
        (a, b) =>
          (a.gamesPlayed ?? 0) - (b.gamesPlayed ?? 0) ||
          a.statusSince - b.statusSince ||
          a.arrivedAt - b.arrivedAt,
      );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.players, levelFilter, genderFilter, sideA, sideB]);

  const reset = () => {
    setSideA(Array(half).fill(null));
    setSideB(Array(half).fill(null));
    setLevelFilter("all");
    setGenderFilter("all");
  };

  const handleClose = () => { reset(); onClose(); };

  const addToSide = (playerId: string, side: "A" | "B") => {
    if (side === "A") {
      const idx = sideA.findIndex((s) => s === null);
      if (idx === -1) return;
      setSideA((prev) => prev.map((s, i) => (i === idx ? playerId : s)));
    } else {
      const idx = sideB.findIndex((s) => s === null);
      if (idx === -1) return;
      setSideB((prev) => prev.map((s, i) => (i === idx ? playerId : s)));
    }
  };

  const removeFromSide = (playerId: string) => {
    setSideA((prev) => prev.map((s) => (s === playerId ? null : s)));
    setSideB((prev) => prev.map((s) => (s === playerId ? null : s)));
  };

  const handleNext = () => {
    const top = session.players
      .filter((p) => p.status === "idle" || p.status === "waiting")
      .sort(
        (a, b) =>
          (a.gamesPlayed ?? 0) - (b.gamesPlayed ?? 0) ||
          a.statusSince - b.statusSince ||
          a.arrivedAt - b.arrivedAt,
      )
      .slice(0, courtSize);

    const newA: (string | null)[] = Array(half).fill(null);
    const newB: (string | null)[] = Array(half).fill(null);
    top.forEach((p, i) => {
      if (i < half) newA[i] = p.id;
      else newB[i - half] = p.id;
    });
    setSideA(newA);
    setSideB(newB);
  };

  const handleConfirm = () => {
    const prev = useStore.getState().session;
    bulkAssignToCourt(
      courtId,
      sideA.filter(Boolean) as string[],
      sideB.filter(Boolean) as string[],
    );
    toast(`Players assigned to Court ${String(courtNumber).padStart(2, "0")}`, {
      action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
    });
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      eyebrow={`Court ${String(courtNumber).padStart(2, "0")} · ${courtSize === 2 ? "Singles" : "Doubles"}`}
      title="Add players"
    >
      <div className="space-y-4">

        {/* Side preview */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
          <PickerSide label="A" slots={sideA} playersById={playersById} onRemove={removeFromSide} />
          <div className="flex items-center font-display italic text-bone-4 text-[11px] pt-5">vs</div>
          <PickerSide label="B" slots={sideB} playersById={playersById} onRemove={removeFromSide} />
        </div>

        {/* Filters */}
        <div className="space-y-2 pt-1 border-t-[0.5px] border-hairline-2">
          <div className="flex flex-wrap gap-1 pt-2">
            {(["all", ...LEVELS] as (Level | "all")[]).map((lv) => (
              <FilterChip
                key={lv}
                active={levelFilter === lv}
                onClick={() => setLevelFilter(lv)}
              >
                {lv === "all" ? "All levels" : LEVEL_LABEL[lv]}
              </FilterChip>
            ))}
          </div>
          <div className="flex gap-1">
            {(["all", "male", "female"] as const).map((g) => (
              <FilterChip
                key={g}
                active={genderFilter === g}
                onClick={() => setGenderFilter(g)}
              >
                {g === "all" ? "All" : g === "male" ? "Male" : "Female"}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Player list */}
        <div className="border-[0.5px] border-hairline-2 overflow-y-auto max-h-[200px]">
          {available.length === 0 ? (
            <div className="px-4 py-6 font-mono text-[9px] uppercase tracking-[0.2em] text-bone-4 text-center">
              No players available
            </div>
          ) : (
            available.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 h-[40px] rule-bottom last:border-0 hover:bg-neon-ghost transition-colors"
              >
                <span className="font-mono digit text-[10px] tracking-[0.14em] text-bone-4 w-4 text-right shrink-0">
                  {i + 1}
                </span>
                {p.gender === "male"
                  ? <Mars size={12} className="g-male shrink-0" strokeWidth={2} aria-hidden />
                  : <Venus size={12} className="g-female shrink-0" strokeWidth={2} aria-hidden />
                }
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="font-display font-semibold text-[15px] leading-[1.1] text-bone truncate">
                    {p.name}
                  </span>
                  <Chip tone={`level-${p.level}`} className="font-bold text-[8px] px-1 py-[2px] shrink-0">
                    {LEVEL_LABEL[p.level]}
                  </Chip>
                </div>
                {(p.gamesPlayed ?? 0) > 0 && (
                  <span className="font-mono text-[9px] tracking-[0.1em] text-bone-4 shrink-0">
                    {p.gamesPlayed}g
                  </span>
                )}
                <span className="font-mono digit text-[11px] tracking-[0.1em] text-bone-3 shrink-0">
                  {formatShortDuration(tick - p.statusSince)}
                </span>
                <div className="flex gap-1 shrink-0">
                  <SideBtn label="A" disabled={sideAFull} onClick={() => addToSide(p.id, "A")} />
                  <SideBtn label="B" disabled={sideBFull} onClick={() => addToSide(p.id, "B")} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t-[0.5px] border-hairline-2">
          <button
            onClick={handleNext}
            className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4 hover:text-bone px-2 py-1 border-[0.5px] border-hairline-2 hover:border-bone-3 cursor-pointer transition-colors"
          >
            Next {courtSize}
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button
              variant={canConfirm ? "solid" : "outline"}
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>

      </div>
    </Dialog>
  );
}

function PickerSide({
  label,
  slots,
  playersById,
  onRemove,
}: {
  label: string;
  slots: (string | null)[];
  playersById: Record<string, Player>;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4">
        Side {label}
      </div>
      {slots.map((id, i) => (
        <div
          key={i}
          className={`h-[32px] border-[0.5px] flex items-center px-2.5 gap-2
            ${id ? "border-hairline-2 bg-ink-050" : "border-dashed border-hairline-3"}`}
        >
          {id && playersById[id] ? (
            <>
              <span className="font-display font-semibold text-[13px] text-bone flex-1 min-w-0 truncate">
                {playersById[id].name}
              </span>
              <button
                onClick={() => onRemove(id)}
                className="shrink-0 text-bone-4 hover:text-alert cursor-pointer flex items-center"
                aria-label="Remove"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone-4">Empty</span>
          )}
        </div>
      ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[8px] uppercase tracking-[0.18em] px-2 py-1 border-[0.5px] cursor-pointer transition-colors
        ${active
          ? "border-bone bg-bone text-ink-000"
          : "border-hairline-2 text-bone-4 hover:border-bone-3 hover:text-bone-3"
        }`}
    >
      {children}
    </button>
  );
}

function SideBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="font-mono text-[9px] uppercase tracking-[0.18em] w-7 py-1 border-[0.5px] cursor-pointer transition-colors
        disabled:opacity-30 disabled:cursor-not-allowed
        border-hairline-2 text-bone-4
        hover:border-neon/60 hover:text-neon
        disabled:hover:border-hairline-2 disabled:hover:text-bone-4"
    >
      {label}
    </button>
  );
}
