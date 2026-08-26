import { Mail, Phone, Star } from "lucide-react";
import Image from "next/image";
import { Agent } from "@/types";
import { Button } from "@/components/ui/button";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-line bg-panel shadow-luxury transition hover:-translate-y-1 hover:shadow-float">
      <Image
        src={agent.image}
        alt={`Portrait of ${agent.name}`}
        width={900}
        height={900}
        className="h-80 w-full object-cover"
      />
      <div className="p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-accent">{agent.title}</p>
        <h3 className="mt-2 font-display text-3xl text-foreground">{agent.name}</h3>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
          <span>{agent.experience}+ years</span>
          <span>{agent.activeListings} listings</span>
          <span className="inline-flex items-center gap-1 text-foreground">
            <Star className="h-4 w-4 fill-accent text-accent" />
            {agent.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-4 text-sm leading-7 text-muted">{agent.bio}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {agent.specialization.map((item) => (
            <span key={item} className="rounded-full bg-foreground/5 px-3 py-2 text-xs text-foreground">
              {item}
            </span>
          ))}
        </div>
        <div className="mt-6 grid gap-3 text-sm text-muted">
          <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-2 transition hover:text-foreground">
            <Phone className="h-4 w-4 text-accent" />
            {agent.phone}
          </a>
          <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-2 transition hover:text-foreground">
            <Mail className="h-4 w-4 text-accent" />
            {agent.email}
          </a>
        </div>
        <div className="mt-6 flex gap-3">
          <Button href={`/agents/${agent.slug}`} variant="secondary" className="flex-1">
            View Agent
          </Button>
          <Button href={`/contact?agent=${agent.slug}`} className="flex-1">
            Contact Agent
          </Button>
        </div>
      </div>
    </article>
  );
}
