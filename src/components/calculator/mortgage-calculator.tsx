"use client";

import { useState } from "react";
import { calculateMortgage } from "@/lib/mortgage";

export function MortgageCalculator({
  compact = false,
  defaultPrice = 1800000,
}: {
  compact?: boolean;
  defaultPrice?: number;
}) {
  const initialValues = {
    price: defaultPrice,
    downPayment: defaultPrice * 0.2,
    interestRate: 6.25,
    loanTerm: 30,
    propertyTax: 18000,
    insurance: 420,
  };
  const [form, setForm] = useState(initialValues);
  const [result, setResult] = useState(() => calculateMortgage(initialValues));

  const handleCalculate = (event: React.FormEvent) => {
    event.preventDefault();
    setResult(calculateMortgage(form));
  };

  const denominator = result.total || 1;
  const principalShare = (result.mortgage / denominator) * 100;
  const taxShare = (result.taxes / denominator) * 100;
  const insuranceShare = (result.insurance / denominator) * 100;

  return (
    <form onSubmit={handleCalculate} className="rounded-[2rem] border border-line bg-panel p-6 shadow-luxury">
      <div className={compact ? "grid gap-6 lg:grid-cols-[1.15fr,0.85fr]" : "grid gap-8 lg:grid-cols-[1.2fr,0.8fr]"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-muted">
            <span>Home price</span>
            <input type="number" value={form.price} onChange={(e) => setForm((c) => ({ ...c, price: Number(e.target.value) || 0 }))} className="field" />
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Down payment</span>
            <input
              type="number"
              value={form.downPayment}
              onChange={(e) => setForm((c) => ({ ...c, downPayment: Number(e.target.value) || 0 }))}
              className="field"
            />
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Interest rate (%)</span>
            <input
              type="number"
              step="0.01"
              value={form.interestRate}
              onChange={(e) => setForm((c) => ({ ...c, interestRate: Number(e.target.value) || 0 }))}
              className="field"
            />
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Loan term (years)</span>
            <select value={form.loanTerm} onChange={(e) => setForm((c) => ({ ...c, loanTerm: Number(e.target.value) }))} className="field">
              <option value={15}>15 years</option>
              <option value={20}>20 years</option>
              <option value={30}>30 years</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Property tax / year</span>
            <input
              type="number"
              value={form.propertyTax}
              onChange={(e) => setForm((c) => ({ ...c, propertyTax: Number(e.target.value) || 0 }))}
              className="field"
            />
          </label>
          <label className="space-y-2 text-sm text-muted">
            <span>Insurance / month</span>
            <input
              type="number"
              value={form.insurance}
              onChange={(e) => setForm((c) => ({ ...c, insurance: Number(e.target.value) || 0 }))}
              className="field"
            />
          </label>
          <div className="sm:col-span-2 flex flex-wrap gap-3">
            <button type="submit" className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-medium text-slate-950 transition hover:-translate-y-0.5 hover:bg-accent/90">
              Calculate mortgage
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(initialValues);
                setResult(calculateMortgage(initialValues));
              }}
              className="inline-flex items-center justify-center rounded-full border border-line px-5 py-3 text-sm font-medium text-foreground transition hover:border-accent/40 hover:bg-accent/5"
            >
              Reset values
            </button>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-line bg-background/70 p-6">
          <p className="text-sm uppercase tracking-[0.28em] text-accent">Estimated payment</p>
          <p className="mt-3 font-display text-5xl text-foreground">
            ${result.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-2 text-sm text-muted">Monthly estimate including principal, taxes, and insurance.</p>

          <div className="mt-6 overflow-hidden rounded-full bg-foreground/5">
            <div className="flex h-3">
              <div style={{ width: `${principalShare}%` }} className="bg-accent" />
              <div style={{ width: `${taxShare}%` }} className="bg-sky-500" />
              <div style={{ width: `${insuranceShare}%` }} className="bg-emerald-500" />
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted">
              <span>Principal & interest</span>
              <span className="text-foreground">${result.mortgage.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>Property tax</span>
              <span className="text-foreground">${result.taxes.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>Insurance</span>
              <span className="text-foreground">${result.insurance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
