import type { Metadata } from "next";
import { Shell } from "@/components/shell/shell";
import { PlayerTable } from "@/components/roster/player-table";

export const metadata: Metadata = { title: "Roster" };

export default function RosterPage() {
  return (
    <Shell>
      <PlayerTable />
    </Shell>
  );
}
