"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "ghost" | "solid" | "neon" | "danger" | "outline";
type Size = "xs" | "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base =
  "relative inline-flex items-center justify-center gap-1.5 font-mono uppercase tracking-[0.22em] transition-[background,color,border-color,box-shadow] duration-150 " +
  "disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap select-none " +
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon focus-visible:ring-offset-1 focus-visible:ring-offset-ink-000";

const variants: Record<Variant, string> = {
  ghost:
    "text-bone-2 hover:text-bone hover:bg-white/[0.03]",
  solid:
    "bg-bone text-ink-000 hover:bg-white hover:text-bone",
  neon:
    "bg-neon text-ink-000 hover:bg-neon-deep shadow-[0_0_0_0.5px_var(--neon)]",
  danger:
    "text-alert hover:bg-alert-soft border-[0.5px] border-alert/50 hover:border-alert",
  outline:
    "text-bone border-[0.5px] border-hairline-3 hover:border-bone hover:bg-white/[0.03]",
};

const sizes: Record<Size, string> = {
  xs: "h-6 px-2 text-[9.5px]",
  sm: "h-7 px-3 text-[10px]",
  md: "h-9 px-4 text-[11px]",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
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
});
