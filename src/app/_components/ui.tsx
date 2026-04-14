"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "ghost" | "ink" | "accent" | "danger" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
};

const base =
  "inline-flex items-center justify-center gap-2 font-sans text-[13px] tracking-wide uppercase transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink cursor-pointer";

const variants: Record<ButtonVariant, string> = {
  ghost:
    "text-ink-2 hover:text-ink hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)]",
  ink: "bg-ink text-paper hover:bg-ink-2",
  accent: "bg-accent text-ink hover:bg-accent-deep hover:text-paper",
  danger:
    "bg-transparent text-clay border border-clay hover:bg-clay hover:text-paper",
  outline:
    "border border-ink/30 text-ink hover:border-ink hover:bg-ink hover:text-paper",
};

const sizes = {
  sm: "h-7 px-3",
  md: "h-9 px-4",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className = "", variant = "outline", size = "md", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  },
);

export function Chip({
  children,
  tone = "ink",
  className = "",
}: {
  children: ReactNode;
  tone?:
    | "ink"
    | "accent"
    | "clay"
    | "moss"
    | "muted"
    | "male"
    | "female"
    | "level-beginner"
    | "level-low-intermediate"
    | "level-intermediate"
    | "level-upper-intermediate"
    | "level-advanced"
    | "level-professional";
  className?: string;
}) {
  const tones: Record<string, string> = {
    ink: "bg-ink text-paper",
    accent: "bg-accent text-ink",
    clay: "bg-clay-soft text-clay border border-clay/50",
    moss: "bg-moss-soft text-moss border border-moss/40",
    muted: "bg-transparent text-ink-3 border border-rule",
    male: "bg-[color-mix(in_srgb,#7fb8ff_18%,white)] text-[#4d6f98] border border-[#a9c8e9]",
    female:
      "bg-[color-mix(in_srgb,#f4a9c8_18%,white)] text-[#9a6077] border border-[#e4bfd0]",
    "level-beginner":
      "bg-[color-mix(in_srgb,#d8f4d2_55%,white)] text-[#5d8b57] border border-[#c7e4be]",
    "level-low-intermediate":
      "bg-[color-mix(in_srgb,#c6edbb_62%,white)] text-[#567f4f] border border-[#b5dbaa]",
    "level-intermediate":
      "bg-[color-mix(in_srgb,#b3e39d_70%,white)] text-[#476f40] border border-[#9ed08b]",
    "level-upper-intermediate":
      "bg-[color-mix(in_srgb,#8ed36d_76%,white)] text-[#345f2e] border border-[#81bf63]",
    "level-advanced":
      "bg-[color-mix(in_srgb,#63bf42_84%,white)] text-[#244f22] border border-[#5ba73e]",
    "level-professional":
      "bg-[color-mix(in_srgb,#3ba321_88%,white)] text-[#163d16] border border-[#3d9028]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Rule({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-rule ${className}`} />;
}

export function ThickRule({ className = "" }: { className?: string }) {
  return <div className={`h-[2px] w-full bg-ink ${className}`} />;
}
