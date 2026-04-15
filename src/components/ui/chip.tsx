"use client";

import type { ReactNode } from "react";
import type { Level } from "@/lib/types";

type Tone =
  | "neon"
  | "bone"
  | "muted"
  | "alert"
  | "cold"
  | "moss"
  | "male"
  | "female"
  | `level-${Level}`;

const toneClasses: Record<Tone, string> = {
  neon: "bg-neon text-ink-000",
  bone: "bg-bone text-ink-000",
  muted: "text-bone-3 border-[0.5px] border-hairline-2",
  alert: "bg-alert-soft text-alert border-[0.5px] border-alert/40",
  cold: "bg-cold-soft text-cold border-[0.5px] border-cold/40",
  moss: "bg-moss-soft text-moss border-[0.5px] border-moss/40",
  male: "g-male border-[0.5px]",
  female: "g-female border-[0.5px]",
  "level-beginner": "lvl-beginner",
  "level-low-intermediate": "lvl-low-intermediate",
  "level-intermediate": "lvl-intermediate",
  "level-upper-intermediate": "lvl-upper-intermediate",
  "level-advanced": "lvl-advanced",
  "level-professional": "lvl-professional",
};

export function Chip({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] leading-none px-1.5 py-[3px] ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`eyebrow ${className}`}>{children}</span>;
}

export function Hairline({
  className = "",
  orientation = "h",
}: {
  className?: string;
  orientation?: "h" | "v";
}) {
  if (orientation === "v") {
    return (
      <div
        className={`w-px self-stretch bg-hairline-2 ${className}`}
      />
    );
  }
  return <div className={`h-px w-full bg-hairline-2 ${className}`} />;
}

export function LiveDot({
  className = "",
  tone = "neon",
}: {
  className?: string;
  tone?: "neon" | "alert" | "cold";
}) {
  const bg =
    tone === "neon" ? "bg-neon" : tone === "alert" ? "bg-alert" : "bg-cold";
  return (
    <span
      className={`pulse-live inline-block w-1.5 h-1.5 rounded-full ${bg} ${className}`}
    />
  );
}
