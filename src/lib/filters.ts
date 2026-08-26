import { Property } from "@/types";

export interface ListingFilters {
  query: string;
  mode: "all" | "buy" | "rent";
  type: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  bathrooms: number;
  minArea: number;
  location: string;
  furnished: "all" | "furnished" | "unfurnished";
  parking: number;
  featuredOnly: boolean;
  sort: "latest" | "price-low" | "price-high" | "most-viewed" | "best-rated";
}

export const defaultFilters: ListingFilters = {
  query: "",
  mode: "all",
  type: "all",
  minPrice: 0,
  maxPrice: 15000000,
  bedrooms: 0,
  bathrooms: 0,
  minArea: 0,
  location: "all",
  furnished: "all",
  parking: 0,
  featuredOnly: false,
  sort: "latest",
};

export function filterProperties(properties: Property[], filters: ListingFilters) {
  const filtered = properties.filter((property) => {
    const query = filters.query.trim().toLowerCase();
    const matchesQuery =
      query.length === 0 ||
      [property.title, property.city, property.area, property.address, property.type]
        .join(" ")
        .toLowerCase()
        .includes(query);

    const matchesMode = filters.mode === "all" || property.mode === filters.mode;
    const matchesType = filters.type === "all" || property.type === filters.type;
    const matchesPrice = property.price >= filters.minPrice && property.price <= filters.maxPrice;
    const matchesBedrooms = property.bedrooms >= filters.bedrooms;
    const matchesBathrooms = property.bathrooms >= filters.bathrooms;
    const matchesArea = property.areaSqft >= filters.minArea;
    const matchesLocation = filters.location === "all" || property.city === filters.location;
    const matchesFurnished =
      filters.furnished === "all" ||
      (filters.furnished === "furnished" ? property.furnished : !property.furnished);
    const matchesParking = property.parking >= filters.parking;
    const matchesFeatured = !filters.featuredOnly || property.featured;

    return (
      matchesQuery &&
      matchesMode &&
      matchesType &&
      matchesPrice &&
      matchesBedrooms &&
      matchesBathrooms &&
      matchesArea &&
      matchesLocation &&
      matchesFurnished &&
      matchesParking &&
      matchesFeatured
    );
  });

  return filtered.sort((a, b) => {
    switch (filters.sort) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "most-viewed":
        return b.views - a.views;
      case "best-rated":
        return b.rating - a.rating;
      default:
        return Number(b.featured) - Number(a.featured);
    }
  });
}
