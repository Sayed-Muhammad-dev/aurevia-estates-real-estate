import { PropertyMap } from "@/components/properties/property-map";
import { properties } from "@/data/properties";

export default function SearchPage() {
  return (
    <div className="shell section space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Interactive map search</p>
        <h1 className="mt-3 font-display text-5xl text-foreground">Search visually across prime neighborhoods.</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
          Explore a polished map-style interface with property pins, nearby area highlights, and a focused preview panel for fast market scanning.
        </p>
      </div>
      <PropertyMap properties={properties} />
    </div>
  );
}
