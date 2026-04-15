"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

export function ConfirmDeleteCourtDialog({
  open,
  onClose,
  onConfirm,
  courtNumber,
  isOngoing,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  courtNumber: number;
  isOngoing: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      eyebrow="Courts / Delete"
      title={`Remove court ${String(courtNumber).padStart(2, "0")}?`}
    >
      <div className="space-y-4">
        <p className="text-bone-2 text-sm leading-relaxed">
          The court and its slots will be removed. Players assigned to this
          court return to Idle.
        </p>
        {isOngoing ? (
          <div className="border-l-[0.5px] border-alert pl-3 py-1">
            <Chip tone="alert">Ongoing match</Chip>
            <p className="text-bone-2 text-sm mt-2 leading-relaxed">
              The in-progress match will not be recorded. No wins, losses, or
              games count for the current players.
            </p>
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-3 border-t-[0.5px] border-hairline-2">
          <Button variant="ghost" onClick={onClose}>Keep court</Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete court
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
