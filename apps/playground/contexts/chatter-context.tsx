"use client";

import type { Chatter } from "@/lib/api";
import type React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "playground-active-chatter-id";

type ChatterContextValue = {
  activeChatter: Chatter | null;
  setActiveChatter: (chatter: Chatter | null) => void;
  activeChatterId: string | null;
};

const ChatterContext = createContext<ChatterContextValue | null>(null);

export function ChatterProvider({ children }: { children: React.ReactNode }) {
  const [activeChatter, setActiveChatterState] = useState<Chatter | null>(null);

  const setActiveChatter = useCallback((chatter: Chatter | null) => {
    setActiveChatterState(chatter);
    if (chatter) {
      localStorage.setItem(STORAGE_KEY, chatter.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Restore from localStorage on mount - caller must fetch and pass chatter if needed
  const storedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  useEffect(() => {
    if (storedId && !activeChatter) {
      // Don't auto-fetch - let pages that need it call chattersApi.find
      // We just clear if it was stale
    }
  }, [storedId, activeChatter]);

  return (
    <ChatterContext.Provider
      value={{
        activeChatter,
        setActiveChatter,
        activeChatterId: activeChatter?.id ?? storedId,
      }}
    >
      {children}
    </ChatterContext.Provider>
  );
}

export function useActiveChatter() {
  const ctx = useContext(ChatterContext);
  if (!ctx) {
    throw new Error("useActiveChatter must be used within ChatterProvider");
  }
  return ctx;
}
