import { published } from "../../../server/public-data.mjs";
import type { Property, Agent } from "@/types";
export const dynamic = "force-dynamic";

import { BookingForm } from "@/components/booking/booking-form";

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>;
}) {
  const properties = await published<Property>("properties");
  const { property } = await searchParams;
  const selectedProperty = properties.find((entry) => entry.slug === property);

  return (
    <div className="shell section grid gap-10 xl:grid-cols-[0.85fr,1.15fr]">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-accent">
          Book a visit
        </p>
        <h1 className="mt-3 font-display text-5xl text-foreground">
          Schedule a viewing with clear timing and zero friction.
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted">
          Select the property, visit type, and preferred schedule. Aurevia will
          coordinate access, prep details, and your advisory follow-up.
        </p>
        <div className="mt-8 rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
          <p className="text-sm uppercase tracking-[0.24em] text-accent">
            What to expect
          </p>
          {selectedProperty ? (
            <div className="mt-4 rounded-[1.5rem] border border-accent/20 bg-accent/10 p-4 text-sm text-foreground">
              Booking for{" "}
              <span className="font-medium">{selectedProperty.title}</span> in{" "}
              {selectedProperty.city}.
            </div>
          ) : null}
          <ul className="mt-4 space-y-3 text-sm leading-7 text-muted">
            <li>Concierge confirmation within one business day</li>
            <li>Route and neighborhood notes for in-person tours</li>
            <li>Digital briefing pack for virtual visits</li>
            <li>Post-visit next steps with pricing and financing support</li>
          </ul>
        </div>
      </div>
      <BookingForm propertyTitle={selectedProperty?.title} />
    </div>
  );
}
