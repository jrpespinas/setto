"use client";

import { forwardRef, type ReactNode } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-bone-3 mb-1.5">
        {label}
      </div>
      {children}
    </label>
  );
}

export const TextInput = forwardRef<HTMLInputElement, {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  className?: string;
}>(function TextInput({ value, onChange, placeholder, type = "text", className = "" }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`
        w-full bg-transparent
        border-[0.5px] border-hairline-2 focus:border-bone
        outline-none px-3 py-2.5 font-display text-xl text-bone
        placeholder:text-bone-4 placeholder:font-display placeholder:italic
        transition-colors
        ${className}
      `}
    />
  );
});

export function Toggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-1 h-9 px-3 font-mono text-[11px] uppercase tracking-[0.22em]
        border-[0.5px] cursor-pointer transition-colors whitespace-nowrap
        ${active
          ? "bg-bone text-ink-000 border-bone"
          : "bg-transparent text-bone-2 border-hairline-2 hover:border-bone hover:text-bone"}
      `}
    >
      {label}
    </button>
  );
}
