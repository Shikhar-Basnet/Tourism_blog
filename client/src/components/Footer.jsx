import { Link } from "react-router-dom";
import {
  MapPin,
  Mail,
  Facebook,
  Instagram,
  Youtube,
  ArrowUpRight,
  Mountain,
} from "lucide-react";

const exploreLinks = [
  { to: "/destinations", label: "Destinations" },
  { to: "/blogs", label: "Travel Blogs" },
  { to: "/destinations?category=Trekking", label: "Trekking Routes" },
  { to: "/destinations?category=UNESCO", label: "Heritage Sites" },
];

const provinceLinks = [
  { to: "/destinations?province=Bagmati", label: "Bagmati" },
  { to: "/destinations?province=Gandaki", label: "Gandaki" },
  { to: "/destinations?province=Koshi", label: "Koshi" },
  { to: "/destinations?province=Lumbini", label: "Lumbini" },
];

const socialLinks = [
  { href: "https://facebook.com", label: "Facebook", Icon: Facebook },
  { href: "https://instagram.com", label: "Instagram", Icon: Instagram },
  { href: "https://youtube.com", label: "YouTube", Icon: Youtube },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand + blurb */}
          <div className="col-span-2 lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-700/20">
                <Mountain size={18} />
              </span>
              Nepal<span className="text-brand-300">Tourism</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
              Your guide to the Himalayas — curated destinations, honest travel
              tips, and live trip-planning tools to help you explore Nepal with
              confidence.
            </p>

            <div className="mt-5 flex items-center gap-2">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 transition-all hover:border-brand-400 hover:bg-brand-500/10 hover:text-brand-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <nav className="col-span-1 lg:col-span-2" aria-label="Explore">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Explore
            </p>
            <ul className="space-y-2.5">
              {exploreLinks.map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm text-slate-300 transition-colors hover:text-brand-300"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Provinces */}
          <nav className="col-span-1 lg:col-span-2" aria-label="Provinces">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Provinces
            </p>
            <ul className="space-y-2.5">
              {provinceLinks.map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="flex items-center gap-1.5 text-sm text-slate-300 transition-colors hover:text-brand-300"
                  >
                    <MapPin size={12} className="text-brand-300" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Newsletter / contact card */}
          <div className="col-span-2 lg:col-span-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-soft">
              <p className="text-sm font-semibold text-white">Plan your next trip</p>
              <p className="mt-1 text-sm text-slate-300">
                Get seasonal picks and trekking tips straight to your inbox.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mt-4 flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <button
                  type="submit"
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:brightness-110"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {year} NepalTourism. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
            <Link to="/" className="transition-colors hover:text-brand-300">Privacy Policy</Link>
            <Link to="/" className="transition-colors hover:text-brand-300">Terms of Service</Link>
            <a
              href="https://github.com/shikhar-basnet/Tourism_blog"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-brand-300"
            >
              Crafted By: Shikhar <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}