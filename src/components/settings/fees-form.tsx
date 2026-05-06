"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useFeesStore } from "@/lib/store/fees";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { formatShortDuration } from "@/lib/format";

// ── Billing helper (mirrors store/index.ts) ────────────────────────────────

function billedHours(createdAtMs: number, endMs: number): number {
  const totalMinutes = Math.max(0, (endMs - createdAtMs) / 60_000);
  const fullHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (remainingMinutes === 0) return fullHours;
  if (remainingMinutes < 30) return fullHours + 0.5;
  return fullHours + 1;
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-bone-4 mb-3">
        {title}
      </p>
      <div className="border-[0.5px] border-hairline-2 p-5 bg-ink-050">
        {children}
      </div>
    </div>
  );
}

// ── Label row ──────────────────────────────────────────────────────────────

function LabelRow({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${last ? "" : "rule-bottom"}`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-bone-3">
        {label}
      </span>
      {children}
    </div>
  );
}

// ── Fee input ──────────────────────────────────────────────────────────────

const inputClass =
  "border-[0.5px] border-hairline-2 bg-ink-050 px-3 py-2 font-mono text-[13px] text-bone outline-none focus:border-bone-3 w-28";

// ── Main component ─────────────────────────────────────────────────────────

export function FeesForm() {
  const session        = useStore((s) => s.session);
  const config         = useFeesStore((s) => s.config);
  const frozenCourtCost = useFeesStore((s) => s.frozenCourtCost);
  const setConfig      = useFeesStore((s) => s.setConfig);

  const [tick, setTick]       = useState(() => Date.now());
  const [resetOpen, setResetOpen] = useState(false);

  // Live 1-second ticker
  useEffect(() => {
    if (session.endedAt) return; // no need to tick when session ended
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session.endedAt]);

  // ── Court billing ────────────────────────────────────────────────────────

  const sessionEnded = session.endedAt !== undefined;
  const endTs = session.endedAt ?? tick;

  const liveCourts = session.courts.map((court) => {
    const hrs = billedHours(court.createdAt, endTs);
    return {
      court,
      activeSince: formatShortDuration(endTs - court.createdAt),
      billedHrs: hrs,
      amount: hrs * config.courtFeePerHour,
    };
  });

  const liveTotalCourtCost = liveCourts.reduce((s, r) => s + r.amount, 0);
  const totalCourtCost = sessionEnded
    ? (frozenCourtCost ?? liveTotalCourtCost)
    : liveTotalCourtCost;

  // ── Fee summary ──────────────────────────────────────────────────────────

  const activePlayers = session.players.filter(
    (p) => p.status !== "done" || p.paid === false,
  );
  const perPlayer =
    config.playerFee !== null
      ? config.playerFee
      : activePlayers.length > 0
        ? totalCourtCost / activePlayers.length
        : 0;
  const perPlayerCeiled = Math.ceil(perPlayer);

  // ── Fee management ───────────────────────────────────────────────────────

  const paidPlayers   = activePlayers.filter((p) => p.paid);
  const unpaidPlayers = activePlayers.filter((p) => !p.paid);
  const collected     = paidPlayers.length * perPlayerCeiled;
  const outstanding   = unpaidPlayers.length * perPlayerCeiled;

  // ── Status chip color ────────────────────────────────────────────────────

  function statusTone(
    status: string,
  ): "muted" | "neon" | "alert" | "cold" | "moss" | "bone" {
    if (status === "playing") return "neon";
    if (status === "waiting") return "cold";
    if (status === "break")   return "cold";
    if (status === "done")    return "moss";
    return "muted";
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* ── A. Fee Configuration ─────────────────────────────────────── */}
      <Section title="Fee Configuration">
        <LabelRow label="Court fee">
          <div className="flex items-center gap-0">
            <span className="font-mono text-[13px] text-bone-3 border-[0.5px] border-hairline-2 border-r-0 bg-ink-100 px-2 py-2 select-none">
              ₱
            </span>
            <input
              type="number"
              min={0}
              step={1}
              value={config.courtFeePerHour === 0 ? "" : config.courtFeePerHour}
              placeholder="0"
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setConfig({ courtFeePerHour: isNaN(v) ? 0 : v });
              }}
              className={inputClass}
            />
          </div>
        </LabelRow>
        <LabelRow label="Per-player fee (optional)" last>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-0">
              <span className="font-mono text-[13px] text-bone-3 border-[0.5px] border-hairline-2 border-r-0 bg-ink-100 px-2 py-2 select-none">
                ₱
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={config.playerFee === null ? "" : config.playerFee}
                placeholder="auto"
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === "") {
                    setConfig({ playerFee: null });
                  } else {
                    const v = parseFloat(raw);
                    setConfig({ playerFee: isNaN(v) ? null : v });
                  }
                }}
                className={inputClass}
              />
            </div>
            {config.playerFee === null && (
              <span className="font-mono text-[9px] text-bone-4 uppercase tracking-[0.1em]">
                Leave blank to split court cost equally
              </span>
            )}
          </div>
        </LabelRow>
      </Section>

      {/* ── B. Court Billing ─────────────────────────────────────────── */}
      <Section title="Court Billing">
        <div className="flex items-center justify-between mb-4">
          <Chip tone={sessionEnded ? "muted" : "neon"}>
            {sessionEnded ? "Session ended" : "Session active"}
          </Chip>
          {sessionEnded && frozenCourtCost !== null && (
            <span className="font-mono text-[13px] text-bone">
              ₱ {frozenCourtCost.toFixed(0)} total
            </span>
          )}
        </div>

        {!sessionEnded && liveCourts.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="rule-bottom">
                {["Court", "Active since", "Billed hrs", "Amount"].map((h) => (
                  <th
                    key={h}
                    className="font-mono text-[9px] uppercase tracking-[0.12em] text-bone-4 pb-2 text-left font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {liveCourts.map((row) => (
                <tr key={row.court.id} className="rule-bottom last:border-0">
                  <td className="font-mono text-[13px] text-bone py-2">
                    #{row.court.number}
                  </td>
                  <td className="font-mono text-[13px] text-bone py-2">
                    {row.activeSince}
                  </td>
                  <td className="font-mono text-[13px] text-bone py-2">
                    {row.billedHrs} hrs
                  </td>
                  <td className="font-mono text-[13px] text-bone py-2">
                    ₱ {row.amount.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !sessionEnded && liveCourts.length === 0 ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-bone-4">
            No courts active.
          </p>
        ) : null}

        {!sessionEnded && liveCourts.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t-[0.5px] border-hairline-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-bone-3">
              Total court cost
            </span>
            <span className="font-mono text-[13px] text-bone">
              ₱ {totalCourtCost.toFixed(0)}
            </span>
          </div>
        )}
      </Section>

      {/* ── C. Fee Summary ───────────────────────────────────────────── */}
      <Section title="Fee Summary">
        <LabelRow label="Court cost">
          <span className="font-mono digit text-[13px] text-bone">
            ₱ {totalCourtCost.toFixed(0)}
          </span>
        </LabelRow>
        <div className="h-px w-full bg-hairline-2 my-1" />
        <LabelRow label="Active players">
          <span className="font-mono digit text-[13px] text-bone">
            {activePlayers.length}
          </span>
        </LabelRow>
        <LabelRow label="Per player" last>
          <span
            className={`font-display text-[48px] font-semibold tracking-tight leading-none ${
              perPlayerCeiled > 0 ? "text-neon" : "text-bone-3"
            }`}
          >
            ₱ {perPlayerCeiled.toFixed(0)}
          </span>
        </LabelRow>
      </Section>

      {/* ── D. Fee Management ────────────────────────────────────────── */}
      <Section title="Fee Management">
        {/* Metric cards */}
        <div className="flex gap-4 mb-5">
          {/* Collected */}
          <div className="flex-1 border-[0.5px] border-hairline-2 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-bone-4 mb-2">
              Collected
            </p>
            <p className="font-mono text-[22px] font-semibold text-neon leading-none">
              ₱ {collected.toFixed(0)}
            </p>
            <p className="font-mono text-[10px] text-bone-3 mt-1">
              {paidPlayers.length} player{paidPlayers.length !== 1 ? "s" : ""} paid
            </p>
          </div>
          {/* Outstanding */}
          <div className="flex-1 border-[0.5px] border-hairline-2 p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-bone-4 mb-2">
              Outstanding
            </p>
            <p
              className={`font-mono text-[22px] font-semibold leading-none ${
                outstanding > 0 ? "text-alert" : "text-bone-3"
              }`}
            >
              ₱ {outstanding.toFixed(0)}
            </p>
            <p className="font-mono text-[10px] text-bone-3 mt-1">
              {unpaidPlayers.length} player{unpaidPlayers.length !== 1 ? "s" : ""} unpaid
            </p>
          </div>
        </div>

        {/* Player breakdown */}
        {activePlayers.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="rule-bottom">
                {["Player", "Status", "Fee", ""].map((h, i) => (
                  <th
                    key={i}
                    className="font-mono text-[9px] uppercase tracking-[0.12em] text-bone-4 pb-2 text-left font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activePlayers.map((p) => (
                <tr key={p.id} className="rule-bottom last:border-0">
                  <td className="font-mono text-[13px] text-bone py-2 pr-3">
                    {p.name}
                  </td>
                  <td className="py-2 pr-3">
                    <Chip tone={statusTone(p.status)}>{p.status}</Chip>
                  </td>
                  <td className="font-mono text-[13px] text-bone py-2 pr-3">
                    ₱ {perPlayerCeiled.toFixed(0)}
                  </td>
                  <td className="py-2">
                    {p.paid ? (
                      <Chip tone="moss">Paid</Chip>
                    ) : (
                      <Chip tone="alert">Unpaid</Chip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-bone-4">
            No active players.
          </p>
        )}
      </Section>

      {/* ── E. Danger Zone ───────────────────────────────────────────── */}
      <Section title="Danger Zone">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[12px] text-bone-2">Reset everything</p>
            <p className="font-mono text-[10px] text-bone-4 mt-0.5">
              Wipes all courts, players, payment records, and session history.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>
            Reset All
          </Button>
        </div>
      </Section>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => useStore.getState().resetAll()}
        title="Reset everything?"
        description="This permanently wipes all courts, players, payment records, and session history."
        confirmLabel="Reset all"
        danger
      />
    </div>
  );
}
