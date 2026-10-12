"use client";

import { useMemo, useState } from "react";
import { Scale, Trash2 } from "lucide-react";
import { useSaved } from "@/components/providers/saved-provider";
import { PropertyGrid } from "@/components/properties/property-grid";
import { Button } from "@/components/ui/button";
import { StateCard } from "@/components/ui/state-card";
import { useProperties } from "@/components/providers/property-data";
import { formatPrice } from "@/lib/utils";

export default function SavedPage() {
  const properties = useProperties();
  const { saved, saving, clearSaved } = useSaved();
  const [compare, setCompare] = useState<string[]>([]);
  const items = useMemo(
    () => properties.filter((property) => saved.includes(property.id)),
    [saved, properties],
  );
  const compareItems = properties
    .filter((property) => compare.includes(property.id))
    .slice(0, 2);

  return (
    <div className="shell section space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent">
            Saved properties
          </p>
          <h1 className="mt-3 font-display text-5xl text-foreground">
            Shortlist homes worth revisiting.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
            Your saved list supports faster decision-making with compare-ready
            pricing, sizes, and key home attributes.
          </p>
        </div>
        {items.length > 0 ? (
          <Button
            onClick={() => void clearSaved()}
            disabled={saving}
            variant="secondary"
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear saved
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <StateCard
          title="Your saved list is empty."
          description="Start exploring listings and save properties to build a shortlist for tours, comparisons, and financing review."
          actionLabel="Browse listings"
          actionHref="/listings"
        />
      ) : (
        <>
          <div className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-accent" />
              <h2 className="font-display text-3xl text-foreground">
                Compare properties
              </h2>
            </div>
            <p className="mt-3 text-sm text-muted">
              Select up to two homes to compare pricing, area, and bedrooms side
              by side.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {items.map((property) => (
                <label
                  key={property.id}
                  className="flex items-center justify-between rounded-2xl border border-line bg-background/60 px-4 py-3 text-sm text-foreground"
                >
                  <span>{property.title}</span>
                  <input
                    type="checkbox"
                    checked={compare.includes(property.id)}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setCompare((current) => [
                          ...current.slice(-1),
                          property.id,
                        ]);
                      } else {
                        setCompare((current) =>
                          current.filter((item) => item !== property.id),
                        );
                      }
                    }}
                    className="h-4 w-4 rounded border-line text-accent"
                  />
                </label>
              ))}
            </div>
            {compareItems.length > 0 ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {compareItems.map((property) => (
                  <div
                    key={property.id}
                    className="rounded-[1.75rem] border border-line bg-background/80 p-5"
                  >
                    <h3 className="font-display text-3xl text-foreground">
                      {property.title}
                    </h3>
                    <div className="mt-4 space-y-2 text-sm text-muted">
                      <p>
                        Price:{" "}
                        <span className="text-foreground">
                          {formatPrice(property.price, property.mode)}
                        </span>
                      </p>
                      <p>
                        Bedrooms:{" "}
                        <span className="text-foreground">
                          {property.bedrooms}
                        </span>
                      </p>
                      <p>
                        Bathrooms:{" "}
                        <span className="text-foreground">
                          {property.bathrooms}
                        </span>
                      </p>
                      <p>
                        Area:{" "}
                        <span className="text-foreground">
                          {property.areaSqft.toLocaleString()} sqft
                        </span>
                      </p>
                      <p>
                        Parking:{" "}
                        <span className="text-foreground">
                          {property.parking}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <PropertyGrid properties={items} />
        </>
      )}
    </div>
  );
}
