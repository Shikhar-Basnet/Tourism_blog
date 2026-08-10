import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Search, MapPin } from "lucide-react";
import { fetchDestinations, fetchDestinationFilters } from "../services/destinationService.js";
import { useDebounce } from "../hooks/useDebounce.js";
import { useNearMe } from "../hooks/useNearMe.js";
import DestinationCard from "../components/DestinationCard.jsx";
import NearMeButton from "../components/NearMeButton.jsx";
import Pagination from "../components/Pagination.jsx";
import { CardSkeleton } from "../components/LoadingState.jsx";

const LIMIT = 9;
const SITE_URL = "https://www.nepaltourism.example";

export default function Destinations() {
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);
  const { nearby, loading: nearMeLoading, error: nearMeError, locate, clear } = useNearMe();

  const { data: filters } = useQuery({
    queryKey: ["destination-filters"],
    queryFn: fetchDestinationFilters,
    staleTime: 1000 * 60 * 10,
  });

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["destinations", { page, search: debouncedSearch, province, category }],
    queryFn: () =>
      fetchDestinations({
        page,
        limit: LIMIT,
        search: debouncedSearch || undefined,
        province: province || undefined,
        category: category || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const updateAndResetPage = (setter) => (value) => {
    setPage(1);
    setter(value);
  };

  const nearbyIds = new Set((nearby || []).map((d) => d._id));
  const mainList = (data?.data || []).filter((d) => !nearbyIds.has(d._id));

  // Page 1, unfiltered, is the canonical URL — filtered/paginated views stay
  // out of the index to avoid duplicate-content and thin-content pages.
  const isCanonicalView = page === 1 && !search && !province && !category;
  const canonicalUrl = `${SITE_URL}/destinations`;
  const metaDescription =
    "Browse verified destinations across Nepal — filter by province and category, or find spots within 50km of your current location. Altitude, budget, and season for every listing.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Helmet>
        <title>Explore Destinations in Nepal | Nepal Tourism</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {!isCanonicalView && <meta name="robots" content="noindex, follow" />}

        <meta property="og:type" content="website" />
        <meta property="og:title" content="Explore Destinations in Nepal | Nepal Tourism" />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />

        {isCanonicalView && data?.data?.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: data.data.map((dest, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${SITE_URL}/destinations/${dest.slug}`,
                name: dest.title,
              })),
            })}
          </script>
        )}

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Destinations", item: canonicalUrl },
            ],
          })}
        </script>
      </Helmet>

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-gray-500">
        <a href="/" className="transition-colors hover:text-blue-600">Home</a> / <span className="text-gray-900">Destinations</span>
      </nav>

      <h1 className="mb-2 text-2xl font-normal text-gray-900">Explore Destinations</h1>
      <p className="mb-6 max-w-2xl text-sm text-gray-600">
        Every listing below is checked for accuracy — province, altitude, entry fees,
        and the best season to go — so you can plan with real information, not guesswork.
      </p>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => updateAndResetPage(setSearch)(e.target.value)}
            placeholder="Search destinations..."
            className="w-full touch-manipulation rounded-md border border-gray-300 py-2.5 pl-10 pr-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={province}
          onChange={(e) => updateAndResetPage(setProvince)(e.target.value)}
          className="touch-manipulation rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All provinces</option>
          {filters?.provinces?.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={category}
          onChange={(e) => updateAndResetPage(setCategory)(e.target.value)}
          className="touch-manipulation rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-900 transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {filters?.categories?.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <NearMeButton active={!!nearby} loading={nearMeLoading} onClick={locate} onClear={clear} />
      </div>

      {nearMeError && <p className="mb-4 text-sm text-red-600">{nearMeError}</p>}

      {nearby && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Near you</h2>
          {nearby.length === 0 ? (
            <p className="text-sm text-gray-600">Nothing found within 50km. Try exploring below instead.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {nearby.map((dest) => (
                <DestinationCard key={dest._id} destination={dest} distanceKm={dest.distanceKm} />
              ))}
            </div>
          )}
        </section>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: LIMIT }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {isError && <p className="text-red-600">Couldn't load destinations.</p>}

      {!isLoading && mainList.length === 0 && !nearby && (
        <p className="flex items-center gap-2 text-gray-600"><MapPin size={16} /> No destinations match your filters.</p>
      )}

      {!isLoading && mainList.length > 0 && (
        <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          {mainList.map((dest) => <DestinationCard key={dest._id} destination={dest} />)}
        </div>
      )}

      {data && <Pagination page={data.page} pages={data.pages} onPageChange={setPage} />}
    </div>
  );
}