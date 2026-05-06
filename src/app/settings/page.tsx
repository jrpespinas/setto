import type { Metadata } from "next";
import { Shell } from "@/components/shell/shell";
import { FeesForm } from "@/components/settings/fees-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <Shell>
      <FeesForm />
    </Shell>
  );
}
