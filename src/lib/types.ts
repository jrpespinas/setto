export type Level =
  | "beginner"
  | "low-intermediate"
  | "intermediate"
  | "upper-intermediate"
  | "advanced"
  | "professional";

export type Gender = "male" | "female";

export type PlayerStatus = "playing" | "done" | "break";

export type CourtSize = 2 | 4;

export type Player = {
  id: string;
  name: string;
  gender: Gender;
  level: Level;
  status: PlayerStatus;
  paid: boolean;
  arrivedAt: number;
  waitingSince: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
};

export type Court = {
  id: string;
  number: number;
  size: CourtSize;
  slots: (string | null)[];
};

export type Session = {
  courts: Court[];
  players: Player[];
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
