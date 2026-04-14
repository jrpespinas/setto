"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
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
      className="bg-paper-soft text-ink p-0 max-w-[min(480px,90vw)] w-full backdrop:bg-ink/40 backdrop:backdrop-blur-sm border border-ink/20 shadow-[8px_8px_0_var(--ink)] rise"
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="border-b-2 border-ink px-5 py-3 flex items-center justify-between">
        <h2 className="font-display text-xl leading-none tracking-tight">
          {title}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="font-mono text-xs uppercase tracking-widest text-ink-3 hover:text-ink cursor-pointer"
        >
          Esc
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
