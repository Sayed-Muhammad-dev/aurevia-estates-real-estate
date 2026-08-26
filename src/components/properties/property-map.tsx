"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Property } from "@/types";
import { formatPrice } from "@/lib/utils";

export function PropertyMap({
  properties,
  initialId,
}: {
  properties: Property[];
  initialId?: string;
}) {
  const [selectedId, setSelectedId] = useState(initialId ?? properties[0]?.id);
  const selected = useMemo(
    () => properties.find((property) => property.id === selectedId) ?? properties[0],
    [properties, selectedId],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
      <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-line bg-grid-fade bg-[size:100%_100%,32px_32px,32px_32px] bg-center bg-panel p-6">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute left-[10%] top-[14%] h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-[18%] right-[12%] h-52 w-52 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="absolute left-[38%] top-[32%] h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-wrap gap-2">
            {["Prime Coastal", "Urban Core", "Family Estates", "Rental Hotspots"].map((item) => (
              <span key={item} className="rounded-full border border-line bg-background/75 px-4 py-2 text-xs uppercase tracking-[0.24em] text-muted">
                {item}
              </span>
            ))}
          </div>

          {properties.map((property) => (
            <button
              key={property.id}
              type="button"
              onClick={() => setSelectedId(property.id)}
              className="group absolute"
              style={{ left: `${property.coordinates.x}%`, top: `${property.coordinates.y}%` }}
              aria-label={`Select ${property.title}`}
            >
              <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/30 animate-ring" />
              <span
                className={`relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-luxury transition ${
                  selectedId === property.id ? "scale-105 border-accent bg-accent text-slate-950" : "border-line bg-panel text-foreground hover:-translate-y-1 hover:border-accent/40"
                }`}
              >
                <MapPin className="h-4 w-4" />
                {formatPrice(property.price, property.mode)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
        {selected ? (
          <>
            <p className="text-sm uppercase tracking-[0.3em] text-accent">Selected property</p>
            <h3 className="mt-3 font-display text-4xl text-foreground">{selected.title}</h3>
            <p className="mt-2 text-sm text-muted">
              {selected.area}, {selected.city}
            </p>
            <div className="mt-4 inline-flex rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
              {formatPrice(selected.price, selected.mode)}
            </div>
            <p className="mt-5 text-sm leading-7 text-muted">{selected.description}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {selected.keyFeatures.map((feature) => (
                <div key={feature} className="rounded-2xl border border-line bg-background/60 px-4 py-3 text-sm text-foreground">
                  {feature}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-line bg-background/60 p-4">
              <p className="text-sm font-medium text-foreground">Nearby areas</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
                {selected.nearby.map((item) => (
                  <span key={item.name} className="rounded-full bg-foreground/5 px-3 py-2">
                    {item.name} · {item.distance}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href={`/properties/${selected.slug}`} variant="secondary">
                View Property
              </Button>
              <Button href={`/booking?property=${selected.slug}`}>Book Visit</Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
