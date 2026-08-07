import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import DestinationCard from "./DestinationCard.jsx";
import { fetchRelatedDestinations } from "../services/destinationService.js";

export default function RelatedDestinations({ destinationId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["related-destinations", destinationId],
    queryFn: () => fetchRelatedDestinations(destinationId),
    enabled: !!destinationId,
  });

  if (isLoading || !data?.length) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
        <Sparkles size={16} className="text-blue-600" /> You might also like
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {data.map((dest) => <DestinationCard key={dest._id} destination={dest} />)}
      </div>
    </section>
  );
}