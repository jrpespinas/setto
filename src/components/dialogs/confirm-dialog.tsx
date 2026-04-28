"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="space-y-5">
        {description && (
          <p className="font-display italic text-bone-2 text-sm leading-relaxed">
            {description}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-3 border-t-[0.5px] border-hairline-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant={danger ? "danger" : "solid"}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
