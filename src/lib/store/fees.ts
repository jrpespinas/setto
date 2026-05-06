"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FeesConfig } from "@/lib/types";

type FeesState = {
  config: FeesConfig;
  frozenCourtCost: number | null; // set when End Session fires, clears courts
  setConfig: (patch: Partial<FeesConfig>) => void;
  freezeCourtCost: (cost: number) => void;
  resetSessionFees: () => void; // called by resetAll — clears frozenCourtCost only
};

export const useFeesStore = create<FeesState>()(
  persist(
    (set) => ({
      config: { courtFeePerHour: 0, playerFee: null },
      frozenCourtCost: null,

      setConfig(patch) {
        set((state) => ({ config: { ...state.config, ...patch } }));
      },

      freezeCourtCost(cost) {
        set({ frozenCourtCost: cost });
      },

      resetSessionFees() {
        set({ frozenCourtCost: null });
      },
    }),
    {
      name: "setto-fees",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
