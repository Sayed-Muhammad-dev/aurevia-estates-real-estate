import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="shell section">
      <div className="rounded-[2.5rem] border border-line bg-panel p-10 text-center shadow-float">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">404</p>
        <h1 className="mt-3 font-display text-6xl text-foreground">This property path does not exist.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted">
          The page may have moved, the listing may no longer be active, or the address may be incorrect.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button href="/listings">Browse listings</Button>
          <Button href="/" variant="secondary">
            Return home
          </Button>
        </div>
      </div>
    </div>
  );
}
