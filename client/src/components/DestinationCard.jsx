import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

export default function DestinationCard({ destination }) {
  return (
    <Link
      to={`/destinations/${destination.slug}`}
      className="block overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] transition-shadow duration-200 hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)]"
    >
      <div className="flex h-40 items-center justify-center bg-gray-100 text-sm text-gray-600">
        {destination.gallery?.[0] ? (
          <img
            src={destination.gallery[0]}
            alt={destination.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          "No image yet"
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-medium text-gray-900">{destination.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
          <MapPin size={14} /> {destination.province}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{destination.description}</p>
      </div>
    </Link>
  );
}