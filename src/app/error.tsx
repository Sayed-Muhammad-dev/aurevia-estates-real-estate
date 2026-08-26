"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell section">
      <div className="rounded-[2rem] border border-line bg-panel p-10 text-center shadow-luxury">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Application state</p>
        <h1 className="mt-3 font-display text-5xl text-foreground">Something interrupted the experience.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          The page hit an unexpected state. Refresh the current route and continue browsing properties or reach out to the Aurevia team.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Retry page</Button>
          <Button href="/contact" variant="secondary">
            Contact support
          </Button>
        </div>
      </div>
    </div>
  );
}
