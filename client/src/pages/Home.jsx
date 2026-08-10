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
const SITE_URL = "https://www.nepaltourism.example";

const HERO_SLIDES = [
  "https://res.cloudinary.com/dzvmjk5h/image/upload/v1786271369/nepal-tourism/q1u3k9vfl0jvlfaky714.jpg",
  "https://res.cloudinary.com/dzvmjk5h/image/upload/v1786272089/Pokhara.jpg",
  "https://res.cloudinary.com/dzvmjk5h/image/upload/v1786263080/nepal-tourism/jqgjh5cu5noblna2j6zm.jpg",
  "https://res.cloudinary.com/dzvmjk5h/image/upload/v1786263081/nepal-tourism/zeknd2gmvptdn8zturmy.jpg",
  "https://res.cloudinary.com/dzvmjk5h/image/upload/v1786272077/Mustang.jpg",
];

const WAYPOINTS = [
  { m: "5,364", place: "Everest Base Camp" },
  { m: "1,400", place: "Kathmandu Durbar Square" },
  { m: "822", place: "Pokhara" },
  { m: "74", place: "Janaki Temple" },
];

function RidgeDivider({ waypoint }) {
  return (
    <div className="mx-auto flex items-center gap-4 px-4 py-10" aria-hidden="true">
      <span className="h-px flex-1 bg-gray-200" />
      <span className="flex items-center gap-2 whitespace-nowrap text-xs font-medium uppercase tracking-wide text-gray-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
        {waypoint.m} m · {waypoint.place}
      </span>
      <span className="h-px flex-1 bg-gray-200" />
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
      chip: "bg-blue-50 text-blue-600",
    },
    {
      icon: ShieldCheck,
      title: "Verified listings",
      body: "Altitude, entry fees, and best season — reviewed for accuracy before a destination goes live.",
      chip: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Users,
      title: "Real traveler stories",
      body: "Read and leave comments from people who've actually made the trip, not just marketing copy.",
      chip: "bg-purple-50 text-purple-600",
    },
    {
      icon: Navigation2,
      title: "Discover what's near you",
      body: "Turn on location and see verified destinations within 50 km of you, nearest first.",
      chip: "bg-rose-50 text-rose-600",
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

      {/* ---------------- Hero ---------------- */}
      <section className="relative isolate flex min-h-[520px] items-center overflow-hidden md:min-h-[620px]">
        <HeroSlideshow slides={HERO_SLIDES} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/20" aria-hidden="true" />

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center">
          <p className="mb-3 text-sm font-medium text-blue-300">Nepal Tourism</p>
          <h1 className="text-4xl font-normal leading-tight text-white md:text-6xl">
            Discover Nepal: trekking, temples &amp; the Himalayas
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-200 md:text-lg">
            A free, locally verified travel guide — from Everest Base Camp to Kathmandu's
            ancient squares, Pokhara's lakeside, and the jungles of Chitwan.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/destinations"
              className="touch-manipulation flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.97] active:bg-blue-800"
            >
              Explore destinations <ArrowRight size={15} />
            </Link>
            <Link
              to="/blogs"
              className="touch-manipulation rounded-md border border-white/40 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.97] active:bg-white/30"
            >
              Read travel stories
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-gray-200">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-300" /> Verified listings
            </span>
            <span className="flex items-center gap-1.5">
              <CloudSun size={14} className="text-blue-300" /> Live weather
            </span>
            <span className="flex items-center gap-1.5">
              <Navigation2 size={14} className="text-blue-300" /> 50 km radius search
            </span>
          </div>
        </div>
      </section>

      {/* ---------------- Stat strip ---------------- */}
      <section className="border-b border-gray-200 bg-white px-4 py-7">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-3 text-center text-sm text-gray-600">
          <span>
            <strong className="font-medium text-gray-900">
              {totalDestinations != null ? totalDestinations : "—"}+
            </strong>{" "}
            destinations catalogued
          </span>
          <span className="hidden text-gray-300 sm:inline">·</span>
          <span>
            <strong className="font-medium text-gray-900">7</strong> provinces, one Himalayan spine
          </span>
          <span className="hidden text-gray-300 sm:inline">·</span>
          <span>
            <strong className="font-medium text-gray-900">4</strong> UNESCO World Heritage Sites
          </span>
          <span className="hidden text-gray-300 sm:inline">·</span>
          <span>
            <strong className="font-medium text-gray-900">8,849 m</strong> highest point on Earth
          </span>
        </div>
      </section>

      {/* ---------------- About: substantive, unique on-page content for AdSense/SEO ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-4 text-2xl font-normal text-gray-900">A free travel guide to Nepal</h2>
        <div className="space-y-4 text-gray-600">
          <p>
            Nepal packs an unusual range of landscape into a small country: the world's
            highest peaks in the north, subtropical jungle along the southern Terai, and
            the terraced hill country of the Kathmandu and Pokhara valleys in between.
            Nepal Tourism exists to make that range easy to plan around — every
            destination listed here includes practical details like altitude, entry
            fees, and the best season to visit, checked before it goes live.
          </p>
          <p>
            Whether you're weighing a multi-day trek to Everest Base Camp, a first trip
            to the temples of Kathmandu Durbar Square, a lakeside stay in Pokhara, or a
            pilgrimage to the Buddha's birthplace in Lumbini, you'll find live weather,
            an interactive map, and firsthand comments from other travelers on every
            destination page — not just a photo and a paragraph.
          </p>
          <p>
            New guides and destination write-ups are added regularly, and every listing
            is reviewed by our team before publishing — no scraped listings, no
            auto-generated descriptions.
          </p>
        </div>
      </section>

      {/* ---------------- Value props ---------------- */}
      <section className="mx-auto px-4 pb-16">
        <h2 className="mb-8 text-2xl text-center text-gray-900">Everything before you lace up your boots</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map(({ icon: Icon, title, body, chip }) => (
            <div
              key={title}
              className={`touch-manipulation rounded-lg bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${CARD_SHADOW}`}
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-md ${chip}`}>
                <Icon size={18} />
              </div>
              <h3 className="text-sm font-medium text-gray-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <RidgeDivider waypoint={WAYPOINTS[0]} />

      {/* ---------------- Postcards from Nepal ---------------- */}
      {postcardDestinations.length > 0 && (
        <section className="mx-auto px-4 pb-16">
          <h2 className="mb-2 text-2xl font-normal text-gray-900">Postcards from Nepal</h2>
          <p className="mb-8 text-gray-600">A glimpse of what's waiting, straight from our destinations.</p>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2">
            {postcardDestinations.map((dest, i) => (
              <Link
                key={dest._id}
                to={`/destinations/${dest.slug}`}
                className={`group relative block touch-manipulation overflow-hidden rounded-lg transition-all active:scale-[0.98] ${CARD_SHADOW} hover:shadow-md ${i === 0 ? "col-span-2 row-span-2 h-64 md:h-full" : "h-32 md:h-full"
                  }`}
              >
                <img
                  src={dest.gallery[0]}
                  alt={`${dest.title}, ${dest.province}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 group-active:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3">
                  <p className={`font-medium text-white ${i === 0 ? "text-base" : "text-xs"}`}>{dest.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- Featured destinations ---------------- */}
      <section className="mx-auto px-4 pb-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-normal text-gray-900">Newest destinations</h2>
          <Link
            to="/destinations"
            className="touch-manipulation flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:underline active:text-blue-800"
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
      </section>

      <RidgeDivider waypoint={WAYPOINTS[1]} />

      {/* ---------------- Weather teaser ---------------- */}
      <section className="mx-auto px-4 pb-16">
        <div className={`grid grid-cols-1 items-center gap-8 rounded-lg bg-white p-6 lg:grid-cols-2 lg:p-10 ${CARD_SHADOW}`}>
          <div>
            <p className="mb-2 text-sm font-medium text-blue-600">Know before you go</p>
            <h2 className="text-2xl font-normal text-gray-900">Kathmandu, right now</h2>
            <p className="mt-4 max-w-md text-gray-600">
              Every destination page comes with its own live conditions and five-day
              outlook — but the capital is a good place to start planning your route.
            </p>
            <Link
              to="/destinations"
              className="mt-6 inline-flex touch-manipulation items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:underline active:text-blue-800"
            >
              See weather for your destination <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <WeatherWidget lat={27.7172} lng={85.324} />
          </div>
        </div>
      </section>

      <RidgeDivider waypoint={WAYPOINTS[2]} />

      {/* ---------------- Blog highlights ---------------- */}
      <section className="mx-auto px-4 pb-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-blue-600">
              <Sparkles size={14} /> From the field notebook
            </p>
            <h2 className="text-2xl font-normal text-gray-900">Stories from the trail</h2>
          </div>
          <Link
            to="/blogs"
            className="touch-manipulation flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:underline active:text-blue-800"
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
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="px-4 pb-20">
        <div className="mx-auto rounded-lg bg-blue-50 px-6 py-14 text-center">
          <span className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white">
            <Compass size={20} />
          </span>
          <h2 className="text-2xl font-normal text-gray-900 md:text-3xl">Your Himalaya story starts here</h2>
          <p className="mx-auto mt-4 max-w-md text-gray-600">
            Sign in to save favorites, leave comments on the places you've visited, and
            get a feel for Nepal before you land.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/destinations"
              className="touch-manipulation flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.97] active:bg-blue-800"
            >
              Start exploring <ArrowRight size={15} />
            </Link>
            <Link
              to="/blogs"
              className="touch-manipulation rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:shadow-md active:scale-[0.97] active:bg-gray-50"
            >
              Browse the blog
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}