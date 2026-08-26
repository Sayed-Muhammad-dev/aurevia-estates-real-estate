"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-panel text-foreground transition hover:border-accent/40 hover:bg-accent/5"
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
    </button>
  );
}
