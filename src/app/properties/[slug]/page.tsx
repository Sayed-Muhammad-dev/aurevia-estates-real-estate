import { Bath, BedDouble, Building2, CarFront, MapPin, Ruler } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { agents } from "@/data/agents";
import { properties } from "@/data/properties";
import { MortgageCalculator } from "@/components/calculator/mortgage-calculator";
import { BookingForm } from "@/components/booking/booking-form";
import { PropertyDetailActions } from "@/components/properties/property-detail-actions";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { PropertyGrid } from "@/components/properties/property-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export function generateStaticParams() {
  return properties.map((property) => ({ slug: property.slug }));
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = properties.find((entry) => entry.slug === slug);
  if (!property) notFound();

  const agent = agents.find((entry) => entry.id === property.agentId);
  const similar = properties.filter((entry) => entry.id !== property.id && entry.city === property.city).slice(0, 3);

  return (
    <div className="shell section space-y-10">
      <div className="grid gap-10 xl:grid-cols-[1.15fr,0.85fr]">
        <PropertyGallery images={property.images} alt={property.coverAlt} />
        <div>
          <Badge tone={property.featured ? "accent" : "default"}>{property.status}</Badge>
          <h1 className="mt-4 font-display text-5xl text-foreground">{property.title}</h1>
          <div className="mt-3 flex items-center gap-2 text-muted">
            <MapPin className="h-4 w-4 text-accent" />
            <span>
              {property.address}, {property.area}
            </span>
          </div>
          <p className="mt-6 text-4xl font-semibold text-foreground">{formatPrice(property.price, property.mode)}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 rounded-[2rem] border border-line bg-panel p-5 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <BedDouble className="h-5 w-5 text-accent" />
              <span>{property.bedrooms} Beds</span>
            </div>
            <div className="flex items-center gap-3">
              <Bath className="h-5 w-5 text-accent" />
              <span>{property.bathrooms} Baths</span>
            </div>
            <div className="flex items-center gap-3">
              <Ruler className="h-5 w-5 text-accent" />
              <span>{property.areaSqft.toLocaleString()} sqft</span>
            </div>
            <div className="flex items-center gap-3">
              <CarFront className="h-5 w-5 text-accent" />
              <span>{property.parking} Parking</span>
            </div>
          </div>

          <p className="mt-6 text-base leading-8 text-muted">{property.description}</p>

          <PropertyDetailActions
            propertyId={property.id}
            propertyTitle={property.title}
            propertySlug={property.slug}
            agentSlug={agent?.slug}
          />

          {agent ? (
            <div className="mt-8 rounded-[2rem] border border-line bg-panel p-5 shadow-luxury">
              <div className="flex items-center gap-4">
                <Image
                  src={agent.image}
                  alt={`Portrait of ${agent.name}`}
                  width={120}
                  height={120}
                  className="h-20 w-20 rounded-2xl object-cover"
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-accent">{agent.title}</p>
                  <h2 className="mt-1 font-display text-3xl text-foreground">{agent.name}</h2>
                  <p className="mt-2 text-sm text-muted">{agent.experience}+ years in luxury transactions</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button href={`/agents/${agent.slug}`} variant="secondary">
                  View agent
                </Button>
                <Button href="/contact">Contact agent</Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,0.85fr]">
        <div className="space-y-8">
          <section className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
            <h2 className="font-display text-3xl text-foreground">Key features</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {property.keyFeatures.map((feature) => (
                <div key={feature} className="rounded-2xl border border-line bg-background/60 px-4 py-3 text-sm text-foreground">
                  {feature}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
            <h2 className="font-display text-3xl text-foreground">Amenities</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {property.amenities.map((item) => (
                <span key={item} className="rounded-full border border-line bg-background/60 px-4 py-2 text-sm text-foreground">
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
            <h2 className="font-display text-3xl text-foreground">Floor plan</h2>
            <div className="mt-5 rounded-[1.75rem] border border-dashed border-accent/40 bg-accent/5 p-6">
              <div className="flex items-center gap-3 text-accent">
                <Building2 className="h-5 w-5" />
                <p className="font-medium">{property.floorPlan.label}</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted">{property.floorPlan.description}</p>
              <p className="mt-4 text-sm font-medium text-foreground">{property.floorPlan.dimensions}</p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
            <h2 className="font-display text-3xl text-foreground">Nearby places</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {property.nearby.map((place) => (
                <div key={place.name} className="rounded-2xl border border-line bg-background/60 p-4">
                  <p className="font-medium text-foreground">{place.name}</p>
                  <p className="mt-2 text-sm text-muted">{place.type}</p>
                  <p className="mt-1 text-sm text-accent">{place.distance}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
            <h2 className="font-display text-3xl text-foreground">Mortgage estimate</h2>
            <p className="mt-2 text-sm text-muted">Use this calculator to assess monthly ownership cost for this home.</p>
            <div className="mt-5">
              <MortgageCalculator defaultPrice={property.price} compact />
            </div>
          </section>

          <section id="book-visit" className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
            <h2 className="font-display text-3xl text-foreground">Book a visit</h2>
            <p className="mt-2 text-sm text-muted">Schedule an in-person or virtual showing with the lead advisor.</p>
            <div className="mt-5">
              <BookingForm propertyTitle={property.title} />
            </div>
          </section>
        </div>
      </div>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-accent">Similar homes</p>
            <h2 className="mt-3 font-display text-4xl text-foreground">More opportunities in {property.city}.</h2>
          </div>
          <Button href="/listings" variant="secondary">
            View all listings
          </Button>
        </div>
        <div className="mt-8">
          <PropertyGrid properties={similar.length > 0 ? similar : properties.slice(0, 3)} />
        </div>
      </section>
    </div>
  );
}
