import { Mail, Phone, Star } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AgentCard } from "@/components/agents/agent-card";
import { Button } from "@/components/ui/button";
import { agents } from "@/data/agents";
import { properties } from "@/data/properties";

export function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.slug }));
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = agents.find((entry) => entry.slug === slug);
  if (!agent) notFound();

  const listings = properties.filter((property) => property.agentId === agent.id);
  const peers = agents.filter((entry) => entry.id !== agent.id).slice(0, 2);

  return (
    <div className="shell section space-y-10">
      <div className="grid gap-10 lg:grid-cols-[420px,1fr]">
        <div className="overflow-hidden rounded-[2rem] border border-line bg-panel shadow-luxury">
          <Image
            src={agent.image}
            alt={`Portrait of ${agent.name}`}
            width={1200}
            height={1400}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="rounded-[2rem] border border-line bg-panel p-8 shadow-luxury">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">{agent.title}</p>
          <h1 className="mt-3 font-display text-5xl text-foreground">{agent.name}</h1>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted">
            <span>{agent.experience}+ years experience</span>
            <span>{agent.activeListings} active listings</span>
            <span className="inline-flex items-center gap-1 text-foreground">
              <Star className="h-4 w-4 fill-accent text-accent" />
              {agent.rating.toFixed(1)} from {agent.reviews} reviews
            </span>
          </div>
          <p className="mt-6 text-base leading-8 text-muted">{agent.bio}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-line bg-background/60 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-accent">Specialization</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {agent.specialization.map((item) => (
                  <span key={item} className="rounded-full bg-foreground/5 px-3 py-2 text-sm text-foreground">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-line bg-background/60 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-accent">Service areas</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {agent.serviceAreas.map((item) => (
                  <span key={item} className="rounded-full bg-foreground/5 px-3 py-2 text-sm text-foreground">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a href={`tel:${agent.phone}`} className="rounded-[1.5rem] border border-line bg-background/60 p-4 text-sm text-foreground transition hover:border-accent/40">
              <Phone className="mb-3 h-5 w-5 text-accent" />
              {agent.phone}
            </a>
            <a href={`mailto:${agent.email}`} className="rounded-[1.5rem] border border-line bg-background/60 p-4 text-sm text-foreground transition hover:border-accent/40">
              <Mail className="mb-3 h-5 w-5 text-accent" />
              {agent.email}
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/booking">Book Visit</Button>
            <Button href={`/contact?agent=${agent.slug}`} variant="secondary">
              Contact Agent
            </Button>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-accent">Active listings</p>
            <h2 className="mt-3 font-display text-4xl text-foreground">Homes represented by {agent.name.split(" ")[0]}.</h2>
          </div>
          <Button href="/listings" variant="secondary">
            Explore all listings
          </Button>
        </div>
        <div className="stagger-grid grid gap-6 lg:grid-cols-2">
          {listings.map((property) => (
            <div key={property.id} className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
              <p className="text-sm uppercase tracking-[0.24em] text-accent">{property.city}</p>
              <h3 className="mt-3 font-display text-3xl text-foreground">{property.title}</h3>
              <p className="mt-2 text-sm text-muted">
                {property.bedrooms} beds · {property.bathrooms} baths · {property.areaSqft.toLocaleString()} sqft
              </p>
              <p className="mt-4 text-sm leading-7 text-muted">{property.description}</p>
              <div className="mt-5">
                <Button href={`/properties/${property.slug}`} variant="secondary">
                  View Property
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Related advisors</p>
          <h2 className="mt-3 font-display text-4xl text-foreground">Meet more of the team.</h2>
        </div>
        <div className="stagger-grid grid gap-6 lg:grid-cols-2">
          {peers.map((peer) => (
            <AgentCard key={peer.id} agent={peer} />
          ))}
        </div>
      </section>
    </div>
  );
}
