import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  MapPin,
  CloudSun,
  ShieldCheck,
  Users,
  Navigation2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Compass,
  Mountain,
  Star,
} from "lucide-react";
import { fetchDestinations, fetchDestinationFilters } from "../services/destinationService.js";
import { fetchBlogs } from "../services/blogService.js";
import DestinationCard from "../components/DestinationCard.jsx";
import BlogCard from "../components/BlogCard.jsx";
import WeatherWidget from "../components/WeatherWidget.jsx";
import { CardSkeleton } from "../components/LoadingState.jsx";

const CARD_SHADOW = "shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]";

// TODO: point this at your real production domain once you have one —
// feeds the canonical link, Open Graph/Twitter tags, and JSON-LD below.
const SITE_URL = "https://shikharbasnet.com.np";

const HERO_SLIDES = [
  "https://res.cloudinary.com/dzvmjk5h/image/upload/v1786271369/nepal-tourism/q1u3k9vfl0jvlfaky714.jpg",
  "https://res.cloudinary.com/dzvmjk5h/image/upload/v1786272089/Pokhara.jpg",
  "https://res.cloudinary.com/dzvmjk5h/image/upload/v1786272089/Mt_Everest.jpg",
  "https://res.cloudinary.com/dzvmjk5h/image/upload/v1786272089/Badimalika.webp",
  "https://res.cloudinary.com/dzvmjk5h/image/upload/v1786272077/Mustang.jpg",
];

const WAYPOINTS = [
  { m: "5,364", place: "Everest Base Camp" },
  { m: "1,400", place: "Kathmandu Durbar Square" },
  { m: "822", place: "Pokhara" },
  { m: "74", place: "Janaki Temple" },
];

