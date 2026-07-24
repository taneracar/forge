import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  hasProfile: boolean | null;
  setSession: (session: Session | null) => void;
  setHasProfile: (hasProfile: boolean | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  hasProfile: null,
  setSession: (session) => set({ session, isLoading: false }),
  setHasProfile: (hasProfile) => set({ hasProfile }),
}));
