"use client";
import { createContext, useContext, useState } from "react";
import type { Property, Agent } from "@/types";
import { applicationRequest } from "@/lib/application";
type Catalog = { properties: Property[]; agents: Agent[] };
const CatalogContext = createContext<
  (Catalog & { error: string; refresh: () => Promise<void> }) | null
>(null);
export function PropertyDataProvider({
  initial,
  children,
}: {
  initial: Catalog;
  children: React.ReactNode;
}) {
  const [catalog, setCatalog] = useState(initial);
  const [error, setError] = useState("");
  const refresh = async () => {
    try {
      const data = await applicationRequest<{ collections: Catalog }>("public");
      setCatalog(data.collections);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Listings could not be refreshed.",
      );
    }
  };
  return (
    <CatalogContext.Provider value={{ ...catalog, error, refresh }}>
      {children}
    </CatalogContext.Provider>
  );
}
export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("Catalog provider is required.");
  return value;
}
export function useProperties() {
  return useCatalog().properties;
}
export function useAgents() {
  return useCatalog().agents;
}
