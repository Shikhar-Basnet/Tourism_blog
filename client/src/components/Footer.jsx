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
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand + blurb */}
          <div className="col-span-2 lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2 text-lg font-medium text-gray-900">
              <span className="flex h-9 w-9 items-center justify-center rounded bg-blue-600 text-white">
                <Mountain size={18} />
              </span>
              Nepal<span className="text-blue-600">Tourism</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-600">
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
                  className="flex h-9 w-9 items-center justify-center rounded border border-gray-200 text-gray-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <nav className="col-span-1 lg:col-span-2" aria-label="Explore">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Explore
            </p>
            <ul className="space-y-2.5">
              {exploreLinks.map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Provinces */}
          <nav className="col-span-1 lg:col-span-2" aria-label="Provinces">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Provinces
            </p>
            <ul className="space-y-2.5">
              {provinceLinks.map(({ to, label }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <MapPin size={12} className="text-gray-400" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Newsletter / contact card */}
          <div className="col-span-2 lg:col-span-4">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-900">Plan your next trip</p>
              <p className="mt-1 text-sm text-gray-600">
                Get seasonal picks and trekking tips straight to your inbox.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mt-4 flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="flex shrink-0 items-center gap-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-xs text-gray-500">
            © {year} NepalTourism. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
            <Link to="/" className="hover:text-blue-600">Privacy Policy</Link>
            <Link to="/" className="hover:text-blue-600">Terms of Service</Link>
            <a
              href="https://github.com/shikhar-basnet/Tourism_blog"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-600"
            >
              Crafted By: Shikhar <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}