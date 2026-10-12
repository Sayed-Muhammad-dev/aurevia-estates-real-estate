# Aurevia Estates — Premium Real Estate Website

> **Application upgrade — October 2026:** This repository now includes a persistent Node application API and an authenticated operations workspace at `/workspace`. Run `npm run admin:bootstrap` once, then follow [the application runbook](docs/FULLSTACK.md). CMS collections use reviewed draft/published snapshots; financial applications use protected operational records. Existing public deployments have not been changed. Older frontend descriptions below document the original interface and sample data.


A property listing platform for a high-end estate agency: search, a filtered
listings page with a sticky filter bar, property detail pages with galleries and
agent contact, agent profiles, saved listings and a mortgage calculator.
Eighteen properties across six markets.

> **Live demo:** _add the deployment URL here_

## Features

**Homepage**
- Hero search across location, price range and property type.
- Featured listings grid with hover elevation.
- Market statistics, agent introduction, reviews and FAQ.

**Listings**
- **Sticky filter bar** that pins below the navigation on scroll, deepens its
  shadow once stuck, and collapses its expanded panel automatically so it never
  covers the results it is filtering. The stuck state is detected with an
  `IntersectionObserver` sentinel rather than a scroll listener.
- Ten filter dimensions: search, buy/rent, property type, location, min and max
  price, bedrooms, bathrooms, minimum area, furnishing, amenities and
  featured-only.
- Grid and list view toggle; filter state is reflected in the URL, so a filtered
  search can be shared.
- Real empty state when nothing matches.

**Property detail** — image gallery with thumbnails, price and specifications,
key features, amenities, nearby places, floor plan, a map placeholder pinned to
the property's coordinates, and a contact-agent form.

**Agents** — directory plus individual profile pages with each agent's listings.

**Also** — saved listings, a booking flow, a mortgage calculator, contact,
search, and login/register screens. Light and dark themes.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 with CSS-variable theme tokens |
| Icons | lucide-react |
| Fonts | Cormorant Garamond + Manrope via `next/font` |
| Images | `next/image` against Unsplash |

## Design

A warm sand background (`#f5f1ea`) with deep charcoal text and a gold accent
(`#c9a871`) — the premium, trustworthy register real-estate branding tends to
use — plus a full dark theme where the same accent warms slightly against a
near-black panel. Both themes are one set of CSS-variable overrides.

Cormorant Garamond carries property names and headings; Manrope handles
everything else. Photography is the visual anchor throughout, with gradient
scrims rather than flat overlays so white text stays legible over any image.

## Data

All local — there is no backend. Eighteen properties across Malibu, New York,
Miami, Austin, Los Angeles and Scottsdale, each with a written description,
specifications, key features, amenities, nearby places, floor plan and map
coordinates. Four agents with profiles and assigned listings.

`src/data/properties.ts` holds the flagship listings; `src/data/more-properties.ts`
widens the inventory so the ten filter dimensions have enough stock to return
results across rentals, lower price bands, smaller units and unfurnished
properties.

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm start   # production build
```

## Project Structure

```
src/
  app/
    page.tsx                homepage with hero search
    listings/               filtered listings with sticky filter bar
    properties/[slug]/      property detail, statically generated
    agents/  agents/[slug]/ directory and profiles
    saved/  booking/  mortgage/  search/  contact/
    login/  register/
    globals.css             theme tokens
    layout.tsx              fonts, providers, navigation, footer
  components/
    properties/             card, grid, gallery, filter bar, map
    booking/  calculator/  shared/  layout/  ui/  providers/
  data/                     properties, more-properties, agents, site
  lib/filters.ts            filter predicate and defaults
  types/                    shared domain types
```

## Notes on this revision

Three fixes in this commit worth calling out:

- The filter bar is now genuinely sticky. It previously scrolled away with the
  page.
- The type stack was `Avenir Next` and `Iowan Old Style` — both macOS-only, so
  the site rendered in different typefaces on every other platform. Both are now
  loaded and self-hosted through `next/font`.
- Inventory went from eight properties to eighteen. With ten filter dimensions
  and only eight listings, most filter combinations returned nothing, which
  reads as a broken page rather than an empty result.
