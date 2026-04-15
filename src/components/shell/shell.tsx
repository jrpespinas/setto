"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/chip";
import { MetricBar } from "@/components/metrics/metric-bar";
import { CourtGrid } from "@/components/courts/court-grid";
import { PlayerSidebar } from "@/components/sidebar/player-sidebar";
import { QueueRail } from "@/components/queue/queue-rail";
import { AddCourtDialog } from "@/components/dialogs/add-court-dialog";
import { ServiceWorkerRegister } from "./sw-register";

/** Root application shell.
 *  Grid: [main 85% | sidebar 15%] on wide; stacks on small.
 *  Main: masthead + metrics + (queue | courts). */
export function Shell() {
  const hydrated = useStore((s) => s.hydrated);
  const [addCourt, setAddCourt] = useState(false);
  const [sessionStamp, setSessionStamp] = useState("");

  useEffect(() => {
    const update = () =>
      setSessionStamp(
        new Date().toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      );
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <ServiceWorkerRegister />
      <div
        className="
          flex-1
          grid
          xl:h-screen xl:overflow-hidden
          xl:[grid-template-columns:minmax(0,85fr)_minmax(240px,15fr)]
        "
      >
        {/* MAIN --------------------------------------------------------- */}
        <main className="flex flex-col min-w-0 xl:h-full xl:overflow-hidden">
          {/* Masthead */}
          <header className="shrink-0 rule-bottom px-6 md:px-8 py-5 bg-ink-050">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <h1 className="statement text-[56px] lowercase leading-[0.85] tracking-[-0.05em]">
                  setto
                </h1>
                <div className="pb-1.5">
                  <Eyebrow>Session</Eyebrow>
                  <div className="font-display italic text-[15px] mt-0.5 text-bone-2">
                    {sessionStamp || "\u00a0"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-bone-4">
                  {hydrated ? "· live" : "· syncing"}
                </span>
                <Button variant="solid" size="sm" onClick={() => setAddCourt(true)}>
                  + Court
                </Button>
              </div>
            </div>
          </header>

          {/* Metric bar */}
          <MetricBar />

          {/* Floor — courts + queue rail */}
          <section className="flex-1 min-h-0 grid xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="flex-1 min-h-0 overflow-y-auto p-5 md:p-7 xl:p-8">
              {!hydrated ? (
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone-4">
                  Loading session…
                </div>
              ) : (
                <CourtGrid onAddCourt={() => setAddCourt(true)} />
              )}
            </div>
            <div className="hidden xl:block xl:h-full xl:overflow-hidden">
              <QueueRail />
            </div>
          </section>

          {/* Footer */}
          <footer className="shrink-0 rule-top px-6 md:px-8 py-3 flex items-center justify-between">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-bone-4">
              No database · Session persists in your browser · Offline-ready
            </span>
          </footer>
        </main>

        {/* SIDEBAR ------------------------------------------------------ */}
        <PlayerSidebar />
      </div>

      <AddCourtDialog open={addCourt} onClose={() => setAddCourt(false)} />
    </>
  );
}
