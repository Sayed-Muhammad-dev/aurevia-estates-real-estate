import { published } from "../../../server/public-data.mjs";
import type { Property, Agent } from "@/types";
export const dynamic = "force-dynamic";
import { AgentCard } from "@/components/agents/agent-card";

export default async function AgentsPage() {
  const agents = await published<Agent>("agents");
  return (
    <div className="shell section space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-accent">
          Agent profiles
        </p>
        <h1 className="mt-3 font-display text-5xl text-foreground">
          Advisors with local fluency and premium transaction discipline.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
          Browse Aurevia’s agent network by specialty, active listings, and
          market coverage before booking a consultation or property visit.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
