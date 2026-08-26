"use client";

import { LayoutGrid, List, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PropertyFilterBar } from "@/components/properties/property-filter-bar";
import { PropertyGrid } from "@/components/properties/property-grid";
import { StateCard } from "@/components/ui/state-card";
import { defaultFilters, filterProperties } from "@/lib/filters";
import { properties } from "@/data/properties";

export default function ListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(defaultFilters);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [simulateError, setSimulateError] = useState(false);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      query: searchParams.get("query") ?? "",
      mode: searchParams.get("mode") === "buy" || searchParams.get("mode") === "rent" ? (searchParams.get("mode") as typeof defaultFilters.mode) : "all",
      location: searchParams.get("location") ?? "all",
    }));
  }, [searchParams]);

  const results = useMemo(() => filterProperties(properties, filters), [filters]);

  const syncUrl = (next: typeof defaultFilters) => {
    const params = new URLSearchParams();
    if (next.query) params.set("query", next.query);
    if (next.mode !== "all") params.set("mode", next.mode);
    if (next.location !== "all") params.set("location", next.location);
    const queryString = params.toString();
    router.replace(queryString ? `/listings?${queryString}` : "/listings", { scroll: false });
  };

  return (
    <div className="shell section space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-accent">Property listings</p>
          <h1 className="mt-3 font-display text-5xl text-foreground">Premium homes across high-demand markets.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
            Search by city, price, furnishing, area, and intent while switching between editorial card views and a client-ready list view.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSimulateError((current) => !current)}
            className="rounded-full border border-line px-4 py-3 text-sm text-foreground transition hover:border-danger/30 hover:bg-danger/5"
          >
            {simulateError ? "Resolve error state" : "Simulate error state"}
          </button>
          <div className="inline-flex rounded-full border border-line bg-panel p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`rounded-full px-4 py-2 transition ${view === "grid" ? "bg-accent text-slate-950 shadow-md shadow-accent/25" : "text-muted hover:bg-foreground/5"}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-full px-4 py-2 transition ${view === "list" ? "bg-accent text-slate-950 shadow-md shadow-accent/25" : "text-muted hover:bg-foreground/5"}`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <PropertyFilterBar
        filters={filters}
        resultCount={results.length}
        onApply={(next) => {
          setFilters(next);
          syncUrl(next);
        }}
        onReset={() => {
          setFilters(defaultFilters);
          syncUrl(defaultFilters);
        }}
      />

      {simulateError ? (
        <div className="rounded-[2rem] border border-danger/20 bg-danger/5 p-8">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-1 h-5 w-5 text-danger" />
            <div>
              <h2 className="font-display text-3xl text-foreground">Listing sync interrupted</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                This error state demonstrates how the interface handles a temporary data issue while keeping the rest of the experience stable.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!simulateError && results.length === 0 ? (
        <StateCard
          title="No properties match this search."
          description="Adjust price, bedrooms, or location filters to broaden the results and discover more homes."
          actionLabel="Reset and view all"
          action={() => setFilters(defaultFilters)}
        />
      ) : null}

      {!simulateError && results.length > 0 ? <PropertyGrid properties={results} view={view} /> : null}
    </div>
  );
}
