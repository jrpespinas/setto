"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// SHA-256("setto-v1" + "QUEUEING-OVERRIDE") — plaintext never ships to the client
export const MASTER_OVERRIDE_HASH = "70023b459bcc3556910f3c884e47ed524b04a9cdd1291a2d92fbb97f87a79822";

type AuthState = {
  passwordHash: string | null;
  hint: string;
  hydrated: boolean;
  setup: (hash: string, hint: string) => void;
  changePassword: (newHash: string, newHint: string) => void;
  _setHydrated: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      passwordHash: null,
      hint: "",
      hydrated: false,

      setup(hash, hint) {
        set({ passwordHash: hash, hint });
      },

      changePassword(newHash, newHint) {
        set({ passwordHash: newHash, hint: newHint });
      },

      _setHydrated() {
        set({ hydrated: true });
      },
    }),
    {
      name: "setto-auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    },
  ),
);
