import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { fetchBlogs } from "../services/blogService.js";
import { fetchCategories } from "../services/categoryService.js";
import BlogCard from "../components/BlogCard.jsx";
import { CardSkeleton } from "../components/LoadingState.jsx";

const SITE_URL = "https://www.nepaltourism.example";

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

  const activeCategoryName = categories?.find((c) => c._id === category)?.name;
  const isCanonicalView = !category;
  const canonicalUrl = `${SITE_URL}/blogs`;
  const metaDescription = activeCategoryName
    ? `${activeCategoryName} travel stories and guides from Nepal — trekking tips, cultural notes, and firsthand accounts.`
    : "Travel guides, trekking tips, and firsthand stories from across Nepal — from Everest Base Camp to the temples of Kathmandu.";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Helmet>
        <title>{activeCategoryName ? `${activeCategoryName} Travel Blogs` : "Travel Blogs"} | Nepal Tourism</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {!isCanonicalView && <meta name="robots" content="noindex, follow" />}

        <meta property="og:type" content="website" />
        <meta property="og:title" content="Travel Blogs | Nepal Tourism" />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Nepal Tourism Blog",
            url: canonicalUrl,
            description: metaDescription,
          })}
        </script>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Blogs", item: canonicalUrl },
            ],
          })}
        </script>
      </Helmet>

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-gray-500">
        <a href="/" className="transition-colors hover:text-blue-600">Home</a> / <span className="text-gray-900">Blogs</span>
      </nav>

      <h1 className="mb-2 text-2xl font-normal text-gray-900">Travel Blogs</h1>
      <p className="mb-6 max-w-2xl text-sm text-gray-600">
        Trekking notes, planning guides, and firsthand stories from across Nepal —
        written and reviewed by our team, not auto-generated.
      </p>

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("")}
          className={`touch-manipulation rounded-md border px-4 py-1.5 text-sm transition-all active:scale-[0.96] ${
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
            className={`touch-manipulation rounded-md border px-4 py-1.5 text-sm transition-all active:scale-[0.96] ${
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