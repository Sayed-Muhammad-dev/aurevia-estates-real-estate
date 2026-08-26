import { MortgageCalculator } from "@/components/calculator/mortgage-calculator";
import { Button } from "@/components/ui/button";

export default function MortgagePage() {
  return (
    <div className="shell section space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Mortgage calculator</p>
        <h1 className="mt-3 font-display text-5xl text-foreground">Model monthly costs before you commit to a tour.</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
          Adjust home price, down payment, interest rate, taxes, and insurance to estimate your monthly outlay with a clear visual breakdown.
        </p>
      </div>
      <MortgageCalculator />
      <div className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
        <p className="text-sm leading-7 text-muted">
          Need a tailored financing strategy for a primary residence, second home, or investment purchase?
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button href="/contact">Speak with an advisor</Button>
          <Button href="/booking" variant="secondary">
            Book a planning call
          </Button>
        </div>
      </div>
    </div>
  );
}
