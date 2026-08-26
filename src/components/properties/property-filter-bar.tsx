"use client";

import { SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { ListingFilters } from "@/lib/filters";
import { Button } from "@/components/ui/button";

interface Props {
  filters: ListingFilters;
  resultCount: number;
  onApply: (filters: ListingFilters) => void;
  onReset: () => void;
}

export function PropertyFilterBar({ filters, resultCount, onApply, onReset }: Props) {
  const [draft, setDraft] = useState(filters);
  const [open, setOpen] = useState(true);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  // Collapse the expanded panel once the bar sticks, so it does not cover the
  // results it is filtering. The sentinel sits above the bar; when it leaves
  // the viewport the bar has reached its sticky offset.
  useEffect(() => {
    const sentinel = document.getElementById("filter-bar-sentinel");
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isStuck = !entry.isIntersecting;
        setStuck(isStuck);
        if (isStuck) setOpen(false);
      },
      { rootMargin: "-88px 0px 0px 0px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
    <div id="filter-bar-sentinel" aria-hidden className="h-px w-full" />
    <div
      className={`sticky top-[72px] z-30 rounded-[2rem] border border-line bg-panel/95 p-5 backdrop-blur-xl transition-shadow duration-300 ${
        stuck ? "shadow-float" : "shadow-luxury"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex items-center gap-2 text-left text-sm uppercase tracking-[0.24em] text-accent transition hover:opacity-80"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Advanced filters
          </button>
          <p className="mt-2 text-sm text-muted">{resultCount} properties match your current criteria.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={onReset}>
            Reset filters
          </Button>
          <Button type="button" onClick={() => onApply(draft)}>
            Apply filters
          </Button>
        </div>
      </div>

      <div className={`grid overflow-hidden transition-all duration-300 ${open ? "mt-5 max-h-[120rem] opacity-100" : "max-h-0 opacity-0"}`}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2 text-sm text-muted">
          <span>Search</span>
          <input
            value={draft.query}
            onChange={(event) => setDraft((current) => ({ ...current, query: event.target.value }))}
            className="field"
            placeholder="City, area, address, property type"
          />
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span>Buy / Rent</span>
          <select
            value={draft.mode}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                mode: event.target.value as ListingFilters["mode"],
              }))
            }
            className="field"
          >
            <option value="all">All</option>
            <option value="buy">Buy</option>
            <option value="rent">Rent</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span>Property type</span>
          <select
            value={draft.type}
            onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
            className="field"
          >
            <option value="all">All types</option>
            <option value="Villa">Villa</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Townhouse">Townhouse</option>
            <option value="Apartment">Apartment</option>
            <option value="Waterfront">Waterfront</option>
            <option value="Loft">Loft</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span>Location</span>
          <select
            value={draft.location}
            onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
            className="field"
          >
            <option value="all">All locations</option>
            <option value="Malibu">Malibu</option>
            <option value="New York">New York</option>
            <option value="Miami">Miami</option>
            <option value="Austin">Austin</option>
            <option value="Los Angeles">Los Angeles</option>
            <option value="Scottsdale">Scottsdale</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span>Min price</span>
          <input
            type="number"
            value={draft.minPrice}
            onChange={(event) =>
              setDraft((current) => ({ ...current, minPrice: Number(event.target.value) || 0 }))
            }
            className="field"
          />
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span>Max price</span>
          <input
            type="number"
            value={draft.maxPrice}
            onChange={(event) =>
              setDraft((current) => ({ ...current, maxPrice: Number(event.target.value) || 0 }))
            }
            className="field"
          />
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span>Bedrooms</span>
          <select
            value={draft.bedrooms}
            onChange={(event) =>
              setDraft((current) => ({ ...current, bedrooms: Number(event.target.value) }))
            }
            className="field"
          >
            <option value={0}>Any</option>
            <option value={1}>1+</option>
            <option value={2}>2+</option>
            <option value={3}>3+</option>
            <option value={4}>4+</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span>Bathrooms</span>
          <select
            value={draft.bathrooms}
            onChange={(event) =>
              setDraft((current) => ({ ...current, bathrooms: Number(event.target.value) }))
            }
            className="field"
          >
            <option value={0}>Any</option>
            <option value={1}>1+</option>
            <option value={2}>2+</option>
            <option value={3}>3+</option>
            <option value={4}>4+</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span>Area size (sqft)</span>
          <input
            type="number"
            value={draft.minArea}
            onChange={(event) =>
              setDraft((current) => ({ ...current, minArea: Number(event.target.value) || 0 }))
            }
            className="field"
          />
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span>Furnished</span>
          <select
            value={draft.furnished}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                furnished: event.target.value as ListingFilters["furnished"],
              }))
            }
            className="field"
          >
            <option value="all">Any</option>
            <option value="furnished">Furnished</option>
            <option value="unfurnished">Unfurnished</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span>Parking spaces</span>
          <select
            value={draft.parking}
            onChange={(event) =>
              setDraft((current) => ({ ...current, parking: Number(event.target.value) }))
            }
            className="field"
          >
            <option value={0}>Any</option>
            <option value={1}>1+</option>
            <option value={2}>2+</option>
            <option value={3}>3+</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-muted">
          <span>Sort by</span>
          <select
            value={draft.sort}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                sort: event.target.value as ListingFilters["sort"],
              }))
            }
            className="field"
          >
            <option value="latest">Latest</option>
            <option value="price-low">Price low to high</option>
            <option value="price-high">Price high to low</option>
            <option value="most-viewed">Most viewed</option>
            <option value="best-rated">Best rated</option>
          </select>
        </label>
      </div>

      <label className="mt-4 inline-flex items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={draft.featuredOnly}
          onChange={(event) =>
            setDraft((current) => ({ ...current, featuredOnly: event.target.checked }))
          }
          className="h-4 w-4 rounded border-line bg-background text-accent focus:ring-accent/30"
        />
        Featured only
      </label>
      </div>
    </div>
    </>
  );
}
