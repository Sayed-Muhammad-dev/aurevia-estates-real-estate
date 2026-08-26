export type PropertyStatus = "For Sale" | "For Rent" | "Featured";
export type PropertyMode = "buy" | "rent";
export type PropertyType =
  | "Penthouse"
  | "Villa"
  | "Apartment"
  | "Townhouse"
  | "Waterfront"
  | "Loft";

export type Amenity =
  | "Private Pool"
  | "Concierge"
  | "Smart Home"
  | "Home Office"
  | "Gym"
  | "Cinema"
  | "Sea View"
  | "Rooftop"
  | "Parking"
  | "Pet Friendly";

export interface Agent {
  id: string;
  slug: string;
  name: string;
  title: string;
  image: string;
  experience: number;
  activeListings: number;
  rating: number;
  reviews: number;
  languages: string[];
  phone: string;
  email: string;
  specialization: string[];
  bio: string;
  serviceAreas: string[];
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  city: string;
  area: string;
  address: string;
  mode: PropertyMode;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  yearBuilt: number;
  furnished: boolean;
  parking: number;
  featured: boolean;
  rating: number;
  views: number;
  images: string[];
  coverAlt: string;
  description: string;
  keyFeatures: string[];
  amenities: Amenity[];
  nearby: { name: string; distance: string; type: string }[];
  floorPlan: {
    label: string;
    description: string;
    dimensions: string;
  };
  coordinates: { x: number; y: number };
  agentId: string;
}

export interface Review {
  id: string;
  name: string;
  role: string;
  quote: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface MarketStat {
  label: string;
  value: string;
  detail: string;
}
