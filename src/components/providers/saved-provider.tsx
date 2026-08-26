"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface SavedContextValue {
  saved: string[];
  toggleSaved: (id: string) => boolean;
  removeSaved: (id: string) => void;
  clearSaved: () => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem("aurevia-saved");
    if (stored) {
      setSaved(JSON.parse(stored));
    }
  }, []);

  const sync = (next: string[]) => {
    setSaved(next);
    window.localStorage.setItem("aurevia-saved", JSON.stringify(next));
  };

  const value = useMemo(
    () => ({
      saved,
      toggleSaved: (id: string) => {
        const exists = saved.includes(id);
        const next = exists ? saved.filter((item) => item !== id) : [...saved, id];
        sync(next);
        return !exists;
      },
      removeSaved: (id: string) => sync(saved.filter((item) => item !== id)),
      clearSaved: () => sync([]),
    }),
    [saved],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const context = useContext(SavedContext);

  if (!context) {
    throw new Error("useSaved must be used within SavedProvider");
  }

  return context;
}