// Small reusable "eyebrow" pill used above section headings — gives each
// section a distinct color identity instead of everything reading as the
// same flat gray-on-white block.
function Eyebrow({ icon: Icon, children, className = "" }) {
  return (
    <span
      className={`mb-3 inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide ${className}`}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

function RidgeDivider({ waypoint }) {
  return (
    <div className="mx-auto flex items-center gap-4 px-4 py-10" aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-gray-200" />
      <span className="flex items-center gap-2 whitespace-nowrap rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-blue-700">
        <Mountain size={12} />
        {waypoint.m} m · {waypoint.place}
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-200 to-gray-200" />
    </div>
  );
}

function HeroSlideshow({ slides }) {
  const [index, setIndex] = useState(0);
  const reducedMotion = useRef(
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reducedMotion.current || slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {slides.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          fetchpriority={i === 0 ? "high" : undefined}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out ${i === index ? "opacity-100" : "opacity-0"
            }`}
        />
      ))}
      {/* Slide indicator dots — small but reads as a more finished product */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:bottom-6">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["destinations", { page: 1 }],
    queryFn: () => fetchDestinations({ page: 1, limit: 6 }),
  });

  const { data: filters } = useQuery({
    queryKey: ["destination-filters"],
    queryFn: fetchDestinationFilters,
    staleTime: 1000 * 60 * 10,
  });

  const { data: blogData, isLoading: blogsLoading } = useQuery({
    queryKey: ["blogs", { home: true }],
    queryFn: () => fetchBlogs({ limit: 3 }),
  });

  const totalDestinations = data?.total;
  const postcardDestinations = (data?.data || []).filter((d) => d.gallery?.[0]).slice(0, 5);
  const canonicalUrl = `${SITE_URL}/`;

  const metaDescription =
    "Plan your trip to Nepal with a free, locally verified guide: trekking routes, UNESCO heritage sites, live weather, and real traveler stories from Everest to Pokhara.";

  const valueProps = [
    {
      icon: CloudSun,
      title: "Live mountain weather",
      body: "Five-day forecasts on every destination page, so passes and viewpoints are never a guessing game.",
      chip: "bg-blue-600 text-white",
      ring: "hover:border-blue-200",
    },
    {
      icon: ShieldCheck,
      title: "Verified listings",
      body: "Altitude, entry fees, and best season — reviewed for accuracy before a destination goes live.",
      chip: "bg-emerald-600 text-white",
      ring: "hover:border-emerald-200",
    },
    {
      icon: Users,
      title: "Real traveler stories",
      body: "Read and leave comments from people who've actually made the trip, not just marketing copy.",
      chip: "bg-purple-600 text-white",
      ring: "hover:border-purple-200",
    },
    {
      icon: Navigation2,
      title: "Discover what's near you",
      body: "Turn on location and see verified destinations within 50 km of you, nearest first.",
      chip: "bg-rose-600 text-white",
      ring: "hover:border-rose-200",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Nepal Tourism | Trekking, Culture &amp; Travel Guide to the Himalayas</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="Nepal Tourism | Trekking, Culture & Travel Guide to the Himalayas" />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={HERO_SLIDES[0]} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Nepal Tourism | Trekking, Culture & Travel Guide to the Himalayas" />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={HERO_SLIDES[0]} />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Nepal Tourism",
            url: canonicalUrl,
            description: metaDescription,
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/destinations?search={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          })}
        </script>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TravelAgency",
            name: "Nepal Tourism",
            url: canonicalUrl,
            areaServed: { "@type": "Country", name: "Nepal" },
            description: metaDescription,
          })}
        </script>
      </Helmet>

      {/* ---------------- Hero ----------------
          Mobile: ~55vh so the background photo reads as a landscape strip
          instead of a tall cropped portrait. Grows to a taller, more
          immersive panel from sm/md upward. */}
      <section className="relative isolate flex h-[55vh] min-h-[380px] items-center overflow-hidden sm:h-[70vh] md:h-auto md:min-h-[640px]">
        <HeroSlideshow slides={HERO_SLIDES} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/10" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" aria-hidden="true" />

        <div className="relative mx-auto max-w-4xl px-4 py-10 text-center sm:py-16 md:py-20">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-blue-300/40 bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200 backdrop-blur-sm sm:mb-4">
            <Star size={12} className="fill-blue-200 text-blue-200" /> Nepal Tourism
          </span>
          <h1 className="text-2xl font-normal leading-tight text-white sm:text-4xl md:text-6xl">
            Discover Nepal: trekking, temples <span className="text-blue-300">&amp;</span> the Himalayas
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-200 sm:mt-5 sm:text-base md:text-lg">
            A free, locally verified travel guide — from Everest Base Camp to Kathmandu's
            ancient squares, Pokhara's lakeside, and the jungles of Chitwan.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:mt-8 sm:gap-3">
            <Link
              to="/destinations"
              className="touch-manipulation flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-900/30 transition-all hover:bg-blue-700 hover:shadow-xl active:scale-[0.97] active:bg-blue-800 sm:px-6 sm:py-3"
            >
              Explore destinations <ArrowRight size={15} />
            </Link>
            <Link
              to="/blogs"
              className="touch-manipulation rounded-md border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.97] active:bg-white/30 sm:px-6 sm:py-3"
            >
              Read travel stories
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] font-medium text-gray-200 sm:mt-10 sm:gap-x-6 sm:gap-y-2 sm:text-xs">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-300" /> Verified listings
            </span>
            <span className="flex items-center gap-1.5">
              <CloudSun size={13} className="text-sky-300" /> Live weather
            </span>
          </div>
        </div>
      </section>

      {/* ---------------- Stat strip — dark contrast band right under the hero ---------------- */}
      <section className="border-b border-red-900 bg-gray-800 px-4 py-7">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-3 text-center text-sm text-gray-300">
          <span>
            <strong className="text-lg font-semibold text-blue-400">
              {totalDestinations != null ? totalDestinations : "—"}+
            </strong>{" "}
            destinations catalogued
          </span>
          <span className="hidden text-gray-700 sm:inline">·</span>
          <span>
            <strong className="text-lg font-semibold text-emerald-400">7</strong> provinces, one Himalayan spine
          </span>
          <span className="hidden text-gray-700 sm:inline">·</span>
          <span>
            <strong className="text-lg font-semibold text-amber-400">4</strong> UNESCO World Heritage Sites
          </span>
          <span className="hidden text-gray-700 sm:inline">·</span>
          <span>
            <strong className="text-lg font-semibold text-rose-400">8,849 m</strong> highest point on Earth
          </span>
        </div>
      </section>

      {/* ---------------- About: substantive, unique on-page content for AdSense/SEO ---------------- */}
      <section className="relative overflow-hidden bg-white px-4 py-20">
        {/* Decorative background blobs — purely visual, kept out of the a11y tree */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-50 opacity-70 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-amber-50 opacity-60 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16">
            {/* ---------- Left: narrative + feature checklist ---------- */}
            <div className="lg:col-span-3">
              <Eyebrow icon={Compass} className="bg-blue-50 text-blue-700">
                About the guide
              </Eyebrow>

              <h2 className="mb-5 text-2xl font-normal leading-tight text-gray-900 md:text-4xl">
                A free travel guide,{" "}
                <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                  built for Nepal
                </span>
              </h2>

              <div className="space-y-4 text-gray-600">
                <p className="text-base leading-relaxed">
                  Nepal packs an unusual range of landscape into a small country: the world's
                  highest peaks in the north, subtropical jungle along the southern Terai, and
                  the terraced hill country of the Kathmandu and Pokhara valleys in between.
                  Nepal Tourism exists to make that range easy to plan around.
                </p>
                <p className="text-base leading-relaxed">
                  Whether you're weighing a multi-day trek to Everest Base Camp, a first trip
                  to the temples of Kathmandu Durbar Square, a lakeside stay in Pokhara, or a
                  pilgrimage to the Buddha's birthplace in Lumbini, you'll find live weather,
                  an interactive map, and firsthand comments from other travelers on every
                  destination page — not just a photo and a paragraph.
                </p>
              </div>

              {/* Feature checklist — replaces plain prose with scannable proof points */}
              <ul className="mt-8 space-y-3">
                {[
                  {
                    icon: ShieldCheck,
                    color: "bg-emerald-100 text-emerald-600",
                    title: "Fact-checked before publishing",
                    body: "Altitude, entry fees, and best season verified for every listing.",
                  },
                  {
                    icon: Mountain,
                    color: "bg-blue-100 text-blue-600",
                    title: "Written by people who've been there",
                    body: "No scraped content, no AI-generated filler descriptions.",
                  },
                  {
                    icon: Users,
                    color: "bg-purple-100 text-purple-600",
                    title: "Growing every week",
                    body: "New destinations and trail notes added regularly by our team.",
                  },
                ].map(({ icon: Icon, color, title, body }) => (
                  <li
                    key={title}
                    className="group flex touch-manipulation items-start gap-3 rounded-md p-2.5 transition-colors hover:bg-gray-50 active:bg-gray-100"
                  >
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105 ${color}`}>
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{title}</p>
                      <p className="text-sm text-gray-600">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                to="/destinations"
                className="group mt-8 inline-flex touch-manipulation items-center gap-2 rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-md active:scale-[0.97] active:bg-black"
              >
                See how it's organized
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* ---------- Right: stat panel + floating quote card ---------- */}
            <div className="relative lg:col-span-2">
              <div className="overflow-hidden rounded-lg border border-blue-100 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-900/20 sm:p-8">
                <Sparkles size={20} className="mb-4 text-blue-200" />
                <p className="text-lg font-normal leading-snug">
                  Real travel data, reviewed by a team that actually knows the trails.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    { value: "150+", label: "Verified destinations" },
                    { value: "7", label: "Provinces covered" },
                    { value: "4", label: "UNESCO sites" },
                    { value: "24/7", label: "Live weather data" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-md border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm transition-colors hover:bg-white/15"
                    >
                      <p className="text-xl font-semibold text-white">{stat.value}</p>
                      <p className="mt-0.5 text-xs leading-snug text-blue-100">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating credibility card — overlaps the panel above for depth */}
              <div className="relative z-10 -mt-6 ml-4 mr-4 rounded-md border border-gray-100 bg-white p-4 shadow-lg sm:ml-8 sm:mr-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <Star size={15} className="fill-amber-500 text-amber-500" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Reviewed before it goes live</p>
                    <p className="text-xs text-gray-500">Every listing checked by our editorial team</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Value props — tinted band for visual separation ---------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-slate-50 to-white px-4 py-20">
        {/* Subtle dot-grid texture — adds depth without competing with the cards */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:radial-gradient(circle,#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_40%,transparent_100%)]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Eyebrow icon={Sparkles} className="bg-amber-50 text-amber-700">
              Why travelers use this guide
            </Eyebrow>
            <h2 className="text-2xl text-gray-900 md:text-3xl">Everything before you lace up your boots</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
              Four things every good trip needs — bundled into one page for every destination.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {valueProps.map(({ icon: Icon, title, body, chip, ring }, i) => (
              <div
                key={title}
                className={`group relative touch-manipulation overflow-hidden rounded-lg border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl active:scale-[0.98] active:shadow-md ${CARD_SHADOW}`}
              >
                {/* Oversized ghost numeral — senior-portfolio-style decorative index */}
                <span
                  className="pointer-events-none absolute -right-1 -top-3 select-none text-6xl font-bold text-gray-50 transition-colors duration-300 group-hover:text-gray-100"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Icon — scales and tilts slightly on hover */}
                <div className="relative mb-5">
                  <div
                    className={`relative flex h-12 w-12 items-center justify-center rounded-md shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${chip}`}
                  >
                    <Icon size={20} />
                  </div>
                </div>

                <h3 className="relative text-sm font-semibold text-gray-900">{title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RidgeDivider waypoint={WAYPOINTS[0]} />

      {/* ---------------- Postcards from Nepal ---------------- */}
      {postcardDestinations.length > 0 && (
        <section className="relative overflow-hidden bg-white px-4 py-20">
          {/* Faint corner wash — ties visually to the About section's blobs without repeating them */}
          <div
            className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-rose-50 opacity-60 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-6xl">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow icon={Sparkles} className="bg-rose-50 text-rose-700">
                  Visual preview
                </Eyebrow>
                <h2 className="text-2xl font-normal text-gray-900 md:text-3xl">Postcards from Nepal</h2>
                <p className="mt-2 max-w-md text-sm text-gray-500">
                  A glimpse of what's waiting, straight from our destinations.
                </p>
              </div>
              <Link
                to="/destinations"
                className="touch-manipulation hidden shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 sm:flex"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:grid-rows-2">
              {postcardDestinations.map((dest, i) => (
                <Link
                  key={dest._id}
                  to={`/destinations/${dest.slug}`}
                  className={`group relative block touch-manipulation overflow-hidden rounded-lg ring-1 ring-black/5 transition-all duration-300 active:scale-[0.98] ${CARD_SHADOW} hover:shadow-xl hover:ring-black/10 ${i === 0 ? "col-span-2 row-span-2 h-56 sm:h-64 md:h-full" : "h-28 sm:h-32 md:h-full"
                    }`}
                >
                  <img
                    src={dest.gallery[0]}
                    alt={`${dest.title}, ${dest.province}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-active:scale-105"
                  />

                  {/* Base scrim for text legibility, deepens on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-300 group-hover:from-black/80" />

                  {/* Top-right "view" affordance — subtle discoverability cue for hover-capable devices */}
                  <span className="absolute right-2 top-2 flex h-7 w-7 -translate-y-1 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-hover:bg-white/30 hidden sm:flex">
                    <ArrowRight size={13} className="-rotate-45" />
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                    <p
                      className={`font-medium leading-snug text-white transition-transform duration-300 group-hover:-translate-y-0.5 ${i === 0 ? "text-base sm:text-lg" : "text-xs sm:text-sm"
                        }`}
                    >
                      {dest.title}
                    </p>
                    <p
                      className={`mt-1 flex items-center gap-1 text-gray-200 transition-all duration-300 ${i === 0
                          ? "text-xs opacity-100"
                          : "text-[10px] opacity-0 group-hover:opacity-100 sm:text-[11px]"
                        }`}
                    >
                      <MapPin size={i === 0 ? 11 : 10} /> {dest.province}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              to="/destinations"
              className="touch-manipulation mt-6 flex items-center justify-center gap-1.5 rounded-md border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors active:bg-gray-100 sm:hidden"
            >
              View all destinations <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* ---------------- Featured destinations ---------------- */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow icon={Mountain} className="bg-emerald-50 text-emerald-700">
                Fresh listings
              </Eyebrow>
              <h2 className="text-2xl font-normal text-gray-900 md:text-3xl">Newest destinations</h2>
            </div>
            <Link
              to="/destinations"
              className="touch-manipulation flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100"
            >
              View all destinations <ArrowRight size={14} />
            </Link>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          )}
          {isError && <p className="text-red-600">Couldn't load destinations: {error?.message || "unknown error"}</p>}

          {!isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data?.data?.map((dest) => (
                <DestinationCard key={dest._id} destination={dest} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------------- Explore by region ---------------- */}
      {filters?.provinces?.length > 0 && (
        <section className="bg-white px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <Eyebrow icon={MapPin} className="bg-purple-50 text-purple-700">
              Browse by province
            </Eyebrow>
            <h2 className="mb-8 text-2xl font-normal text-gray-900 md:text-3xl">Explore by region</h2>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {filters.provinces.map((province, i) => {
                const colors = [
                  "bg-blue-50 text-blue-600",
                  "bg-emerald-50 text-emerald-600",
                  "bg-amber-50 text-amber-600",
                  "bg-rose-50 text-rose-600",
                  "bg-purple-50 text-purple-600",
                  "bg-cyan-50 text-cyan-600",
                  "bg-indigo-50 text-indigo-600",
                ];
                const color = colors[i % colors.length];
                return (
                  <Link
                    key={province}
                    to="/destinations"
                    className={`group flex min-w-[180px] shrink-0 touch-manipulation snap-start items-center gap-3 rounded-lg border border-gray-100 bg-white px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${CARD_SHADOW}`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color}`}>
                      <MapPin size={16} />
                    </span>
                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 group-active:text-blue-800">
                      {province}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <RidgeDivider waypoint={WAYPOINTS[1]} />

      {/* ---------------- Weather teaser ---------------- */}
      <section className="bg-gray-50 px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-lg bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 shadow-lg shadow-blue-900/20 lg:grid-cols-2 lg:p-10">
            <div>
              <Eyebrow icon={CloudSun} className="border border-white/30 bg-white/10 text-sky-100 backdrop-blur-sm">
                Know before you go
              </Eyebrow>
              <h2 className="text-2xl font-normal text-white md:text-3xl">Kathmandu, right now</h2>
              <p className="mt-4 max-w-md text-blue-50">
                Every destination page comes with its own live conditions and five-day
                outlook — but the capital is a good place to start planning your route.
              </p>
              <Link
                to="/destinations"
                className="mt-6 inline-flex touch-manipulation items-center gap-2 rounded-md bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/25 active:scale-[0.97] active:bg-white/30"
              >
                See weather for your destination <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mx-auto w-full max-w-sm">
              <WeatherWidget lat={27.7172} lng={85.324} />
            </div>
          </div>
        </div>
      </section>

      <RidgeDivider waypoint={WAYPOINTS[2]} />

      {/* ---------------- Blog highlights ---------------- */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow icon={Sparkles} className="bg-blue-50 text-blue-700">
                From the field notebook
              </Eyebrow>
              <h2 className="text-2xl font-normal text-gray-900 md:text-3xl">Stories from the trail</h2>
            </div>
            <Link
              to="/blogs"
              className="touch-manipulation flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100"
            >
              Read all stories <ArrowRight size={14} />
            </Link>
          </div>

          {blogsLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          )}

          {!blogsLoading && blogData?.data?.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogData.data.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>
          )}

          {!blogsLoading && blogData?.data?.length === 0 && (
            <p className="flex items-center gap-2 text-sm text-gray-600">
              <BookOpen size={15} /> No stories published yet — check back soon.
            </p>
          )}
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="bg-gray-50 px-4 pb-20 pt-4">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-14 text-center shadow-lg shadow-blue-900/20">
          <span className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
            <Compass size={20} />
          </span>
          <h2 className="text-2xl font-normal text-white md:text-3xl">Your Himalaya story starts here</h2>
          <p className="mx-auto mt-4 max-w-md text-blue-100">
            Sign in to save favorites, leave comments on the places you've visited, and
            get a feel for Nepal before you land.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/destinations"
              className="touch-manipulation flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium text-blue-700 transition-all hover:bg-blue-50 hover:shadow-lg active:scale-[0.97] active:bg-blue-100"
            >
              Start exploring <ArrowRight size={15} />
            </Link>
            <Link
              to="/blogs"
              className="touch-manipulation rounded-md border border-white/40 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.97] active:bg-white/30"
            >
              Browse the blog
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}