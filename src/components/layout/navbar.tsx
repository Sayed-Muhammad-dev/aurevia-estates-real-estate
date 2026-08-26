"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { brand } from "@/data/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/listings", label: "Listings" },
  { href: "/search", label: "Search" },
  { href: "/agents", label: "Agents" },
  { href: "/mortgage", label: "Mortgage" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-semibold tracking-[0.3em] text-slate-950">
            AE
          </div>
          <div>
            <p className="font-display text-xl text-foreground">{brand.name}</p>
            <p className="text-xs uppercase tracking-[0.32em] text-muted">Prime Real Estate</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-line bg-panel/70 px-3 py-2 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm text-muted transition hover:bg-foreground/5 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <Button href="/saved" variant="secondary">
            Saved
          </Button>
          <Button href="/login">Client Login</Button>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-panel text-foreground"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-line/70 bg-panel/95 transition-all duration-300 lg:hidden",
          open ? "max-h-[24rem]" : "max-h-0 border-transparent",
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-foreground/5"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Button href="/saved" variant="secondary">
              Saved
            </Button>
            <Button href="/login">Login</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
