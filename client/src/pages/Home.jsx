import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { fetchDestinations } from "../services/destinationService.js";
import DestinationCard from "../components/DestinationCard.jsx";
import { CardSkeleton, PageLoader } from "../components/LoadingState.jsx";

export default function Home() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["destinations", { page: 1 }],
    queryFn: () => fetchDestinations({ page: 1, limit: 6 }),
  });

  return (
    <>
      <Helmet>
        <title>Nepal Tourism | Discover the Himalayas</title>
        <meta name="description" content="Explore Nepal's best destinations, trekking routes, wildlife, and travel guides." />
      </Helmet>

      <section className="bg-gray-50 px-4 py-16 text-center">
        <h1 className="text-4xl font-normal text-gray-900 md:text-5xl">
          Discover <span className="text-blue-600">Nepal</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          Mountains, jungles, temples, and trails — plan your next trip with live weather and local travel tips.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-normal text-gray-900">Popular Destinations</h2>

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
    </>
  );
}
