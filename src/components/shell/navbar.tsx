"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, BarChart2, Settings2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LiveDot } from "@/components/ui/chip";

// ── Shared nav items ──────────────────────────────────────────────────────────

export type NavItem = {
  href: string;
  label: string;
  Icon: React.FC<{ size?: number; strokeWidth?: number }>;
  soon?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/",         label: "Floor",    Icon: LayoutGrid           },
  { href: "/roster",   label: "Roster",   Icon: Users                },
  { href: "/records",  label: "Records",  Icon: BarChart2 },
  { href: "/settings", label: "Settings", Icon: Settings2 },
];

function hasOngoingCourt(session: { courts: { size: number; slots: (string | null)[] }[] }) {
  return session.courts.some((c) => {
    const half = c.size / 2;
    return c.slots.slice(0, half).some(Boolean) && c.slots.slice(half).some(Boolean);
  });
}

// ── Top navbar ────────────────────────────────────────────────────────────────

export function Navbar({
  onEndSession,
  onAddCourt,
}: {
  onEndSession: () => void;
  onAddCourt: () => void;
}) {
  const pathname  = usePathname();
  const session   = useStore((s) => s.session);
  const isFloor   = pathname === "/";
  const hasOngoing = hasOngoingCourt(session);

  return (
    <header className="shrink-0 rule-bottom bg-ink-050">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-6 md:px-8 h-12">

        {/* Left — wordmark */}
        <div className="flex items-center min-w-0">
          <Link
            href="/"
            className="statement text-[22px] leading-none tracking-[-0.05em] hover:opacity-70 transition-opacity"
          >
            Queueing
          </Link>
        </div>

        {/* Center — nav links */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_ITEMS.map(({ href, label, Icon, soon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            if (soon) {
              return (
                <span
                  key={href}
                  title="Coming soon"
                  className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-bone-4 cursor-not-allowed select-none"
                >
                  <Icon size={12} strokeWidth={2} />
                  {label}
                </span>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] transition-colors border-b-[1.5px] ${
                  active
                    ? "text-bone border-bone"
                    : "text-bone-4 border-transparent hover:text-bone-2"
                }`}
              >
                <Icon size={12} strokeWidth={2} />
                {label}
                {href === "/" && hasOngoing && (
                  <LiveDot className="bg-neon ml-0.5" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right — page actions (min-width mirrors left so center stays true) */}
        <div className="flex items-center gap-2 justify-end min-w-0">
          {isFloor && (
            <>
              <Button variant="danger" size="sm" onClick={onEndSession}>
                End Session
              </Button>
              <Button variant="solid" size="sm" onClick={onAddCourt}>
                + Court
              </Button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}

// ── Bottom nav (mobile / tablet) ──────────────────────────────────────────────

export function BottomNav() {
  const pathname   = usePathname();
  const session    = useStore((s) => s.session);
  const hasOngoing = hasOngoingCourt(session);

  return (
    <nav className="xl:hidden fixed bottom-0 inset-x-0 z-50 bg-ink-100 border-t-[0.5px] border-hairline-2 flex">
      {NAV_ITEMS.map(({ href, label, Icon, soon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        if (soon) {
          return (
            <span
              key={href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-bone-4 cursor-not-allowed select-none"
            >
              <Icon size={18} strokeWidth={1.5} />
              <span className="font-mono text-[8px] uppercase tracking-[0.18em]">{label}</span>
            </span>
          );
        }
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors border-t-2 ${
              active
                ? "text-bone border-neon"
                : "text-bone-4 border-transparent hover:text-bone-2"
            }`}
          >
            <div className="relative">
              <Icon size={18} strokeWidth={1.5} />
              {href === "/" && hasOngoing && (
                <LiveDot className="bg-neon absolute -top-0.5 -right-1.5" />
              )}
            </div>
            <span className="font-mono text-[8px] uppercase tracking-[0.18em]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
