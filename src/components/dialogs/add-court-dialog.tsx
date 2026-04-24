"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { CourtSize } from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Toggle } from "./field";

export function AddCourtDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addCourt = useStore((s) => s.addCourt);
  const [size, setSize] = useState<CourtSize>(4);
  return (
    <Dialog open={open} onClose={onClose} eyebrow="Courts / New" title="Add court">
      <div className="space-y-5">
        <Field label="Format">
          <div className="flex gap-2">
            <Toggle active={size === 2} onClick={() => setSize(2)} label="Singles · 2" />
            <Toggle active={size === 4} onClick={() => setSize(4)} label="Doubles · 4" />
          </div>
        </Field>
        <div className="flex justify-end gap-2 pt-3 border-t-[0.5px] border-hairline-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="solid"
            onClick={() => {
              addCourt(size);
              onClose();
            }}
          >
            Add court
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
