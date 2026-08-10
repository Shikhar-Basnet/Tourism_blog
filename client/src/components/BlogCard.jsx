import { Link } from "react-router-dom";
import { Clock, Eye } from "lucide-react";

export default function BlogCard({ blog }) {
  return (
    <Link
      to={`/blogs/${blog.slug}`}
      className="group flex touch-manipulation flex-col overflow-hidden rounded-lg bg-white shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] active:shadow-sm"
    >
      {/* Fixed 16:10 ratio — identical class on DestinationCard + CardSkeleton */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
        {blog.featuredImage ? (
          <img
            src={blog.featuredImage}
            alt={`${blog.title} — Nepal Tourism blog`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 group-active:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">No image yet</div>
        )}
      </div>

      <div className="p-3.5">
        {/* Category — h-4, matches DestinationCard + skeleton exactly */}
        <div className="mb-1 h-4">
          <span className="block truncate text-xs font-medium leading-4 text-blue-600">
            {blog.category?.name || "\u00A0"}
          </span>
        </div>

        {/* Title — h-10 (2 lines @ leading-5) */}
        <h3 className="mb-1.5 h-10 overflow-hidden text-sm font-medium leading-5 text-gray-900 line-clamp-2 transition-colors group-hover:text-blue-700">
          {blog.title}
        </h3>

        {/* Description — h-8 (2 lines @ leading-4) */}
        <p className="mb-2.5 h-8 overflow-hidden text-xs leading-4 text-gray-600 line-clamp-2">
          {blog.excerpt}
        </p>

        {/* Footer — h-4, two stats */}
        <div className="flex h-4 items-center justify-between border-t border-gray-100 pt-2.5 text-xs leading-4 text-gray-600">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {blog.readingTimeMinutes} min read
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} /> {blog.views}
          </span>
        </div>
      </div>
    </Link>
  );
}