import { ArrowRight, BarChart3, Building2, CheckCircle2, Landmark, MoveRight, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { AgentCard } from "@/components/agents/agent-card";
import { MortgageCalculator } from "@/components/calculator/mortgage-calculator";
import { PropertyGrid } from "@/components/properties/property-grid";
import { ContactForm } from "@/components/shared/contact-form";
import { NewsletterForm } from "@/components/shared/newsletter-form";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { agents } from "@/data/agents";
import { properties } from "@/data/properties";
import { locations, marketStats, reviews, services } from "@/data/site";
import { formatCompactPrice } from "@/lib/utils";

export default function HomePage() {
  const featured = properties.filter((property) => property.featured).slice(0, 3);

  return (
    <>
      <section className="section">
        <div className="shell grid animate-hero-enter items-center gap-10 lg:grid-cols-[1.05fr,0.95fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.34em] text-accent">Curated luxury residences</p>
            <h1 className="mt-5 font-display text-5xl leading-tight text-foreground md:text-7xl">
              Discover homes that feel worthy of the life built around them.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              Aurevia Estates combines elevated presentation, intelligent search, and trusted advisory to help buyers, renters, and investors move with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/listings" className="gap-2">
                Browse listings
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/booking" variant="secondary">
                Book a private tour
              </Button>
            </div>

            <form action="/listings" className="mt-10 rounded-[2rem] border border-line bg-panel p-4 shadow-luxury">
              <div className="grid gap-4 lg:grid-cols-[2fr,1fr,1fr,auto]">
                <input name="query" className="field" placeholder="Search by city, address, neighborhood, or property type" />
                <select name="mode" className="field">
                  <option value="all">Buy or rent</option>
                  <option value="buy">Buy</option>
                  <option value="rent">Rent</option>
                </select>
                <select name="location" className="field">
                  <option value="all">Any location</option>
                  {locations.map((location) => (
                    <option key={location.city} value={location.city}>
                      {location.city}
                    </option>
                  ))}
                </select>
                <Button type="submit">Search</Button>
              </div>
            </form>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Prime listings", value: "120+" },
                { label: "Average close time", value: "19 days" },
                { label: "Client retention", value: "92%" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[1.75rem] border border-line bg-panel px-5 py-4">
                  <p className="font-display text-3xl text-foreground">{stat.value}</p>
                  <p className="mt-2 text-sm text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] shadow-float">
            <Image
              src={featured[0].images[0]}
              alt={featured[0].coverAlt}
              width={1400}
              height={1600}
              className="h-[38rem] w-full object-cover"
            />
            <div className="hero-card absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 text-white backdrop-blur">
                <p className="text-sm uppercase tracking-[0.24em] text-white/70">Featured residence</p>
                <h2 className="mt-3 font-display text-4xl">{featured[0].title}</h2>
                <p className="mt-2 text-white/75">
                  {featured[0].area}, {featured[0].city}
                </p>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold">{formatCompactPrice(featured[0].price)}</p>
                    <p className="text-sm text-white/70">{featured[0].bedrooms} beds · {featured[0].bathrooms} baths · {featured[0].areaSqft.toLocaleString()} sqft</p>
                  </div>
                  <Button href={`/properties/${featured[0].slug}`} variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                    View Property
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="listings" className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Featured properties"
            title="Handpicked homes with exceptional positioning and presentation."
            description="Each listing is curated for design quality, location value, and buyer clarity."
          />
          <div className="mt-10">
            <PropertyGrid properties={featured} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell grid gap-10 xl:grid-cols-[0.95fr,1.05fr]">
          <div className="rounded-[2rem] border border-line bg-panel p-8 shadow-luxury">
            <SectionHeading
              eyebrow="Popular locations"
              title="Markets where demand, lifestyle, and long-term value align."
              description="Explore our most active cities and neighborhoods for premium acquisitions and rentals."
            />
            <div className="mt-8 space-y-4">
              {locations.map((location) => (
                <div key={location.city} className="flex items-center justify-between rounded-[1.5rem] border border-line bg-background/60 p-4">
                  <div>
                    <p className="text-xl font-medium text-foreground">{location.city}</p>
                    <p className="mt-1 text-sm text-muted">{location.insight}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl text-foreground">{location.listings}</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted">Active listings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="stagger-grid grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: "Trust-first advisory",
                text: "Every buyer and renter receives tailored guidance, pricing context, and transparent next steps.",
              },
              {
                icon: Sparkles,
                title: "Presentation that converts",
                text: "Listings are staged digitally for clarity, emotion, and high-intent lead generation.",
              },
              {
                icon: Building2,
                title: "Access to premium inventory",
                text: "From branded residences to architectural villas, we focus on homes with enduring value.",
              },
              {
                icon: Landmark,
                title: "Financial decision support",
                text: "Mortgage estimates, yield thinking, and budget filtering are built into the client journey.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
                <div className="inline-flex rounded-2xl bg-accent/10 p-3 text-accent">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-3xl text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="stagger-grid grid gap-6 lg:grid-cols-3">
            {services.map((service, index) => (
              <div key={service} className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
                <p className="text-sm uppercase tracking-[0.24em] text-accent">0{index + 1}</p>
                <h3 className="mt-4 font-display text-3xl text-foreground">{service}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Structured discovery, responsive communication, and polished delivery tailored to premium property expectations.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Buying and renting"
            title="A process that feels informed, efficient, and personal."
            description="We remove friction from property discovery through curated search, decisive shortlisting, and concierge-level support."
            align="center"
          />
          <div className="stagger-grid mt-10 grid gap-6 lg:grid-cols-4">
            {[
              "Define goals, budget, and target markets.",
              "Receive a curated shortlist with pricing context.",
              "Book tours, compare homes, and estimate payments.",
              "Move forward with negotiation and closing support.",
            ].map((step, index) => (
              <div key={step} className="rounded-[2rem] border border-line bg-panel p-6 text-center shadow-luxury">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-lg font-semibold text-slate-950">
                  {index + 1}
                </div>
                <p className="mt-5 text-sm leading-7 text-muted">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="agents" className="section">
        <div className="shell">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Advisory team"
              title="Experienced agents who understand design, negotiation, and client discretion."
              description="Meet the advisors behind our strongest client outcomes."
            />
            <Button href="/agents" variant="secondary" className="hidden md:inline-flex">
              View all agents
            </Button>
          </div>
          <div className="stagger-grid mt-10 grid gap-6 lg:grid-cols-3">
            {agents.slice(0, 3).map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell rounded-[2.5rem] border border-line bg-panel p-8 shadow-luxury md:p-10">
          <SectionHeading
            eyebrow="Market stats"
            title="The signals clients ask for before they move."
            description="A snapshot of buyer demand, operational performance, and listing availability across the Aurevia network."
          />
          <div className="stagger-grid mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {marketStats.map((stat) => (
              <div key={stat.label} className="rounded-[1.75rem] border border-line bg-background/60 p-5">
                <p className="font-display text-4xl text-foreground">{stat.value}</p>
                <p className="mt-3 text-base font-medium text-foreground">{stat.label}</p>
                <p className="mt-2 text-sm text-muted">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell stagger-grid grid gap-6 lg:grid-cols-3">
          {reviews.map((review) => (
            <blockquote key={review.id} className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
              <div className="inline-flex items-center gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, index) => (
                  <CheckCircle2 key={index} className="h-4 w-4" />
                ))}
              </div>
              <p className="mt-5 text-lg leading-8 text-foreground">"{review.quote}"</p>
              <footer className="mt-6">
                <p className="font-medium text-foreground">{review.name}</p>
                <p className="text-sm text-muted">{review.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section id="mortgage" className="section">
        <div className="shell grid gap-10 xl:grid-cols-[1fr,1fr]">
          <div>
            <SectionHeading
              eyebrow="Mortgage preview"
              title="Estimate costs before you schedule a viewing."
              description="A fast monthly payment snapshot helps buyers filter confidently and compare homes on substance, not guesswork."
            />
            <div className="mt-8">
              <MortgageCalculator compact />
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-line bg-slate-950 p-8 text-white shadow-float">
            <p className="text-sm uppercase tracking-[0.32em] text-accent">Take the next step</p>
            <h2 className="mt-4 font-display text-5xl">Tell us what kind of home would feel right.</h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
              Whether you are buying a flagship residence, securing a seasonal rental, or building a portfolio, Aurevia can curate the search with precision.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/booking">Book a private visit</Button>
              <Button href="/contact" variant="secondary" className="border-white/15 bg-white/10 text-white hover:bg-white/15">
                Speak with an advisor
              </Button>
            </div>
            <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-accent" />
                <p className="font-medium">Weekly market intelligence</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Receive updates on pricing shifts, newly released homes, and high-opportunity rental inventory.
              </p>
              <div className="mt-5">
                <NewsletterForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="section">
        <div className="shell grid gap-10 xl:grid-cols-[0.9fr,1.1fr]">
          <div>
            <SectionHeading
              eyebrow="Contact"
              title="Connect with a team that respects urgency and detail."
              description="We respond with clear next steps, not generic follow-up."
            />
            <div className="mt-8 rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
              <p className="text-sm leading-7 text-muted">
                Prefer a guided search? Start with a message, then continue with saved properties, agent profiles, and visit scheduling across the platform.
              </p>
              <Button href="/contact" variant="secondary" className="mt-6 gap-2">
                Open full contact page
                <MoveRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
