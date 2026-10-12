import { NewsletterForm } from "@/components/shared/newsletter-form";
import { ContactForm } from "@/components/shared/contact-form";
import { Button } from "@/components/ui/button";
import { published } from "../../../server/public-data.mjs";
import type { Property, Agent } from "@/types";
export const dynamic = "force-dynamic";
import { brand, faqs } from "@/data/site";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string; property?: string }>;
}) {
  const { agent, property } = await searchParams;
  const [agents, properties] = await Promise.all([
    published<Agent>("agents"),
    published<Property>("properties"),
  ]);
  const leadAgent = agents.find((entry) => entry.slug === agent) ?? agents[0];
  const selectedProperty = properties.find((entry) => entry.slug === property);
  const defaultInterest = selectedProperty ? "Buying" : undefined;
  const defaultMessage = selectedProperty
    ? `I would like more details about ${selectedProperty.title} in ${selectedProperty.city}.`
    : `I would like to speak with ${leadAgent?.name ?? "an advisor"} about my property search.`;

  return (
    <div className="shell section space-y-10">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-accent">
          Contact Aurevia
        </p>
        <h1 className="mt-3 font-display text-5xl text-foreground">
          Reach the right team for buying, renting, selling, or advisory
          support.
        </h1>
      </div>

      <div className="grid gap-10 xl:grid-cols-[1fr,1fr]">
        <ContactForm
          defaultInterest={defaultInterest}
          defaultMessage={defaultMessage}
        />

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
            <p className="text-sm uppercase tracking-[0.24em] text-accent">
              Office information
            </p>
            <div className="mt-5 space-y-3 text-sm leading-7 text-muted">
              <p>{brand.office}</p>
              <p>{brand.phone}</p>
              <p>{brand.email}</p>
              <p>Monday to Saturday · 9:00 AM to 7:00 PM</p>
            </div>
          </div>

          {leadAgent ? (
            <div className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
              <p className="text-sm uppercase tracking-[0.24em] text-accent">
                Agent support
              </p>
              <h2 className="mt-3 font-display text-3xl text-foreground">
                {leadAgent.name}
              </h2>
              <p className="mt-2 text-sm text-muted">{leadAgent.title}</p>
              <p className="mt-4 text-sm leading-7 text-muted">
                {leadAgent.bio}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button href={`/agents/${leadAgent.slug}`} variant="secondary">
                  View Agent
                </Button>
                <Button href="/booking">Book Visit</Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
            <p className="text-sm uppercase tracking-[0.24em] text-accent">
              Newsletter
            </p>
            <h2 className="mt-3 font-display text-3xl text-foreground">
              Stay close to market movement.
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Receive new listings, market stats, and buyer-ready insights each
              week.
            </p>
            <div className="mt-5">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>

      <section className="stagger-grid grid gap-6 lg:grid-cols-3">
        {faqs.map((faq) => (
          <div
            key={faq.question}
            className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury"
          >
            <h2 className="font-display text-3xl text-foreground">
              {faq.question}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">{faq.answer}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
