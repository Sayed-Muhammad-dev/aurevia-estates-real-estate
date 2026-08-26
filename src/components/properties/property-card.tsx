"use client";

import { Bath, BedDouble, Heart, MapPin, Ruler, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { agents } from "@/data/agents";
import { useSaved } from "@/components/providers/saved-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Property } from "@/types";

export function PropertyCard({
  property,
  view = "grid",
}: {
  property: Property;
  view?: "grid" | "list";
}) {
  const { saved, toggleSaved } = useSaved();
  const { showToast } = useToast();
  const isSaved = saved.includes(property.id);
  const agent = agents.find((entry) => entry.id === property.agentId);

  const handleSave = () => {
    const next = toggleSaved(property.id);
    showToast(
      next ? "Property saved" : "Property removed",
      next
        ? `${property.title} has been added to your saved properties.`
        : `${property.title} has been removed from your saved properties.`,
    );
  };

  return (
    <article
      className={`group overflow-hidden rounded-[2rem] border border-line bg-panel shadow-luxury transition duration-300 hover:-translate-y-1 hover:shadow-float ${
        view === "list" ? "grid gap-0 lg:grid-cols-[360px,1fr]" : ""
      }`}
    >
      <div className="relative overflow-hidden">
        <Image
          src={property.images[0]}
          alt={property.coverAlt}
          width={1200}
          height={900}
          className={`object-cover transition duration-700 group-hover:scale-105 ${
            view === "list" ? "h-full min-h-[280px] w-full" : "h-72 w-full"
          }`}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <Badge tone={property.featured ? "accent" : "default"}>{property.status}</Badge>
          <button
            type="button"
            onClick={handleSave}
            className={`rounded-full p-3 backdrop-blur ${
              isSaved ? "bg-accent text-slate-950" : "bg-slate-950/40 text-white"
            }`}
            aria-label={isSaved ? "Remove saved property" : "Save property"}
          >
            <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {formatPrice(property.price, property.mode)}
            </p>
            <Link
              href={`/properties/${property.slug}`}
              className="mt-2 block font-display text-3xl text-foreground transition hover:text-accent"
            >
              {property.title}
            </Link>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted">
              <MapPin className="h-4 w-4" />
              <span>
                {property.area}, {property.city}
              </span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-3 py-2 text-sm text-foreground">
            <Star className="h-4 w-4 fill-accent text-accent" />
            {property.rating.toFixed(1)}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl border border-line bg-background/70 p-4 text-sm text-muted">
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-accent" />
            <span>{property.bedrooms} Beds</span>
          </div>
          <div className="flex items-center gap-2">
            <Bath className="h-4 w-4 text-accent" />
            <span>{property.bathrooms} Baths</span>
          </div>
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-accent" />
            <span>{property.areaSqft.toLocaleString()} sqft</span>
          </div>
        </div>

        <p className="mt-5 line-clamp-3 text-sm leading-7 text-muted">{property.description}</p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {property.keyFeatures.slice(0, 2).map((feature) => (
              <Badge key={feature}>{feature}</Badge>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={`/properties/${property.slug}`} variant="secondary" className="flex-1 min-w-[10rem]">
            View Property
          </Button>
          <Button href={`/booking?property=${property.slug}`} className="flex-1 min-w-[10rem]">
            Book Visit
          </Button>
          {agent ? (
            <Button href={`/contact?agent=${agent.slug}&property=${property.slug}`} variant="ghost" className="min-w-[10rem]">
              Contact Agent
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
