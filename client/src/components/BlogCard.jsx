import { Link } from "react-router-dom";
import { Clock, Eye } from "lucide-react";

export default function BlogCard({ blog }) {
  return (
    <Link
      to={`/blogs/${blog.slug}`}
      className="block overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] transition-shadow duration-200 hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)]"
    >
      <div className="flex h-40 items-center justify-center bg-gray-100 text-sm text-gray-600">
        {blog.featuredImage ? (
          <img
            src={blog.featuredImage}
            alt={blog.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          "No image yet"
        )}
      </div>
      <div className="p-4">
        {blog.category?.name && (
          <span className="text-xs font-medium text-blue-600">{blog.category.name}</span>
        )}
        <h3 className="mt-1 text-base font-medium text-gray-900">{blog.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{blog.excerpt}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
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