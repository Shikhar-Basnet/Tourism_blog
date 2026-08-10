import { Link } from "react-router-dom";
import { MapPin, Navigation2, Heart, Sparkle } from "lucide-react";

export default function DestinationCard({ destination, distanceKm }) {
  const cover = destination.gallery?.[0];
  const coverSrc = typeof cover === "string" ? cover : cover?.medium;
  const primaryCategory = destination.category?.[0];

  return (
    <Link
      to={`/destinations/${destination.slug}`}
      className="group flex touch-manipulation flex-col overflow-hidden rounded-lg bg-white shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] active:shadow-sm"
    >
      {/* Fixed 16:10 ratio — identical class on BlogCard + CardSkeleton */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
        {destination.featured && (
          <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md bg-amber-500/95 px-2 py-1 text-[11px] font-medium text-white shadow">
            <Sparkle size={11} /> Featured
          </span>
        )}
        {distanceKm != null && (
          <span className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-blue-600/95 px-2.5 py-1 text-xs font-medium text-white shadow">
            <Navigation2 size={11} /> {distanceKm} km
          </span>
        )}
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={`${destination.title}, ${destination.province}, Nepal`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 group-active:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">No image yet</div>
        )}
      </div>

      <div className="p-3.5">
        {/* Category — h-4, matches BlogCard + skeleton exactly */}
        <div className="mb-1 h-4">
          <span className="block truncate text-xs font-medium leading-4 text-blue-600">
            {primaryCategory || "\u00A0"}
          </span>
        </div>

        {/* Title — h-10 (2 lines @ leading-5), never grows past this */}
        <h3 className="mb-1.5 h-10 overflow-hidden text-sm font-medium leading-5 text-gray-900 line-clamp-2 transition-colors group-hover:text-blue-700">
          {destination.title}
        </h3>

        {/* Description — h-8 (2 lines @ leading-4) */}
        <p className="mb-2.5 h-8 overflow-hidden text-xs leading-4 text-gray-600 line-clamp-2">
          {destination.description}
        </p>

        {/* Footer — h-4, two stats, same shape as BlogCard's footer */}
        <div className="flex h-4 items-center justify-between border-t border-gray-100 pt-2.5 text-xs leading-4 text-gray-600">
          <span className="flex min-w-0 items-center gap-1 truncate">
            <MapPin size={12} className="shrink-0" /> <span className="truncate">{destination.province}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <Heart size={12} /> {destination.likesCount ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}