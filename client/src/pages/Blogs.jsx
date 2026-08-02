import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { fetchBlogs } from "../services/blogService.js";
import { fetchCategories } from "../services/categoryService.js";
import BlogCard from "../components/BlogCard.jsx";
import { CardSkeleton } from "../components/LoadingState.jsx";

export default function Blogs() {
  const [category, setCategory] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["blogs", { category }],
    queryFn: () => fetchBlogs({ category: category || undefined, limit: 9 }),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Helmet>
        <title>Travel Blogs | Nepal Tourism</title>
        <meta name="description" content="Travel guides, trekking tips, and stories from across Nepal." />
      </Helmet>

      <h1 className="mb-6 text-2xl font-normal text-gray-900">Travel Blogs</h1>

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("")}
          className={`rounded-full border px-4 py-1.5 text-sm ${
            category === ""
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-gray-300 text-gray-900 hover:bg-gray-50"
          }`}
        >
          All
        </button>
        {categories?.map((c) => (
          <button
            key={c._id}
            onClick={() => setCategory(c._id)}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              category === c._id
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 text-gray-900 hover:bg-gray-50"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      )}
      {isError && <p className="text-red-600">Couldn't load blogs.</p>}
      {data && data.data.length === 0 && <p className="text-gray-600">No blog posts yet.</p>}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data?.map((blog) => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      )}
    </div>
  );
}