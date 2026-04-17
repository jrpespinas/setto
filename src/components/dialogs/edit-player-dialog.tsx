"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  GENDER_LABEL,
  LEVELS,
  LEVEL_LABEL,
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
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (player) {
      setName(player.name);
      setGender(player.gender);
      setLevel(player.level);
      setWins(player.wins);
      setLosses(player.losses);
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
          const gamesPlayed = Math.max(0, wins + losses);
          updatePlayer(player.id, {
            name: name.trim(),
            gender,
            level,
            wins: Math.max(0, wins),
            losses: Math.max(0, losses),
            gamesPlayed,
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
          <div className="grid grid-cols-3 gap-1.5">
            {LEVELS.map((lv) => (
              <Toggle
                key={lv}
                active={level === lv}
                onClick={() => setLevel(lv)}
                label={LEVEL_LABEL[lv]}
              />
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Wins">
            <TextInput
              type="number"
              value={wins}
              onChange={(v) => setWins(Number(v))}
            />
          </Field>
          <Field label="Losses">
            <TextInput
              type="number"
              value={losses}
              onChange={(v) => setLosses(Number(v))}
            />
          </Field>
        </div>

        {error ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-3 border-t-[0.5px] border-hairline-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="neon">
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}