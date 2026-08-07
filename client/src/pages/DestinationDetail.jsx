import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useEffect, useRef } from "react";
import {
  MapPin,
  Mountain,
  Wallet,
  CalendarClock,
  Ticket,
  Compass,
  Images,
} from "lucide-react";
import { DetailSkeleton } from "../components/LoadingState.jsx";
import { fetchDestinationBySlug, toggleDestinationLike } from "../services/destinationService.js";
import WeatherWidget from "../components/WeatherWidget.jsx";
import DestinationMap from "../components/DestinationMap.jsx";
import LikeButton from "../components/LikeButton.jsx";
import CommentSection from "../components/CommentSection.jsx";
import RelatedDestinations from "../components/RelatedDestinations.jsx";

// Icon "chip" backgrounds — one accent per fact type, so the page reads
// as more than a wall of gray-and-blue. Written as full literal class
// strings (not built with template interpolation) so Tailwind's compiler
// can see and keep them.
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

// A single row in the infobox's quick-facts table — the Wikipedia-style
// "key on the left, value on the right" pattern.
function FactRow({ icon: Icon, label, value, chip = CHIP.location }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-gray-600">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${chip}`}>
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
    <div className="rounded-xl bg-white p-4 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full ${chip}`}>
        <Icon size={16} />
      </div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

const formatNpr = (amount) =>
  amount === 0 ? "Free" : `Rs. ${Number(amount).toLocaleString("en-IN")}`;

// The infobox card — shared between the mobile inline placement (right after
// "At a glance") and the desktop sticky sidebar, so the two never drift apart.
function OverviewCard({ dest, hasEntryFee }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
      <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
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
        <div className="mt-4 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 p-3">
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

  return (
    <div className="bg-gray-50">
      <Helmet>
        <title>{dest.title} | Nepal Tourism</title>
        <meta name="description" content={dest.description} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            name: dest.title,
            description: dest.description,
            address: { "@type": "PostalAddress", addressRegion: dest.province },
            geo: {
              "@type": "GeoCoordinates",
              latitude: dest.coordinates?.lat,
              longitude: dest.coordinates?.lng,
            },
          })}
        </script>
      </Helmet>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <nav className="mb-4 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600">Home</Link> {" / "}
          <Link to="/destinations" className="hover:text-blue-600">Destinations</Link> {" / "}
          <span className="text-gray-900">{dest.title}</span>
        </nav>

        {/* Wikipedia-style layout on desktop: article column (with a large lead
            photo) on the left, a sticky infobox + supporting panels on the
            right. On mobile (grid-cols-1) everything stacks in DOM order, so
            that order is deliberately curated below: photo → read → quick
            facts → full overview → weather → directions → tags → engagement. */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* ---------------- Left / center: the article (2 of 3 columns on desktop) ---------------- */}
          <article className="min-w-0 lg:col-span-2">
            <h1 className="mb-2 text-3xl font-normal leading-tight text-gray-900 sm:text-4xl">
              {dest.title}
            </h1>
            <p className="mb-6 flex items-center gap-1 text-sm text-gray-600">
              <MapPin size={14} /> {dest.province}
              {dest.district ? `, ${dest.district}` : ""}
            </p>

            {/* 1. Large lead photo — the dominant visual, first thing seen on any screen */}
            <div className="mb-8 h-64 overflow-hidden rounded-2xl shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] sm:h-72 lg:h-80">
              {dest.gallery?.[0] ? (
                <img
                  src={dest.gallery[0]}
                  alt={dest.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-600">
                  No image yet
                </div>
              )}
            </div>

            {/* 2. Description + gallery — the read, right after the hero image */}
            <p className="mb-4 whitespace-pre-line text-base leading-relaxed text-gray-900">
              {dest.description}
            </p>

            {dest.gallery?.length > 1 && (
              <section className="mb-10">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-medium text-gray-900">
                  <Images size={18} className="text-blue-600" /> Gallery
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {dest.gallery.slice(1).map((src, i) => (
                    <div key={src + i} className="aspect-square overflow-hidden rounded-xl bg-gray-100">
                      <img src={src} alt={`${dest.title} ${i + 2}`} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. At a glance — the skimmable quick facts */}
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-medium text-gray-900">At a glance</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <InfoCard icon={CalendarClock} label="Best time to visit" value={dest.bestTimeToVisit} chip={CHIP.time} />
                <InfoCard icon={Mountain} label="Altitude" value={dest.altitude ? `${dest.altitude} m` : undefined} chip={CHIP.altitude} />
                <InfoCard icon={Wallet} label="Budget" value={dest.budgetEstimate?.budget} chip={CHIP.money} />
                <InfoCard icon={Wallet} label="Mid-range" value={dest.budgetEstimate?.midRange} chip={CHIP.money} />
              </div>
            </section>

            {/* 4. Destination overview — mobile only here, right after the quick
                facts they expand on. On lg+ this same card lives in the sticky
                sidebar instead, so it's hidden here to avoid rendering twice. */}
            <section className="mb-10 lg:hidden">
              <OverviewCard dest={dest} hasEntryFee={hasEntryFee} />
            </section>

            {/* 5. Weather */}
            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <Compass size={14} />
                </span>
                Weather
              </h2>
              <WeatherWidget lat={dest.coordinates?.lat} lng={dest.coordinates?.lng} />
            </section>

            {/* 6. Map & directions — mobile only here; the desktop map lives in
                the sidebar, kept in view via position: sticky the whole time. */}
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
                    className={`rounded-full px-3 py-1 text-xs font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 8. Engagement — like, then comments, last: act only after reading */}
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
            <RelatedDestinations destinationId={dest._id} />
          </article>

          {/* ---------------- Right: sticky infobox sidebar — desktop only (1 of 3 columns) ---------------- */}
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