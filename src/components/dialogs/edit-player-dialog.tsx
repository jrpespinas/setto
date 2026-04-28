"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  GENDER_LABEL,
  LEVELS,
  LEVEL_FULL_LABEL,
  type Gender,
  type Level,
  type Player,
} from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, TextInput, Toggle } from "./field";

export function EditPlayerDialog({
  player,
  onClose,
}: {
  player: Player | null;
  onClose: () => void;
}) {
  // FIX: Extracted into individual selectors to avoid returning a new object literal
  const updatePlayer = useStore((s) => s.updatePlayer);
  const session = useStore((s) => s.session);
  
  const open = !!player;

  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [level, setLevel] = useState<Level>("intermediate");
  const [error, setError] = useState("");

  useEffect(() => {
    if (player) {
      setName(player.name);
      setGender(player.gender);
      setLevel(player.level);
      setError("");
    }
  }, [player]);

  if (!player) {
    return (
      <Dialog open={false} onClose={onClose} title="Edit player">
        <div />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} eyebrow="Roster / Edit" title={player.name}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const duplicate = session.players.some(
            (p) =>
              p.id !== player.id &&
              p.name.trim().toLowerCase() === name.trim().toLowerCase() &&
              p.level === level &&
              p.gender === gender,
          );
          if (duplicate) {
            setError("Another player has the same name + level + gender.");
            return;
          }
          const prev = useStore.getState().session;
          updatePlayer(player.id, {
            name: name.trim(),
            gender,
            level,
          });
          toast(`${name.trim()} updated`, {
            action: { label: "Undo", onClick: () => useStore.getState().restoreSession(prev) },
          });
          onClose();
        }}
        className="space-y-5"
      >
        <Field label="Name">
          <TextInput
            autoFocus
            value={name}
            onChange={(v) => {
              setName(v);
              if (error) setError("");
            }}
          />
        </Field>

        <Field label="Gender">
          <div className="flex gap-2">
            {(["male", "female"] as Gender[]).map((g) => (
              <Toggle
                key={g}
                active={gender === g}
                onClick={() => setGender(g)}
                label={GENDER_LABEL[g]}
              />
            ))}
          </div>
        </Field>

        <Field label="Level">
          <div className="grid grid-cols-2 gap-1.5">
            {LEVELS.map((lv) => (
              <Toggle
                key={lv}
                active={level === lv}
                onClick={() => setLevel(lv)}
                label={LEVEL_FULL_LABEL[lv]}
              />
            ))}
          </div>
        </Field>

        {error ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-3 border-t-[0.5px] border-hairline-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="solid">
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}