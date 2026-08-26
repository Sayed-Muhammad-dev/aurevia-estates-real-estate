import { Faq, MarketStat, Review } from "@/types";

export const brand = {
  name: "Aurevia Estates",
  tagline: "Curated homes for decisive buyers, investors, and global renters.",
  description:
    "Aurevia Estates is a premium real estate platform focused on high-trust discovery, guided advisory, and beautifully presented homes across the most demanded urban and coastal markets.",
  email: "hello@aureviaestates.com",
  phone: "+1 (888) 401-2783",
  office: "8800 Sunset Plaza, Suite 340, Los Angeles, CA 90069",
};

export const locations = [
  { city: "Malibu", listings: 28, insight: "Oceanfront estates and private compounds" },
  { city: "New York", listings: 42, insight: "Design-led townhouses, lofts, and penthouses" },
  { city: "Miami", listings: 36, insight: "Waterfront living with hotel-grade amenities" },
  { city: "Austin", listings: 19, insight: "Architecture-forward family estates" },
];

export const services = [
  "Private buying representation",
  "Luxury rental advisory",
  "Seller positioning and launch strategy",
  "Relocation and corporate housing support",
];

export const reviews: Review[] = [
  {
    id: "rev-01",
    name: "Catherine Holloway",
    role: "Founder, Holloway Design Group",
    quote:
      "Aurevia combined market intelligence with restraint. Every step felt considered, from property shortlisting to final negotiation.",
  },
  {
    id: "rev-02",
    name: "Jordan Patel",
    role: "Private Investor",
    quote:
      "The saved-property workflow and agent support made fast comparisons easy. We closed on a high-performing rental in under three weeks.",
  },
  {
    id: "rev-03",
    name: "Marta Leone",
    role: "International Buyer",
    quote:
      "I needed confidence from overseas. Their process, communication, and digital presentation made the purchase feel secure and simple.",
  },
];

export const faqs: Faq[] = [
  {
    question: "How does Aurevia verify listings?",
    answer:
      "Every listing is reviewed for pricing consistency, image quality, legal availability, and agent accountability before publication.",
  },
  {
    question: "Can I book a private virtual showing?",
    answer:
      "Yes. Visit requests support both in-person and virtual tours, with custom notes for relocation, scheduling windows, and buying stage.",
  },
  {
    question: "Do you support cross-city relocation searches?",
    answer:
      "Yes. Our advisors can prepare curated shortlists across multiple cities and align them with commute, school, and lifestyle priorities.",
  },
];

export const marketStats: MarketStat[] = [
  { label: "Average days on market", value: "19", detail: "Across active prime listings in the last quarter" },
  { label: "Client satisfaction", value: "98%", detail: "From post-closing and rental placement surveys" },
  { label: "Private tours booked", value: "1,480+", detail: "Across digital and in-person visits this year" },
  { label: "Off-market opportunities", value: "64", detail: "Shared with qualified buyers in the past 90 days" },
];
