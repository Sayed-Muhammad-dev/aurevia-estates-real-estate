import { Property } from "@/types";
import { PropertyCard } from "@/components/properties/property-card";

export function PropertyGrid({
  properties,
  view = "grid",
}: {
  properties: Property[];
  view?: "grid" | "list";
}) {
  return (
    <div className={view === "grid" ? "stagger-grid grid gap-6 md:grid-cols-2 xl:grid-cols-3" : "stagger-grid space-y-6"}>
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} view={view} />
      ))}
    </div>
  );
}
