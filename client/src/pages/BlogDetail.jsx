import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Clock, Eye, CalendarDays } from "lucide-react";
import { useEffect, useRef } from "react";
import { fetchBlogBySlug, toggleBlogLike } from "../services/blogService.js";
import LikeButton from "../components/LikeButton.jsx";
import CommentSection from "../components/CommentSection.jsx";
import BlogCard from "../components/BlogCard.jsx";
import { DetailSkeleton } from "../components/LoadingState.jsx";

const SITE_URL = "https://www.nepaltourism.example";

// Word-boundary truncation so meta descriptions never cut mid-word —
// Google renders roughly 150-160 chars of a snippet.
function truncate(str = "", max = 155) {
  if (str.length <= max) return str;
  const cut = str.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

export default function BlogDetail() {
  const { slug } = useParams();
  const hasTrackedView = useRef(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["blog", slug],
    queryFn: () => fetchBlogBySlug(slug),
  });

  useEffect(() => {
    if (!data?.data?._id || hasTrackedView.current) return;

    hasTrackedView.current = true;
    const viewedAt = window.sessionStorage.getItem(`blog-view:${data.data._id}`);
    if (!viewedAt) {
      window.sessionStorage.setItem(`blog-view:${data.data._id}`, "1");
    }
  }, [data]);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !data) return <p className="py-16 text-center text-red-600">Blog not found.</p>;

  const blog = data.data;
  const canonicalUrl = blog.seo?.canonicalUrl || `${SITE_URL}/blogs/${blog.slug}`;
  const metaTitle = blog.seo?.metaTitle || blog.title;
  const metaDescription = truncate(blog.seo?.metaDescription || blog.excerpt || blog.title);
  const ogImage = blog.seo?.ogImage || blog.featuredImage;
  const publishedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;
  const updatedDate = blog.updatedAt
    ? new Date(blog.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Helmet>
        <title>{`${metaTitle} | Nepal Tourism Blog`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="article" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {blog.publishedAt && <meta property="article:published_time" content={blog.publishedAt} />}
        {blog.updatedAt && <meta property="article:modified_time" content={blog.updatedAt} />}
        {blog.category?.name && <meta property="article:section" content={blog.category.name} />}
        {blog.tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}

        {/* Article structured data — eligible for Google's article rich results */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: blog.title,
            description: metaDescription,
            image: ogImage ? [ogImage] : undefined,
            datePublished: blog.publishedAt,
            dateModified: blog.updatedAt || blog.publishedAt,
            author: { "@type": "Person", name: blog.author?.name || "Nepal Tourism" },
            publisher: {
              "@type": "Organization",
              name: "Nepal Tourism",
              logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
            },
            mainEntityOfPage: canonicalUrl,
          })}
        </script>

        {/* Breadcrumbs */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Blogs", item: `${SITE_URL}/blogs` },
              { "@type": "ListItem", position: 3, name: blog.title, item: canonicalUrl },
            ],
          })}
        </script>
      </Helmet>

      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-gray-600">
        <Link to="/" className="touch-manipulation transition-colors hover:text-blue-600 active:text-blue-700">
          Home
        </Link>{" "}
        /{" "}
        <Link to="/blogs" className="touch-manipulation transition-colors hover:text-blue-600 active:text-blue-700">
          Blogs
        </Link>{" "}
        / <span className="text-gray-900">{blog.title}</span>
      </nav>

      {blog.category?.name && (
        <Link
          to="/blogs"
          className="touch-manipulation text-xs font-medium text-blue-600 transition-colors hover:underline active:text-blue-800"
        >
          {blog.category.name}
        </Link>
      )}
      <h1 className="mb-3 mt-2 text-3xl font-normal leading-tight text-gray-900">{blog.title}</h1>

      <div className="mb-1 flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <span>{blog.author?.name}</span>
        <span className="flex items-center gap-1">
          <Clock size={12} /> {blog.readingTimeMinutes} min read
        </span>
        <span className="flex items-center gap-1">
          <Eye size={12} /> {blog.views} views
        </span>
      </div>
      {publishedDate && (
        <p className="mb-8 flex items-center gap-1 text-xs text-gray-400">
          <CalendarDays size={12} />
          Published {publishedDate}
          {updatedDate && updatedDate !== publishedDate ? ` · Updated ${updatedDate}` : ""}
        </p>
      )}

      {blog.featuredImage && (
        <img
          src={blog.featuredImage}
          alt={blog.title}
          loading="eager"
          fetchpriority="high"
          className="mb-8 aspect-[16/9] w-full rounded-lg object-cover"
        />
      )}

      <div className="prose max-w-none whitespace-pre-line text-base leading-relaxed text-gray-900">
        {blog.content}
      </div>

      {blog.tags?.length > 0 && (
        <div className="mb-2 mt-6 flex flex-wrap gap-2">
          {blog.tags.map((tag) => (
            <span
              key={tag}
              className="touch-manipulation rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition-transform active:scale-90"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6">
        <LikeButton
          targetId={blog._id}
          liked={data.isLikedByCurrentUser}
          likesCount={blog.likesCount}
          toggleFn={toggleBlogLike}
          queryKeyToInvalidate={["blog", slug]}
        />
      </div>

      {data.relatedPosts?.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Related posts</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {data.relatedPosts.map((post) => (
              <BlogCard key={post._id} blog={post} />
            ))}
          </div>
        </section>
      )}

      <CommentSection targetType="Blog" targetId={blog._id} />
    </article>
  );
}