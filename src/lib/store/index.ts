"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Court,
  CourtSize,
  Gender,
  Level,
  Player,
  PlayerStatus,
  QueueCard,
  Session,
} from "@/lib/types";

const STORAGE_KEY = "setto:session:v2";
const QUEUE_SLOTS = 3;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function now() {
  return Date.now();
}

function identityKey(d: { name: string; gender: Gender; level: Level }) {
  return `${d.name.trim().toLocaleLowerCase()}::${d.level}::${d.gender}`;
}

function seed(): Session {
  return {
    courts: [],
    queue: Array.from({ length: QUEUE_SLOTS }, () => ({
      id: uid(),
      size: 4 as CourtSize,
      slots: [null, null, null, null],
    })),
    players: [],
    matchesCompleted: 0,
    startedAt: now(),
  };
}

function releaseFromCourts(courts: Court[], playerId: string): Court[] {
  return courts.map((c) => ({
    ...c,
    slots: c.slots.map((s) => (s === playerId ? null : s)),
  }));
}

function releaseFromQueue(queue: QueueCard[], playerId: string): QueueCard[] {
  return queue.map((q) => ({
    ...q,
    slots: q.slots.map((s) => (s === playerId ? null : s)),
  }));
}

function courtIsOngoing(court: Court, playerIds: Set<string>): boolean {
  const half = court.size / 2;
  const a = court.slots.slice(0, half).some((id) => id && playerIds.has(id));
  const b = court.slots.slice(half).some((id) => id && playerIds.has(id));
  return a && b;
}

function occupiedOnCourts(courts: Court[]): Set<string> {
  return new Set(courts.flatMap((c) => c.slots.filter(Boolean) as string[]));
}

function occupiedInQueue(queue: QueueCard[]): Set<string> {
  return new Set(queue.flatMap((q) => q.slots.filter(Boolean) as string[]));
}

type Actions = {
  addCourt: (size: CourtSize, number?: number) => boolean;
  updateCourt: (id: string, patch: Partial<Pick<Court, "size" | "number">>) => boolean;
  removeCourt: (id: string) => void;

  addPlayer: (data: {
    name: string;
    gender: Gender;
    level: Level;
    paid?: boolean;
  }) => boolean;
  updatePlayer: (id: string, patch: Partial<Player>) => void;
  removePlayer: (id: string) => void;

  assignToCourtSlot: (courtId: string, slotIndex: number, playerId: string) => void;
  releaseCourtSlot: (courtId: string, slotIndex: number) => void;
  bulkAssignToCourt: (courtId: string, sideAIds: string[], sideBIds: string[]) => void;
  swapCourtSlots: (courtId: string, slotIndexA: number, slotIndexB: number) => void;

  assignToQueueSlot: (queueId: string, slotIndex: number, playerId: string) => void;
  releaseQueueSlot: (queueId: string, slotIndex: number) => void;
  promoteQueueToCourt: (queueId: string, courtId: string) => void;
  dumpQueueToIdle: (queueId: string) => void;

  finishMatch: (courtId: string, winner: "A" | "B" | "none") => void;

  togglePaid: (playerId: string) => void;
  setStatus: (playerId: string, status: PlayerStatus) => void;

  resetAll: () => void;
  restoreSession: (session: Session) => void;
};

export type SettoStore = {
  session: Session;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
} & Actions;

