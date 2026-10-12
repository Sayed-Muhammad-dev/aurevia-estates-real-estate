"use client";
import { applicationRequest } from "@/lib/application";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useToast } from "./toast-provider";
type Favorite = { _id: string; _version: number; propertyId: string };
interface SavedContextValue {
  saved: string[];
  saving: boolean;
  toggleSaved: (id: string) => Promise<boolean>;
  removeSaved: (id: string) => Promise<void>;
  clearSaved: () => Promise<void>;
}
const SavedContext = createContext<SavedContextValue | null>(null);
function guestSaved(): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("aurevia-saved") || "[]",
    );
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}
export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);
  const [saving, setSaving] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const serverFavorites = useRef<Favorite[]>([]);
  const pending = useRef(false);
  const ready = useRef(false);
  const { showToast } = useToast();
  useEffect(() => {
    let active = true;
    applicationRequest<{ user: unknown }>("session")
      .then(async (session) => {
        if (session.user) {
          const data = await applicationRequest<{
            collections: { favorites: Favorite[] };
          }>("state");
          if (!active) return;
          setSignedIn(true);
          serverFavorites.current = data.collections.favorites;
          setSaved(data.collections.favorites.map((x) => x.propertyId));
        } else if (active) setSaved(guestSaved());
        if (active) ready.current = true;
      })
      .catch(() => {
        if (active)
          showToast(
            "Saved homes unavailable",
            "Please refresh before changing your saved homes.",
          );
      })
      .finally(() => {
        if (active) setSaving(!ready.current);
      });
    return () => {
      active = false;
    };
  }, [showToast]);
  async function sync(next: string[]) {
    if (!ready.current || pending.current || saving)
      throw new Error("Please wait for the current saved-home request.");
    pending.current = true;
    setSaving(true);
    try {
      if (signedIn) {
        const removed = serverFavorites.current.filter(
          (x) => !next.includes(x.propertyId),
        );
        const added = next.filter(
          (id) => !serverFavorites.current.some((x) => x.propertyId === id),
        );
        for (const row of removed) {
          const response = await fetch(
            "/api/app/records/favorites/" + row._id,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ version: row._version }),
            },
          );
          if (!response.ok)
            throw new Error(
              (await response.json()).error || "Could not remove saved home.",
            );
        }
        for (const propertyId of added)
          await applicationRequest("records/favorites", {
            value: { propertyId },
          });
        const data = await applicationRequest<{
          collections: { favorites: Favorite[] };
        }>("state");
        serverFavorites.current = data.collections.favorites;
        setSaved(data.collections.favorites.map((x) => x.propertyId));
      } else {
        localStorage.setItem("aurevia-saved", JSON.stringify(next));
        setSaved(next);
      }
    } catch (error) {
      if (signedIn) {
        const data = await applicationRequest<{
          collections: { favorites: Favorite[] };
        }>("state").catch(() => null);
        if (data) {
          serverFavorites.current = data.collections.favorites;
          setSaved(data.collections.favorites.map((x) => x.propertyId));
        }
      }
      throw error;
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  async function clearSaved() {
    try {
      await sync([]);
    } catch (error) {
      showToast(
        "Saved homes not changed",
        error instanceof Error ? error.message : "Please retry.",
      );
    }
  }
  return (
    <SavedContext.Provider
      value={{
        saved,
        saving,
        toggleSaved: async (id) => {
          const exists = saved.includes(id);
          await sync(exists ? saved.filter((x) => x !== id) : [...saved, id]);
          return !exists;
        },
        removeSaved: async (id) => sync(saved.filter((x) => x !== id)),
        clearSaved,
      }}
    >
      {children}
    </SavedContext.Provider>
  );
}
export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) throw new Error("useSaved must be used within SavedProvider");
  return context;
}
