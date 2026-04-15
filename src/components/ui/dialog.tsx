"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const handler = () => onClose();
    d.addEventListener("close", handler);
    return () => d.removeEventListener("close", handler);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="bg-ink-100 text-bone p-0 max-w-[min(540px,92vw)] w-full
                 backdrop:bg-black/70 backdrop:backdrop-blur-sm
                 border-[0.5px] border-hairline-3 rounded-none
                 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)] slide-in"
    >
      <div className="relative border-b-[0.5px] border-hairline-2 px-6 py-5">
        {eyebrow ? (
          <div className="eyebrow mb-1.5">{eyebrow}</div>
        ) : null}
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="statement text-[28px]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="font-mono text-[10px] uppercase tracking-[0.24em] text-bone-3 hover:text-bone cursor-pointer"
          >
            ESC
          </button>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
