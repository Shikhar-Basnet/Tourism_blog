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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Helmet>
        <title>Explore Destinations | Nepal Tourism</title>
        <meta name="description" content="Search and filter destinations across Nepal by province and category." />
      </Helmet>

      <h1 className="mb-6 text-2xl font-normal text-gray-900">Explore Destinations</h1>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => updateAndResetPage(setSearch)(e.target.value)}
            placeholder="Search destinations..."
            className="w-full rounded border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={province}
          onChange={(e) => updateAndResetPage(setProvince)(e.target.value)}
          className="rounded border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All provinces</option>
          {filters?.provinces?.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={category}
          onChange={(e) => updateAndResetPage(setCategory)(e.target.value)}
          className="rounded border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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