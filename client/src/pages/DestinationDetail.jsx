import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  Mountain,
  Wallet,
  CalendarClock,
  Ticket,
  Compass,
  Images,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  CalendarDays,
} from "lucide-react";
import { DetailSkeleton } from "../components/LoadingState.jsx";
import { fetchDestinationBySlug, toggleDestinationLike } from "../services/destinationService.js";
import WeatherWidget from "../components/WeatherWidget.jsx";
import DestinationMap from "../components/DestinationMap.jsx";
import LikeButton from "../components/LikeButton.jsx";
import CommentSection from "../components/CommentSection.jsx";
import RelatedDestinations from "../components/RelatedDestinations.jsx";

// TODO: point this at your real production domain — feeds canonical/OG URLs.
const SITE_URL = "https://www.nepaltourism.example";

const CHIP = {
  location: "bg-rose-100 text-rose-600",
  altitude: "bg-purple-100 text-purple-600",
  time: "bg-amber-100 text-amber-600",
  money: "bg-emerald-100 text-emerald-600",
};

const TAG_COLORS = [
  "bg-blue-50 text-blue-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-purple-50 text-purple-700",
  "bg-cyan-50 text-cyan-700",
];

// Truncates on a word boundary so meta descriptions never cut mid-word —
// Google typically renders ~150-160 chars in search snippets.
function truncate(str = "", max = 155) {
  if (str.length <= max) return str;
  const cut = str.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

function FactRow({ icon: Icon, label, value, chip = CHIP.location }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-gray-600">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${chip}`}>
          <Icon size={14} />
        </span>
        {label}
      </span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, chip = CHIP.location }) {
  if (!value) return null;
  return (
    <div className="touch-manipulation rounded-lg bg-white p-4 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] transition-transform active:scale-[0.97]">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded ${chip}`}>
        <Icon size={16} />
      </div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

const formatNpr = (amount) =>
  amount === 0 ? "Free" : `Rs. ${Number(amount).toLocaleString("en-IN")}`;

function OverviewCard({ dest, hasEntryFee }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-5 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
      <p className="mb-3 inline-flex items-center gap-1.5 rounded bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
        <Compass size={12} /> Destination overview
      </p>
      <h2 className="mb-3 text-lg font-medium leading-snug text-gray-900">{dest.title}</h2>

      <div className="divide-y divide-gray-100 border-t border-gray-100">
        <FactRow icon={MapPin} label="Province" value={dest.province} chip={CHIP.location} />
        <FactRow icon={MapPin} label="District" value={dest.district} chip={CHIP.location} />
        <FactRow icon={Mountain} label="Altitude" value={dest.altitude ? `${dest.altitude} m` : undefined} chip={CHIP.altitude} />
        <FactRow icon={CalendarClock} label="Best time" value={dest.bestTimeToVisit} chip={CHIP.time} />
        <FactRow icon={Wallet} label="Budget" value={dest.budgetEstimate?.budget} chip={CHIP.money} />
        <FactRow icon={Wallet} label="Mid-range" value={dest.budgetEstimate?.midRange} chip={CHIP.money} />
        <FactRow icon={Wallet} label="Luxury" value={dest.budgetEstimate?.luxury} chip={CHIP.money} />
      </div>

      {hasEntryFee && (
        <div className="mt-4 rounded bg-gradient-to-br from-pink-50 to-rose-50 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-rose-700">
            <Ticket size={13} /> Entry fee
          </p>
          <div className="flex justify-between text-xs text-gray-900">
            <span>Nepali / SAARC</span>
            <span className="font-semibold text-rose-700">{formatNpr(dest.entryFee.npr)}</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-900">
            <span>Foreigner</span>
            <span className="font-semibold text-rose-700">{formatNpr(dest.entryFee.foreigner)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Landscape single-row image slider ----------------
// Hero/thumbnail image (gallery[0]) is rendered separately, unchanged, above
// the article. This slider covers every OTHER gallery photo (index 1+),
// each shown at a fixed landscape ratio (16:9) so the row never jumps
// around as different-shaped source photos load in — good for CLS, which
// is part of Google's Core Web Vitals ranking signal.
function GallerySlider({ images, title }) {
  const trackRef = useRef(null);
  const [loaded, setLoaded] = useState(() => new Set());
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const markLoaded = (i) =>
    setLoaded((prev) => {
      const next = new Set(prev);
      next.add(i);
      return next;
    });

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateEdges();
  }, [images, updateEdges]);

  const scrollByCard = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector("[data-slide]");
    const amount = (card?.offsetWidth || el.clientWidth) + 12; // + gap
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (!images.length) return null;

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-medium text-gray-900">
          <Images size={18} className="text-blue-600" /> Gallery
        </h2>
        <span className="text-xs text-gray-500">{images.length} photo{images.length === 1 ? "" : "s"}</span>
      </div>

      <div className="relative">
        {/* Prev/next — always tappable on mobile, fade in on hover for desktop */}
        <button
          type="button"
          aria-label="Previous photo"
          onClick={() => scrollByCard(-1)}
          disabled={atStart}
          className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 touch-manipulation items-center justify-center rounded-full bg-white/90 p-2 text-gray-700 shadow-md transition-all hover:bg-white active:scale-90 disabled:pointer-events-none disabled:opacity-0 sm:flex"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label="Next photo"
          onClick={() => scrollByCard(1)}
          disabled={atEnd}
          className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 touch-manipulation items-center justify-center rounded-full bg-white/90 p-2 text-gray-700 shadow-md transition-all hover:bg-white active:scale-90 disabled:pointer-events-none disabled:opacity-0 sm:flex"
        >
          <ChevronRight size={18} />
        </button>

        <div
          ref={trackRef}
          onScroll={updateEdges}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <div
              key={src + i}
              data-slide
              className="relative aspect-[16/9] w-[85%] shrink-0 snap-start overflow-hidden rounded-md bg-gray-100 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] sm:w-[60%] md:w-[45%] lg:w-[38%]"
            >
              {!loaded.has(i) && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />
              )}
              <img
                src={src}
                alt={`${title} — photo ${i + 2} of ${images.length + 1}`}
                loading="lazy"
                decoding="async"
                onLoad={() => markLoaded(i)}
                className={`h-full w-full touch-manipulation object-cover transition-all duration-300 active:scale-[0.98] ${
                  loaded.has(i) ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Generic-but-genuinely-useful FAQ content built from real destination data —
// adds unique, indexable text per page (helps both SEO and AdSense content
// depth) and doubles as FAQPage structured data for rich results.
function buildFaqs(dest) {
  const faqs = [];

  faqs.push({
    q: `Where is ${dest.title} located?`,
    a: `${dest.title} is located in ${dest.district ? `${dest.district}, ` : ""}${dest.province} Province, Nepal.`,
  });

  if (dest.bestTimeToVisit) {
    faqs.push({
      q: `What is the best time to visit ${dest.title}?`,
      a: `The best time to visit is ${dest.bestTimeToVisit}, when conditions are most favorable for travel and sightseeing.`,
    });
  }

  if (dest.altitude) {
    faqs.push({
      q: `How high is ${dest.title}?`,
      a: `${dest.title} sits at an altitude of approximately ${dest.altitude} meters above sea level.`,
    });
  }

  if (dest.entryFee && (dest.entryFee.npr > 0 || dest.entryFee.foreigner > 0)) {
    faqs.push({
      q: `How much does it cost to visit ${dest.title}?`,
      a: `Entry costs ${formatNpr(dest.entryFee.npr)} for Nepali/SAARC visitors and ${formatNpr(dest.entryFee.foreigner)} for foreign visitors.`,
    });
  } else {
    faqs.push({
      q: `Is there an entry fee for ${dest.title}?`,
      a: `No, ${dest.title} does not charge an entry fee.`,
    });
  }

  if (dest.budgetEstimate?.midRange) {
    faqs.push({
      q: `How much should I budget per day at ${dest.title}?`,
      a: `A mid-range daily budget is around ${dest.budgetEstimate.midRange}, covering accommodation, food, and local transport.`,
    });
  }

  return faqs;
}

export default function DestinationDetail() {
  const { slug } = useParams();
  const hasTrackedView = useRef(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["destination", slug],
    queryFn: () => fetchDestinationBySlug(slug),
  });

  useEffect(() => {
    if (!data?.data?._id || hasTrackedView.current) return;

    hasTrackedView.current = true;
    const viewedAt = window.sessionStorage.getItem(`destination-view:${data.data._id}`);
    if (!viewedAt) {
      window.sessionStorage.setItem(`destination-view:${data.data._id}`, "1");
    }
  }, [data]);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !data) return <p className="py-16 text-center text-red-600">Destination not found.</p>;

  const dest = data.data;
  const hasEntryFee = dest.entryFee && (dest.entryFee.npr > 0 || dest.entryFee.foreigner > 0);
  const hasCoords = dest.coordinates?.lat != null && dest.coordinates?.lng != null;
  const restOfGallery = (dest.gallery || []).slice(1);
  const faqs = buildFaqs(dest);

  const canonicalUrl = `${SITE_URL}/destinations/${dest.slug}`;
  const metaDescription = truncate(
    dest.description || `Plan your visit to ${dest.title}, ${dest.province}, Nepal — altitude, budget, best time to go, and traveler tips.`
  );
  const heroImage = dest.gallery?.[0];
  const lastUpdated = dest.updatedAt
    ? new Date(dest.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="bg-gray-50">
      <Helmet>
        <title>{`${dest.title} Travel Guide — ${dest.province}, Nepal | Nepal Tourism`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph / Twitter — improves click-through from search & social,
            which is a real (if indirect) SEO signal, and is generally
            expected by AdSense reviewers as a sign of a maintained site. */}
        <meta property="og:type" content="place" />
        <meta property="og:title" content={`${dest.title} — Travel Guide`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        {heroImage && <meta property="og:image" content={heroImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${dest.title} — Travel Guide`} />
        <meta name="twitter:description" content={metaDescription} />
        {heroImage && <meta name="twitter:image" content={heroImage} />}

        {/* TouristAttraction structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            name: dest.title,
            description: dest.description,
            url: canonicalUrl,
            image: dest.gallery?.length ? dest.gallery : undefined,
            address: {
              "@type": "PostalAddress",
              addressRegion: dest.province,
              addressLocality: dest.district,
              addressCountry: "NP",
            },
            geo: hasCoords
              ? {
                  "@type": "GeoCoordinates",
                  latitude: dest.coordinates.lat,
                  longitude: dest.coordinates.lng,
                }
              : undefined,
            touristType: dest.category,
          })}
        </script>

        {/* Breadcrumbs — shows a breadcrumb trail directly in Google search results */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE_URL}/destinations` },
              { "@type": "ListItem", position: 3, name: dest.title, item: canonicalUrl },
            ],
          })}
        </script>

        {/* FAQPage — eligible for FAQ rich snippets, plus adds unique text content */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          })}
        </script>
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Visible breadcrumb — matches the JSON-LD above, helps both users and crawlers */}
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-600">
          <Link to="/" className="touch-manipulation transition-colors hover:text-blue-600 active:text-blue-700">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/destinations" className="touch-manipulation transition-colors hover:text-blue-600 active:text-blue-700">
            Destinations
          </Link>{" "}
          / <span className="text-gray-900">{dest.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <article className="min-w-0 lg:col-span-2">
            <h1 className="mb-2 text-3xl font-normal leading-tight text-gray-900 sm:text-4xl">
              {dest.title}
            </h1>
            <p className="mb-1 flex items-center gap-1 text-sm text-gray-600">
              <MapPin size={14} /> {dest.province}
              {dest.district ? `, ${dest.district}` : ""}
            </p>
            {lastUpdated && (
              <p className="mb-6 flex items-center gap-1 text-xs text-gray-400">
                <CalendarDays size={12} /> Guide last updated {lastUpdated}
              </p>
            )}

            {/* 1. Large lead photo — UNCHANGED: still the hero/card thumbnail */}
            <div className="mb-8 h-64 overflow-hidden rounded-lg shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] sm:h-72 lg:h-80">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={`${dest.title}, ${dest.province}, Nepal`}
                  loading="eager"
                  fetchpriority="high"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-600">
                  No image yet
                </div>
              )}
            </div>

            {/* 2. Description */}
            <p className="mb-4 whitespace-pre-line text-base leading-relaxed text-gray-900">
              {dest.description}
            </p>

            {/* 2b. Landscape single-row slider for every other gallery photo */}
            <GallerySlider images={restOfGallery} title={dest.title} />

            {/* 3. At a glance */}
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-medium text-gray-900">At a glance</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <InfoCard icon={CalendarClock} label="Best time to visit" value={dest.bestTimeToVisit} chip={CHIP.time} />
                <InfoCard icon={Mountain} label="Altitude" value={dest.altitude ? `${dest.altitude} m` : undefined} chip={CHIP.altitude} />
                <InfoCard icon={Wallet} label="Budget" value={dest.budgetEstimate?.budget} chip={CHIP.money} />
                <InfoCard icon={Wallet} label="Mid-range" value={dest.budgetEstimate?.midRange} chip={CHIP.money} />
              </div>
            </section>

            {/* 4. Overview — mobile only */}
            <section className="mb-10 lg:hidden">
              <OverviewCard dest={dest} hasEntryFee={hasEntryFee} />
            </section>

            {/* 4b. Planning your trip — original prose combining fields into
                real sentences. This is the single biggest lever for AdSense
                content-depth review: unique, substantive text per page,
                not just a spec table. */}
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-medium text-gray-900">Planning your trip to {dest.title}</h2>
              <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                <p>
                  {dest.title} is situated in {dest.district ? `${dest.district} district, ` : ""}
                  {dest.province} Province
                  {dest.altitude ? `, at an elevation of around ${dest.altitude} meters` : ""}.
                  {dest.bestTimeToVisit
                    ? ` The most rewarding window to visit is ${dest.bestTimeToVisit}, when weather and trail or road conditions are generally most favorable.`
                    : ""}
                </p>
                {(dest.budgetEstimate?.budget || dest.budgetEstimate?.midRange || dest.budgetEstimate?.luxury) && (
                  <p>
                    Daily costs vary by travel style:{" "}
                    {dest.budgetEstimate?.budget && `budget travelers can expect roughly ${dest.budgetEstimate.budget}`}
                    {dest.budgetEstimate?.midRange && `, mid-range travelers around ${dest.budgetEstimate.midRange}`}
                    {dest.budgetEstimate?.luxury && `, and those wanting more comfort closer to ${dest.budgetEstimate.luxury}`}
                    . These figures typically cover accommodation, meals, and local transport.
                  </p>
                )}
                <p>
                  {hasEntryFee
                    ? `Entry costs ${formatNpr(dest.entryFee.npr)} for Nepali/SAARC nationals and ${formatNpr(dest.entryFee.foreigner)} for other foreign visitors.`
                    : `There's no entry fee to visit ${dest.title}, making it an easy addition to a wider Nepal itinerary.`}{" "}
                  Check the live five-day forecast below before you set out, and use the map to plan directions from wherever you're starting.
                </p>
              </div>
            </section>

            {/* 5. Weather */}
            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-sky-100 text-sky-600">
                  <Compass size={14} />
                </span>
                Weather
              </h2>
              <WeatherWidget lat={dest.coordinates?.lat} lng={dest.coordinates?.lng} />
            </section>

            {/* 6. Map & directions — mobile only */}
            {hasCoords && (
              <section className="mb-10 lg:hidden">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Map &amp; directions</h2>
                <DestinationMap lat={dest.coordinates.lat} lng={dest.coordinates.lng} title={dest.title} />
              </section>
            )}

            {/* 7. Tags */}
            {dest.tags?.length > 0 && (
              <div className="mb-8 flex flex-wrap gap-2">
                {dest.tags.map((tag, i) => (
                  <span
                    key={tag}
                    className={`touch-manipulation rounded px-3 py-1 text-xs font-medium transition-transform active:scale-90 ${TAG_COLORS[i % TAG_COLORS.length]}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 8. Engagement */}
            <div className="mb-4 border-t border-gray-200 pt-6">
              <LikeButton
                targetId={dest._id}
                liked={data.isLikedByCurrentUser}
                likesCount={dest.likesCount}
                toggleFn={toggleDestinationLike}
                queryKeyToInvalidate={["destination", slug]}
              />
            </div>

            <CommentSection targetType="Destination" targetId={dest._id} />
            {/* 7b. FAQ — same content backing the FAQPage schema above */}
            <section className="my-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                <HelpCircle size={18} className="text-blue-600" /> Frequently asked questions
              </h2>
              <div className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white">
                {faqs.map((f) => (
                  <details key={f.q} className="group touch-manipulation p-4 open:bg-gray-50">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-gray-900 marker:content-none">
                      {f.q}
                      <ChevronRight
                        size={16}
                        className="ml-2 shrink-0 text-gray-400 transition-transform group-open:rotate-90"
                      />
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
            <RelatedDestinations destinationId={dest._id} />
          </article>

          {/* ---------------- Sticky sidebar — desktop only ---------------- */}
          <aside className="hidden lg:col-span-1 lg:sticky lg:top-20 lg:block lg:self-start">
            <OverviewCard dest={dest} hasEntryFee={hasEntryFee} />

            {hasCoords && (
              <div className="mt-6">
                <DestinationMap lat={dest.coordinates.lat} lng={dest.coordinates.lng} title={dest.title} height="280px" />
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}