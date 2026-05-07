"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { useStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";
import { MetricBar } from "@/components/metrics/metric-bar";
import { CourtGrid } from "@/components/courts/court-grid";
import { PlayerSidebar } from "@/components/sidebar/player-sidebar";
import { QueueRail } from "@/components/queue/queue-rail";
import { AddCourtDialog } from "@/components/dialogs/add-court-dialog";
import { PasswordGate } from "@/components/auth/password-gate";
import { SetupDialog } from "@/components/auth/setup-dialog";
import { Navbar, BottomNav } from "./navbar";
import { ServiceWorkerRegister } from "./sw-register";

export function Shell({ children }: { children?: ReactNode }) {
  const pathname      = usePathname();
  const isFloor       = pathname === "/";
  const hydrated      = useStore((s) => s.hydrated);
  const authHydrated  = useAuthStore((s) => s.hydrated);
  const passwordHash  = useAuthStore((s) => s.passwordHash);
  const [addCourt, setAddCourt] = useState(false);
  const [endOpen,  setEndOpen]  = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const fmt = () => new Date().toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", second: "2-digit",
    });
    setClock(fmt());
    const id = window.setInterval(() => setClock(fmt()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const handleEndSession = () => {
    useStore.getState().endSession();
  };

  return (
    <>
      <ServiceWorkerRegister />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: "#ffffff", color: "#0e1018", border: "0.5px solid #e0e0e0" },
          actionButtonStyle: { background: "#0e1018", color: "#ffffff" },
        }}
      />
      <div className="flex flex-col min-w-[860px] xl:h-screen xl:overflow-hidden">

        {/* NAVBAR — full width across main + sidebar */}
        <Navbar
          onEndSession={() => setEndOpen(true)}
          onAddCourt={() => setAddCourt(true)}
        />

        {/* BODY — splits into main + sidebar below the navbar */}
        <div
          className={`
            flex-1 min-h-0 xl:overflow-hidden grid
            ${isFloor
              ? "xl:[grid-template-columns:minmax(0,85fr)_minmax(240px,15fr)]"
              : "xl:[grid-template-columns:minmax(0,1fr)]"
            }
          `}
        >
          <main className="flex flex-col min-w-0 xl:h-full xl:overflow-hidden">

            {/* Metric bar — floor only */}
            {isFloor && <MetricBar />}

            {/* Content area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 md:p-7 xl:p-8 pb-20 xl:pb-8">
              {isFloor ? (
                <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_272px] xl:gap-5 xl:items-start">
                  {!hydrated ? (
                    <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone-4">
                      Loading session…
                    </div>
                  ) : (
                    <CourtGrid onAddCourt={() => setAddCourt(true)} />
                  )}
                  <div className="hidden xl:block">
                    <QueueRail />
                  </div>
                </div>
              ) : (
                children
              )}
            </div>

            {/* Footer */}
            <footer className="shrink-0 rule-top px-6 md:px-8 py-3 hidden xl:flex items-center">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-bone-4">
                {clock}
              </span>
            </footer>
          </main>

          {/* SIDEBAR — floor only */}
          {isFloor && <PlayerSidebar />}
        </div>
      </div>

      {/* Bottom nav — mobile/tablet only */}
      <BottomNav />

      {/* Floor dialogs */}
      {isFloor && (
        <>
          <AddCourtDialog open={addCourt} onClose={() => setAddCourt(false)} />
          <PasswordGate
            open={endOpen}
            onClose={() => setEndOpen(false)}
            onConfirm={handleEndSession}
            title="End session?"
            description="Court billing will stop and courts will be cleared. Players and payments are retained."
            confirmLabel="End session"
          />
        </>
      )}

      {/* First-time auth setup — blocks all interaction until password is created */}
      {authHydrated && !passwordHash && <SetupDialog />}
    </>
  );
}
