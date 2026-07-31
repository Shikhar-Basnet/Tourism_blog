import { MapPin } from "lucide-react";

export default function DestinationCard({ destination }) {
  return (
    <div className="bg-white rounded-2xl shadow-google hover:shadow-google-hover transition-shadow duration-200 overflow-hidden cursor-pointer">
      <div className="h-40 bg-google-grey-100 flex items-center justify-center text-google-grey-600 text-sm">
        {destination.gallery?.[0] ? (
          <img
            src={destination.gallery[0]}
            alt={destination.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          "No image yet"
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-base text-google-grey-900">{destination.title}</h3>
        <p className="flex items-center gap-1 text-sm text-google-grey-600 mt-1">
          <MapPin size={14} /> {destination.province}
        </p>
        <p className="text-sm text-google-grey-600 mt-2 line-clamp-2">{destination.description}</p>
      </div>
    </div>
  );
}
