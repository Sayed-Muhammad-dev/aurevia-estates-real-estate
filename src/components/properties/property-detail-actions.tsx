"use client";

import { Heart, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSaved } from "@/components/providers/saved-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";

export function PropertyDetailActions({
  propertyId,
  propertyTitle,
  propertySlug,
  agentSlug,
}: {
  propertyId: string;
  propertyTitle: string;
  propertySlug: string;
  agentSlug?: string;
}) {
  const router = useRouter();
  const { saved, toggleSaved } = useSaved();
  const { showToast } = useToast();
  const isSaved = saved.includes(propertyId);

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Button
        variant="secondary"
        className="gap-2"
        onClick={() => {
          const next = toggleSaved(propertyId);
          showToast(
            next ? "Property saved" : "Property removed",
            next ? `${propertyTitle} is now in your shortlist.` : `${propertyTitle} was removed from your shortlist.`,
          );
        }}
      >
        <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
        {isSaved ? "Saved" : "Save property"}
      </Button>
      <Button
        variant="secondary"
        className="gap-2"
        onClick={() => {
          const url = typeof window !== "undefined" ? window.location.href : "";
          if (typeof navigator !== "undefined" && navigator.share) {
            navigator.share({ title: propertyTitle, url }).catch(() => undefined);
          } else if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(url).catch(() => undefined);
          }
          showToast("Link copied", "This property link is ready to share with a partner or advisor.");
        }}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      <Button onClick={() => router.push(`/booking?property=${propertySlug}`)}>Book Visit</Button>
      {agentSlug ? (
        <Button variant="ghost" onClick={() => router.push(`/contact?agent=${agentSlug}&property=${propertySlug}`)}>
          Contact Agent
        </Button>
      ) : null}
    </div>
  );
}
