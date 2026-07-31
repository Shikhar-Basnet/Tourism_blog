import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { fetchDestinations } from "../services/destinationService.js";
import DestinationCard from "../components/DestinationCard.jsx";

export default function Home() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["destinations", { page: 1 }],
    queryFn: () => fetchDestinations({ page: 1, limit: 6 }),
  });

  return (
    <>
      <Helmet>
        <title>Nepal Tourism | Discover the Himalayas</title>
        <meta
          name="description"
          content="Explore Nepal's best destinations, trekking routes, wildlife, and travel guides."
        />
      </Helmet>

      {/* Hero */}
      <section className="bg-google-grey-50 py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-normal text-google-grey-900">
          Discover <span className="text-google-blue">Nepal</span>
        </h1>
        <p className="text-google-grey-600 mt-3 max-w-xl mx-auto">
          Mountains, jungles, temples, and trails — plan your next trip with live weather and
          local travel tips.
        </p>
      </section>

      {/* Popular destinations */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-normal text-google-grey-900 mb-6">Popular Destinations</h2>

        {isLoading && <p className="text-google-grey-600">Loading destinations...</p>}
        {isError && (
          <p className="text-google-red">
            Couldn't load destinations: {error?.message || "unknown error"}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.data?.map((dest) => (
            <DestinationCard key={dest._id} destination={dest} />
          ))}
        </div>
      </section>
    </>
  );
}
