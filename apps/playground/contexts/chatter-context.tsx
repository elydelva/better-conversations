"use client";

import { getAuthChatterId, setAuthChatterId } from "@/lib/auth-header";
import type { Chatter } from "@better-conversation/core";
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
    setAuthChatterId(chatter?.id ?? null);
    if (chatter) {
      localStorage.setItem(STORAGE_KEY, chatter.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const storedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  useEffect(() => {
    setAuthChatterId(activeChatter?.id ?? storedId);
  }, [activeChatter, storedId]);

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
