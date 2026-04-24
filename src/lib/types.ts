export type Level =
  | "beginner"
  | "low-intermediate"
  | "intermediate"
  | "upper-intermediate"
  | "advanced"
  | "professional";

export type Gender = "male" | "female";

/** Canonical player lifecycle.
 *  - idle:    available, in sidebar, not committed to a court/queue
 *  - waiting: placed on a queue card, awaiting court assignment
 *  - playing: on an active court slot
 *  - break:   off the floor, timers unmonitored
 *  - done:    finished for the session, payment tracked
 */
export type PlayerStatus = "idle" | "waiting" | "playing" | "break" | "done";

export type CourtSize = 2 | 4;

export type Player = {
  id: string;
  name: string;
  gender: Gender;
  level: Level;
  status: PlayerStatus;
  paid: boolean;
  arrivedAt: number;
  /** Timestamp the current status began — drives all section timers. */
  statusSince: number;
  gamesPlayed: number;
};

export type Court = {
  id: string;
  number: number;
  size: CourtSize;
  slots: (string | null)[];
  matchStartedAt?: number;
};

export type QueueCard = {
  id: string;
  size: CourtSize;
  slots: (string | null)[];
};

export type Session = {
  courts: Court[];
  queue: QueueCard[];
  players: Player[];
  matchesCompleted: number;
};

export const LEVELS: Level[] = [
  "beginner",
  "low-intermediate",
  "intermediate",
  "upper-intermediate",
  "advanced",
  "professional",
];

export const LEVEL_LABEL: Record<Level, string> = {
  "beginner": "BEG",
  "low-intermediate": "L-INT",
  "intermediate": "INT",
  "upper-intermediate": "U-INT",
  "advanced": "ADV",
  "professional": "PRO",
};

export const LEVEL_FULL_LABEL: Record<Level, string> = {
  "beginner": "Beginner",
  "low-intermediate": "Low-Intermediate",
  "intermediate": "Intermediate",
  "upper-intermediate": "Upper-Intermediate",
  "advanced": "Advanced",
  "professional": "Professional",
};

/** Numeric skill ranking — used for "Best Player" tie-breakers. */
export const LEVEL_RANK: Record<Level, number> = {
  "beginner": 1,
  "low-intermediate": 2,
  "intermediate": 3,
  "upper-intermediate": 4,
  "advanced": 5,
  "professional": 6,
};

export const GENDER_LABEL: Record<Gender, string> = {
  male: "Male",
  female: "Female",
};

export function courtStatus(
  court: Court,
  byId: Record<string, Player>,
): "ongoing" | "vacant" {
  const half = court.size / 2;
  const teamA = court.slots.slice(0, half).filter((id) => id && byId[id]);
  const teamB = court.slots.slice(half).filter((id) => id && byId[id]);
  return teamA.length > 0 && teamB.length > 0 ? "ongoing" : "vacant";
}
