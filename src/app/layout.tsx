import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PageTransition } from "@/components/layout/page-transition";
import { SavedProvider } from "@/components/providers/saved-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { brand } from "@/data/site";
import "@/app/globals.css";
import { PropertyDataProvider } from "@/components/providers/property-data";
import { published } from "../../server/public-data.mjs";
import type { Property, Agent } from "@/types";
export const dynamic = "force-dynamic";

// Avenir Next and Iowan Old Style are macOS-only, so the previous stack fell
// back to different typefaces on every other platform. These are loaded and
// self-hosted by next/font, so the site looks the same everywhere.
const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} | Premium Real Estate`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [properties, agents] = await Promise.all([
    published<Property>("properties"),
    published<Agent>("agents"),
  ]);
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable}`}
    >
      <body>
        <ThemeProvider>
          <ToastProvider>
            <PropertyDataProvider initial={{ properties, agents }}>
              <SavedProvider>
                <Navbar />
                <main>
                  <PageTransition>{children}</PageTransition>
                </main>
                <Footer />
              </SavedProvider>
            </PropertyDataProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
