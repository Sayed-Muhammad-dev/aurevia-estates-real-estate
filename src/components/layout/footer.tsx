import Link from "next/link";
import { brand } from "@/data/site";

const footerGroups = [
  {
    title: "Explore",
    links: [
      { href: "/listings", label: "Property listings" },
      { href: "/search", label: "Advanced search" },
      { href: "/saved", label: "Saved properties" },
    ],
  },
  {
    title: "Advisory",
    links: [
      { href: "/agents", label: "Meet the agents" },
      { href: "/mortgage", label: "Mortgage calculator" },
      { href: "/booking", label: "Book a visit" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/register", label: "Create account" },
      { href: "/login", label: "Client login" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_repeat(3,1fr)] lg:px-8">
        <div>
          <p className="font-display text-3xl">{brand.name}</p>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">{brand.description}</p>
          <div className="mt-6 space-y-1 text-sm text-slate-300">
            <p>{brand.office}</p>
            <p>{brand.phone}</p>
            <p>{brand.email}</p>
          </div>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title}>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{group.title}</p>
            <div className="mt-4 flex flex-col gap-3">
              {group.links.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-slate-300 transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-6 text-center text-sm text-slate-500">
        <p>© 2026 {brand.name}. Built for premium property discovery, advisory, and client trust.</p>
      </div>
    </footer>
  );
}
