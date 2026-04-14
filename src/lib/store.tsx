"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Court,
  CourtSize,
  Gender,
  Level,
  Player,
  PlayerStatus,
  Session,
} from "./types";

const STORAGE_KEY = "setto:session:v1";

const seed = (): Session => ({
  courts: [
    { id: uid(), number: 1, size: 4, slots: [null, null, null, null] },
    { id: uid(), number: 2, size: 4, slots: [null, null, null, null] },
    { id: uid(), number: 3, size: 2, slots: [null, null] },
  ],
  players: [],
});

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function now() {
  return Date.now();
}

function playerIdentityKey(data: {
  name: string;
  gender: Gender;
  level: Level;
}) {
  return `${data.name.trim().toLocaleLowerCase()}::${data.level}::${data.gender}`;
}

function normalizeSession(session: Session): Session {
  return {
    ...session,
    players: session.players.map((player) => ({
      ...player,
      waitingSince: player.waitingSince ?? player.arrivedAt,
    })),
  };
}

type Ctx = {
  session: Session;
  ready: boolean;
  addCourt: (size: CourtSize) => void;
  updateCourt: (id: string, patch: Partial<Pick<Court, "size" | "number">>) => void;
  removeCourt: (id: string) => void;
  addPlayer: (data: {
    name: string;
    gender: Gender;
    level: Level;
    paid?: boolean;
  }) => boolean;
  updatePlayer: (id: string, patch: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  assignPlayer: (courtId: string, slotIndex: number, playerId: string) => void;
  releaseSlot: (courtId: string, slotIndex: number) => void;
  finishMatch: (courtId: string, winner: "A" | "B" | "none") => void;
  togglePaid: (playerId: string) => void;
  setStatus: (playerId: string, status: PlayerStatus) => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(normalizeSession(JSON.parse(raw) as Session));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session, ready]);

  const value = useMemo<Ctx>(() => {
    const findPlayer = (s: Session, id: string) =>
      s.players.find((p) => p.id === id);

    const releasePlayerFromCourts = (courts: Court[], playerId: string) =>
      courts.map((c) => ({
        ...c,
        slots: c.slots.map((s) => (s === playerId ? null : s)),
      }));

    const occupiedPlayerIds = (courts: Court[]) =>
      new Set(courts.flatMap((court) => court.slots.filter(Boolean) as string[]));

    return {
      session,
      ready,
      addCourt(size) {
        setSession((s) => ({
          ...s,
          courts: [
            ...s.courts,
            {
              id: uid(),
              number:
                s.courts.reduce((m, c) => Math.max(m, c.number), 0) + 1,
              size,
              slots: Array(size).fill(null),
            },
          ],
        }));
      },
      updateCourt(id, patch) {
        setSession((s) => ({
          ...s,
          courts: s.courts.map((c) => {
            if (c.id !== id) return c;
            const nextSize = patch.size ?? c.size;
            let slots = c.slots;
            if (nextSize !== c.size) {
              slots = Array(nextSize).fill(null);
              for (let i = 0; i < Math.min(c.slots.length, nextSize); i++) {
                slots[i] = c.slots[i];
              }
            }
            return { ...c, ...patch, slots };
          }),
        }));
      },
      removeCourt(id) {
        setSession((s) => {
          const removedCourt = s.courts.find((c) => c.id === id);
          const releasedIds = new Set(
            removedCourt?.slots.filter(Boolean) as string[] | undefined,
          );

          return {
            ...s,
            courts: s.courts.filter((c) => c.id !== id),
            players: s.players.map((player) =>
              releasedIds.has(player.id)
                ? { ...player, waitingSince: now() }
                : player,
            ),
          };
        });
      },
      addPlayer({ name, gender, level, paid = false }) {
        const normalizedName = name.trim();
        const candidateKey = playerIdentityKey({
          name: normalizedName,
          gender,
          level,
        });

        const exists = session.players.some(
          (player) =>
            playerIdentityKey({
              name: player.name,
              gender: player.gender,
              level: player.level,
            }) === candidateKey,
        );

        if (exists) return false;

        setSession((s) => ({
          ...s,
          players: [
            ...s.players,
            {
              id: uid(),
              name: normalizedName,
              gender,
              level,
              status: "playing",
              paid,
              arrivedAt: now(),
              waitingSince: now(),
              gamesPlayed: 0,
              wins: 0,
              losses: 0,
            },
          ],
        }));
        return true;
      },
      updatePlayer(id, patch) {
        setSession((s) => ({
          ...s,
          players: s.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
      },
      removePlayer(id) {
        setSession((s) => ({
          ...s,
          players: s.players.filter((p) => p.id !== id),
          courts: releasePlayerFromCourts(s.courts, id),
        }));
      },
      assignPlayer(courtId, slotIndex, playerId) {
        setSession((s) => {
          if (!findPlayer(s, playerId)) return s;
          const courts = releasePlayerFromCourts(s.courts, playerId).map((c) =>
            c.id === courtId
              ? {
                  ...c,
                  slots: c.slots.map((slot, i) =>
                    i === slotIndex ? playerId : slot,
                  ),
                }
              : c,
          );
          const players = s.players.map((p) =>
            p.id === playerId ? { ...p, status: "playing" as PlayerStatus } : p,
          );
          return { ...s, courts, players };
        });
      },
      releaseSlot(courtId, slotIndex) {
        setSession((s) => {
          const court = s.courts.find((c) => c.id === courtId);
          const releasedPlayerId = court?.slots[slotIndex];

          return {
            ...s,
            courts: s.courts.map((c) =>
              c.id === courtId
                ? {
                    ...c,
                    slots: c.slots.map((slot, i) => (i === slotIndex ? null : slot)),
                  }
                : c,
            ),
            players: s.players.map((player) =>
              player.id === releasedPlayerId
                ? { ...player, waitingSince: now(), status: "playing" as PlayerStatus }
                : player,
            ),
          };
        });
      },
      finishMatch(courtId, winner) {
        setSession((s) => {
          const court = s.courts.find((c) => c.id === courtId);
          if (!court) return s;
          const half = court.size / 2;
          const teamA = court.slots.slice(0, half).filter(Boolean) as string[];
          const teamB = court.slots.slice(half).filter(Boolean) as string[];
          const playerIds = [...teamA, ...teamB];

          const players = s.players.map((p) => {
            if (!playerIds.includes(p.id)) return p;
            if (winner === "none") {
              return {
                ...p,
                status: "playing" as PlayerStatus,
                waitingSince: now(),
              };
            }
            const wonSide = winner === "A" ? teamA : teamB;
            const won = wonSide.includes(p.id);
            return {
              ...p,
              status: "playing" as PlayerStatus,
              waitingSince: now(),
              gamesPlayed: p.gamesPlayed + 1,
              wins: won ? p.wins + 1 : p.wins,
              losses: won ? p.losses : p.losses + 1,
            };
          });

          const courts = s.courts.map((c) =>
            c.id === courtId ? { ...c, slots: Array(c.size).fill(null) } : c,
          );
          return { ...s, players, courts };
        });
      },
      togglePaid(playerId) {
        setSession((s) => ({
          ...s,
          players: s.players.map((p) =>
            p.id === playerId ? { ...p, paid: !p.paid } : p,
          ),
        }));
      },
      setStatus(playerId, status) {
        setSession((s) => {
          const courts =
            status === "playing"
              ? s.courts
              : releasePlayerFromCourts(s.courts, playerId);
          const onCourtIds = occupiedPlayerIds(courts);

          return {
            ...s,
            players: s.players.map((p) => {
              if (p.id !== playerId) return p;
              const shouldResetWaiting =
                status === "playing" && !onCourtIds.has(playerId);

              return {
                ...p,
                status,
                waitingSince: shouldResetWaiting ? now() : p.waitingSince,
              };
            }),
            courts,
          };
        });
      },
    };
  }, [session, ready]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