export const useStore = create<SettoStore>()(
  persist(
    (set, get) => ({
      session: seed(),
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      addCourt(size, number) {
        const { session } = get();
        const nextNumber = number ?? (session.courts.reduce((m, c) => Math.max(m, c.number), 0) + 1);
        if (session.courts.some((c) => c.number === nextNumber)) return false;
        set(({ session }) => ({
          session: {
            ...session,
            courts: [
              ...session.courts,
              { id: uid(), number: nextNumber, size, slots: Array(size).fill(null) },
            ],
          },
        }));
        return true;
      },

      updateCourt(id, patch) {
        const { session } = get();
        if (patch.number !== undefined && session.courts.some((c) => c.id !== id && c.number === patch.number)) {
          return false;
        }
        set(({ session }) => ({
          session: {
            ...session,
            courts: session.courts.map((c) => {
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
          },
        }));
        return true;
      },

      removeCourt(id) {
        set(({ session }) => {
          const removed = session.courts.find((c) => c.id === id);
          const freed = new Set(
            removed?.slots.filter(Boolean) as string[] | undefined,
          );
          return {
            session: {
              ...session,
              courts: session.courts.filter((c) => c.id !== id),
              players: session.players.map((p) =>
                freed.has(p.id)
                  ? { ...p, status: "idle" as PlayerStatus }
                  : p,
              ),
            },
          };
        });
      },

      addPlayer({ name, gender, level, paid = false }) {
        const trimmed = name.trim();
        if (!trimmed) return false;
        const key = identityKey({ name: trimmed, gender, level });
        const exists = get().session.players.some(
          (p) => identityKey(p) === key,
        );
        if (exists) return false;

        set(({ session }) => ({
          session: {
            ...session,
            players: [
              ...session.players,
              {
                id: uid(),
                name: trimmed,
                gender,
                level,
                status: "idle",
                paid,
                arrivedAt: now(),
                statusSince: now(),
                gamesPlayed: 0,
              },
            ],
          },
        }));
        return true;
      },

      updatePlayer(id, patch) {
        set(({ session }) => ({
          session: {
            ...session,
            players: session.players.map((p) =>
              p.id === id ? { ...p, ...patch } : p,
            ),
          },
        }));
      },

      removePlayer(id) {
        set(({ session }) => ({
          session: {
            ...session,
            players: session.players.filter((p) => p.id !== id),
            courts: releaseFromCourts(session.courts, id),
            queue: releaseFromQueue(session.queue, id),
          },
        }));
      },

      assignToCourtSlot(courtId, slotIndex, playerId) {
        set(({ session }) => {
          if (!session.players.find((p) => p.id === playerId)) return { session };

          // Player displaced from previous court slot? Push displaced to idle.
          const prevCourt = session.courts.find((c) =>
            c.id === courtId && c.slots[slotIndex] && c.slots[slotIndex] !== playerId,
          );
          const displacedId = prevCourt?.slots[slotIndex] ?? null;

          const allPlayerIds = new Set(session.players.map((p) => p.id));
          const prevCourts = releaseFromCourts(session.courts, playerId);
          const prevTarget = prevCourts.find((c) => c.id === courtId)!;
          const wasOngoing = courtIsOngoing(prevTarget, allPlayerIds);

          const courts = prevCourts.map((c) => {
            if (c.id !== courtId) return c;
            const nextSlots = c.slots.map((s, i) => (i === slotIndex ? playerId : s));
            const nextCourt = { ...c, slots: nextSlots };
            const nowOngoing = courtIsOngoing(nextCourt, allPlayerIds);
            return {
              ...nextCourt,
              matchStartedAt: nowOngoing
                ? wasOngoing ? c.matchStartedAt : now()
                : undefined,
            };
          });
          const queue = releaseFromQueue(session.queue, playerId);

          const players = session.players.map((p) => {
            if (p.id === playerId) {
              return { ...p, status: "playing" as PlayerStatus };
            }
            if (p.id === displacedId) {
              return { ...p, status: "idle" as PlayerStatus };
            }
            return p;
          });
          return { session: { ...session, courts, queue, players } };
        });
      },

      bulkAssignToCourt(courtId, sideAIds, sideBIds) {
        set(({ session }) => {
          const court = session.courts.find((c) => c.id === courtId);
          if (!court) return { session };

          const half = court.size / 2;
          const allIncoming = [...sideAIds, ...sideBIds].filter(Boolean);

          // Displaced = players currently in the target court who aren't being re-assigned
          const displaced = court.slots
            .filter((id): id is string => !!id && !allIncoming.includes(id));

          // Build new slot array
          const newSlots: (string | null)[] = Array(court.size).fill(null);
          sideAIds.forEach((id, i) => { if (i < half) newSlots[i] = id; });
          sideBIds.forEach((id, i) => { if (i < half) newSlots[half + i] = id; });

          // Release incoming players from wherever they currently are
          let queue = session.queue;
          let courts = session.courts;
          for (const id of allIncoming) {
            queue = releaseFromQueue(queue, id);
            courts = releaseFromCourts(courts, id);
          }

          const matchTs = now();
          const allPlayerIds = new Set(session.players.map((p) => p.id));
          courts = courts.map((c) => {
            if (c.id !== courtId) return c;
            const nextCourt = { ...c, slots: newSlots };
            return {
              ...nextCourt,
              matchStartedAt: courtIsOngoing(nextCourt, allPlayerIds) ? matchTs : undefined,
            };
          });

          const players = session.players.map((p) => {
            if (allIncoming.includes(p.id)) {
              return { ...p, status: "playing" as PlayerStatus };
            }
            if (displaced.includes(p.id)) {
              return { ...p, status: "idle" as PlayerStatus };
            }
            return p;
          });

          return { session: { ...session, courts, queue, players } };
        });
      },

      swapCourtSlots(courtId, slotIndexA, slotIndexB) {
        set(({ session }) => ({
          session: {
            ...session,
            courts: session.courts.map((c) => {
              if (c.id !== courtId) return c;
              const slots = [...c.slots];
              [slots[slotIndexA], slots[slotIndexB]] = [slots[slotIndexB], slots[slotIndexA]];
              return { ...c, slots };
            }),
          },
        }));
      },

      releaseCourtSlot(courtId, slotIndex) {
        set(({ session }) => {
          const court = session.courts.find((c) => c.id === courtId);
          const released = court?.slots[slotIndex] ?? null;
          const allPlayerIds = new Set(session.players.map((p) => p.id));
          return {
            session: {
              ...session,
              courts: session.courts.map((c) => {
                if (c.id !== courtId) return c;
                const nextSlots = c.slots.map((s, i) => (i === slotIndex ? null : s));
                const nextCourt = { ...c, slots: nextSlots };
                return {
                  ...nextCourt,
                  matchStartedAt: courtIsOngoing(nextCourt, allPlayerIds)
                    ? c.matchStartedAt
                    : undefined,
                };
              }),
              players: session.players.map((p) =>
                p.id === released
                  ? { ...p, status: "idle" as PlayerStatus }
                  : p,
              ),
            },
          };
        });
      },

      assignToQueueSlot(queueId, slotIndex, playerId) {
        set(({ session }) => {
          if (!session.players.find((p) => p.id === playerId)) return { session };
          const prev = session.queue.find((q) =>
            q.id === queueId && q.slots[slotIndex] && q.slots[slotIndex] !== playerId,
          );
          const displacedId = prev?.slots[slotIndex] ?? null;

          const queue = releaseFromQueue(session.queue, playerId).map((q) =>
            q.id === queueId
              ? {
                  ...q,
                  slots: q.slots.map((s, i) => (i === slotIndex ? playerId : s)),
                }
              : q,
          );
          const courts = releaseFromCourts(session.courts, playerId);
          const players = session.players.map((p) => {
            if (p.id === playerId) {
              return { ...p, status: "waiting" as PlayerStatus };
            }
            if (p.id === displacedId) {
              return { ...p, status: "idle" as PlayerStatus };
            }
            return p;
          });
          return { session: { ...session, queue, courts, players } };
        });
      },

      releaseQueueSlot(queueId, slotIndex) {
        set(({ session }) => {
          const q = session.queue.find((q) => q.id === queueId);
          const released = q?.slots[slotIndex] ?? null;
          return {
            session: {
              ...session,
              queue: session.queue.map((qq) =>
                qq.id === queueId
                  ? {
                      ...qq,
                      slots: qq.slots.map((s, i) => (i === slotIndex ? null : s)),
                    }
                  : qq,
              ),
              players: session.players.map((p) =>
                p.id === released
                  ? { ...p, status: "idle" as PlayerStatus }
                  : p,
              ),
            },
          };
        });
      },

      promoteQueueToCourt(queueId, courtId) {
        set(({ session }) => {
          const q = session.queue.find((qq) => qq.id === queueId);
          const court = session.courts.find((c) => c.id === courtId);
          if (!q || !court) return { session };

          const incoming = q.slots.filter(Boolean) as string[];
          const displaced = court.slots.filter(Boolean) as string[];

          // Copy the full incoming layout into the court, null-padded to court.size.
          const next = Array<string | null>(court.size).fill(null);
          for (let i = 0; i < Math.min(q.slots.length, court.size); i++) {
            next[i] = q.slots[i] ?? null;
          }

          const allPlayerIds = new Set(session.players.map((p) => p.id));
          const matchTs = now();
          const courts = session.courts.map((c) => {
            if (c.id !== courtId) return c;
            const nextCourt = { ...c, slots: next };
            return {
              ...nextCourt,
              matchStartedAt: courtIsOngoing(nextCourt, allPlayerIds) ? matchTs : undefined,
            };
          });

          const cleared = { ...q, slots: Array(q.slots.length).fill(null) };
          const queue = [
            ...session.queue.filter((qq) => qq.id !== queueId),
            cleared,
          ];

          const players = session.players.map((p) => {
            if (incoming.includes(p.id)) {
              return { ...p, status: "playing" as PlayerStatus };
            }
            if (displaced.includes(p.id)) {
              return { ...p, status: "idle" as PlayerStatus };
            }
            return p;
          });
          return { session: { ...session, courts, queue, players } };
        });
      },

      dumpQueueToIdle(queueId) {
        set(({ session }) => {
          const q = session.queue.find((qq) => qq.id === queueId);
          if (!q) return { session };
          const ids = q.slots.filter(Boolean) as string[];
          return {
            session: {
              ...session,
              queue: session.queue.map((qq) =>
                qq.id === queueId
                  ? { ...qq, slots: Array(qq.slots.length).fill(null) }
                  : qq,
              ),
              players: session.players.map((p) =>
                ids.includes(p.id)
                  ? { ...p, status: "idle" as PlayerStatus }
                  : p,
              ),
            },
          };
        });
      },

      finishMatch(courtId, _winner) {
        set(({ session }) => {
          const court = session.courts.find((c) => c.id === courtId);
          if (!court) return { session };
          const half = court.size / 2;
          const A = court.slots.slice(0, half).filter(Boolean) as string[];
          const B = court.slots.slice(half).filter(Boolean) as string[];
          const ids = [...A, ...B];

          const players = session.players.map((p) => {
            if (!ids.includes(p.id)) return p;
            return {
              ...p,
              status: "idle" as PlayerStatus,
              statusSince: now(),
              gamesPlayed: (p.gamesPlayed ?? 0) + 1,
            };
          });

          const courts = session.courts.map((c) =>
            c.id === courtId
              ? { ...c, slots: Array(c.size).fill(null), matchStartedAt: undefined }
              : c,
          );
          const matchesCompleted = (session.matchesCompleted ?? 0) + 1;
          return { session: { ...session, courts, players, matchesCompleted } };
        });
      },

      togglePaid(playerId) {
        set(({ session }) => {
          const player = session.players.find((p) => p.id === playerId);
          if (!player) return { session };
          const newPaid = !player.paid;
          // Auto-remove when marking paid and player is already done
          if (newPaid && player.status === "done") {
            return {
              session: {
                ...session,
                players: session.players.filter((p) => p.id !== playerId),
                courts: releaseFromCourts(session.courts, playerId),
                queue: releaseFromQueue(session.queue, playerId),
              },
            };
          }
          return {
            session: {
              ...session,
              players: session.players.map((p) =>
                p.id === playerId ? { ...p, paid: newPaid } : p,
              ),
            },
          };
        });
      },

      setStatus(playerId, status) {
        set(({ session }) => {
          const player = session.players.find((p) => p.id === playerId);
          if (!player) return { session };
          // Auto-remove when marking done and player is already paid
          if (status === "done" && player.paid) {
            return {
              session: {
                ...session,
                players: session.players.filter((p) => p.id !== playerId),
                courts: releaseFromCourts(session.courts, playerId),
                queue: releaseFromQueue(session.queue, playerId),
              },
            };
          }
          const movedToBoard = status === "playing" || status === "waiting";
          const courts = movedToBoard
            ? session.courts
            : releaseFromCourts(session.courts, playerId);
          const queue = movedToBoard
            ? session.queue
            : releaseFromQueue(session.queue, playerId);

          return {
            session: {
              ...session,
              courts,
              queue,
              players: session.players.map((p) => {
                if (p.id !== playerId) return p;
                // Only reset the wait timer when a player re-enters from "done" (fresh start).
                // All other transitions preserve accumulated wait time.
                return { ...p, status, statusSince: p.status === "done" ? now() : p.statusSince };
              }),
            },
          };
        });
      },

      resetAll() {
        set({ session: seed() });
      },

      restoreSession(session) {
        set({ session });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/** Convenience selectors — keep components lean. */
export const selectors = {
  byId(s: Session): Record<string, Player> {
    return Object.fromEntries(s.players.map((p) => [p.id, p]));
  },
  occupiedOnCourts,
  occupiedInQueue,
  idle(s: Session): Player[] {
    return s.players.filter((p) => p.status === "idle");
  },
  waiting(s: Session): Player[] {
    return s.players.filter((p) => p.status === "waiting");
  },
  breakList(s: Session): Player[] {
    return s.players.filter((p) => p.status === "break");
  },
  done(s: Session): Player[] {
    return s.players.filter((p) => p.status === "done");
  },
};
