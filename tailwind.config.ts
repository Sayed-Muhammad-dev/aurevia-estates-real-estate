import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accentSoft: "rgb(var(--accent-soft) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
      },
      boxShadow: {
        luxury: "0 24px 80px rgba(15, 23, 42, 0.12)",
        float: "0 18px 48px rgba(15, 23, 42, 0.16)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "Helvetica Neue", "sans-serif"],
        display: ["var(--font-display)", "Palatino Linotype", "Book Antiqua", "serif"],
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at top, rgba(201,168,113,0.18), transparent 40%), linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.95)", opacity: "0.8" },
          "100%": { transform: "scale(1.15)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease forwards",
        ring: "pulseRing 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
